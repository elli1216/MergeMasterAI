import hashlib
import hmac
import logging
import os

from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from agents.graph import run_pipeline

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()

app = FastAPI(title="MergeMaster AI Backend", version="1.0.0")

# Allow the frontend dashboard (Vite dev server) to call the review endpoint.
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET")


def verify_github_signature(payload_body: bytes, signature_header: str) -> None:
    """
    Validates that the incoming webhook is genuinely from GitHub
    by hashing the payload with the Webhook Secret.
    """
    if not signature_header:
        raise HTTPException(status_code=401, detail="X-Hub-Signature-256 header missing")

    if not GITHUB_WEBHOOK_SECRET:
        logger.warning(
            "GITHUB_WEBHOOK_SECRET is not set in .env. "
            "Skipping signature verification (not production-safe)."
        )
        return

    # The signature from GitHub looks like `sha256=123456789...`
    expected_signature = hmac.new(
        key=GITHUB_WEBHOOK_SECRET.encode(),
        msg=payload_body,
        digestmod=hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(f"sha256={expected_signature}", signature_header):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")


async def _scheduled_pipeline(**kwargs) -> None:
    """Background runner: surface unexpected failures instead of silently
    dropping them (Starlette BackgroundTasks swallow exceptions)."""
    try:
        await run_pipeline(**kwargs)
    except Exception:
        logger.exception("pipeline run failed for %s", kwargs)


@app.post("/api/webhooks/github")
async def github_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    The main entrypoint for GitHub Webhooks.
    """
    # 1. Read and verify the payload
    payload_body = await request.body()
    signature_header = request.headers.get("X-Hub-Signature-256")

    verify_github_signature(payload_body, signature_header)

    # 2. Parse the payload
    payload = await request.json()
    event_type = request.headers.get("X-GitHub-Event")
    delivery_id = request.headers.get("X-GitHub-Delivery", "?")

    logger.info("GitHub event '%s' (delivery=%s)", event_type, delivery_id)

    # 3. Handle specific events (Phase 2 Implementations)
    if event_type == "installation":
        # Handle App installation (when a user adds MergeMaster to a repository)
        action = payload.get("action")
        repositories = payload.get("repositories", [])
        logger.info("App installation '%s' across %s repository(s)", action, len(repositories))
        # TODO: Sync these repositories to the Convex DB

    elif event_type == "pull_request":
        # Handle PR events (opened, synchronized, closed)
        action = payload.get("action")
        pr = payload.get("pull_request", {})
        pr_number = pr.get("number")
        repo_name = payload.get("repository", {}).get("full_name")
        if not isinstance(pr_number, int) or not repo_name:
            logger.warning(
                "pull_request event missing pr number/repo (delivery=%s); ignoring", delivery_id
            )
            return {"status": "ignored"}
        logger.info("Pull Request #%s action: %s on %s", pr_number, action, repo_name)
        if action in ("opened", "synchronize", "reopened", "ready_for_review"):
            # Phase 3: Kick off the LangGraph pipeline in the background
            background_tasks.add_task(
                _scheduled_pipeline,
                repo_name=repo_name,
                pr_number=pr_number,
                title=pr.get("title", ""),
                author=(pr.get("user") or {}).get("login", ""),
            )

    return {"status": "success"}


@app.post("/api/reviews")
async def run_review(request: Request):
    """
    On-demand AI review of a pull request, called by the frontend dashboard.

    Body: { "repo_name": "owner/repo", "pr_number": 12, "github_token": "<optional user OAuth token>" }

    Runs the same LangGraph pipeline as the webhook path and returns the full
    review (findings, risk score, decision, routed reviewers).
    """
    body = await request.json()
    repo_name = (body.get("repo_name") or "").strip()
    pr_number = body.get("pr_number")
    github_token = body.get("github_token") or None
    if not repo_name or not isinstance(pr_number, int):
        raise HTTPException(
            status_code=422, detail="repo_name (str) and pr_number (int) are required"
        )

    state = await run_pipeline(
        repo_name=repo_name,
        pr_number=pr_number,
        title=body.get("title") or "",
        author=body.get("author") or "",
        github_token=github_token,
    )
    return {
        "repo_name": state.get("repo_name"),
        "pr_number": state.get("pr_number"),
        "status": state.get("status"),
        "risk_score": state.get("risk_score"),
        "decision": state.get("decision"),
        "ai_summary": state.get("ai_summary"),
        "reviewers": state.get("reviewers", []),
        "findings": [f.model_dump() for f in state.get("findings", [])],
        "head_sha": state.get("head_sha"),
        "remediation_note": state.get("remediation_note"),
        "error": state.get("error"),
    }


if __name__ == "__main__":
    import uvicorn

    # Run the server on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)