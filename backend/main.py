import asyncio
import hashlib
import hmac
import logging
import os

from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from agents.graph import run_pipeline
import config
import convex_client
import github_client
import llm_client
import test_generator

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()

app = FastAPI(title="MergeMaster AI Backend", version="1.0.0")

# Allow only the official frontend dashboard and local development origins
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "https://merge-master-ai.vercel.app,http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
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


@app.get("/")
@app.get("/api")
@app.get("/healthz")
@app.get("/api/healthz")
async def health_check():
    """Health check endpoint for Render, Vercel, Docker, and status monitors."""
    return {
        "status": "healthy",
        "service": "mergemaster-ai-backend",
        "version": "1.0.0",
    }


@app.get("/ping")
@app.get("/api/ping")
@app.head("/ping")
@app.head("/api/ping")
async def ping():
    """Keep-alive endpoint for cron jobs and uptime monitors to prevent cold starts."""
    return {"status": "pong"}


@app.post("/webhooks/github")
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

    # 3. Handle specific events
    if event_type == "installation":
        # Handle App installation (when a user adds/removes MergeMaster to/from a repository)
        action = payload.get("action", "")
        repos_raw = payload.get("repositories", [])
        account = (
            payload.get("installation", {}).get("account", {}).get("login")
            or payload.get("account", {}).get("login")
            or "unknown"
        )
        repos_to_sync = [
            {
                "name": r.get("name") or r.get("full_name", "").split("/")[-1],
                "owner": (
                    r.get("full_name", "").split("/")[0]
                    if "/" in r.get("full_name", "")
                    else account
                ),
                "githubRepoId": str(r.get("id")),
            }
            for r in repos_raw
            if r.get("id")
        ]
        logger.info(
            "App installation '%s' for %s repository(s) under owner %s",
            action,
            len(repos_to_sync),
            account,
        )
        if repos_to_sync:
            background_tasks.add_task(
                convex_client.sync_installation_repositories,
                action=action,
                repositories=repos_to_sync,
            )

    elif event_type == "installation_repositories":
        action = payload.get("action", "")
        account = (
            payload.get("installation", {}).get("account", {}).get("login")
            or payload.get("account", {}).get("login")
            or "unknown"
        )
        repos_added = payload.get("repositories_added", [])
        repos_removed = payload.get("repositories_removed", [])
        
        if repos_added:
            added_list = [
                {
                    "name": r.get("name") or r.get("full_name", "").split("/")[-1],
                    "owner": (
                        r.get("full_name", "").split("/")[0]
                        if "/" in r.get("full_name", "")
                        else account
                    ),
                    "githubRepoId": str(r.get("id")),
                }
                for r in repos_added
                if r.get("id")
            ]
            background_tasks.add_task(
                convex_client.sync_installation_repositories,
                action="added",
                repositories=added_list,
            )

        if repos_removed:
            removed_list = [
                {
                    "name": r.get("name") or r.get("full_name", "").split("/")[-1],
                    "owner": (
                        r.get("full_name", "").split("/")[0]
                        if "/" in r.get("full_name", "")
                        else account
                    ),
                    "githubRepoId": str(r.get("id")),
                }
                for r in repos_removed
                if r.get("id")
            ]
            background_tasks.add_task(
                convex_client.sync_installation_repositories,
                action="removed",
                repositories=removed_list,
            )

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
            # Kick off the LangGraph pipeline in the background
            background_tasks.add_task(
                _scheduled_pipeline,
                repo_name=repo_name,
                pr_number=pr_number,
                title=pr.get("title", ""),
                author=(pr.get("user") or {}).get("login", ""),
            )

    return {"status": "success"}


@app.post("/reviews")
@app.post("/api/reviews")
async def run_review(request: Request):
    """
    On-demand AI review of a pull request, called by the frontend dashboard.
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


@app.post("/chat")
@app.post("/api/chat")
async def chat_about_pr(request: Request):
    """
    Interactive PR Q&A Copilot endpoint.
    Body: { "repo_name": "owner/repo", "pr_number": 12, "question": "...", "github_token": "..." }
    """
    body = await request.json()
    repo_name = (body.get("repo_name") or "").strip()
    pr_number = body.get("pr_number")
    question = (body.get("question") or "").strip()
    github_token = body.get("github_token") or None

    if not repo_name or not isinstance(pr_number, int) or not question:
        raise HTTPException(
            status_code=422, detail="repo_name, pr_number, and question are required"
        )

    owner, repo = repo_name.split("/", 1)
    diff_data = await asyncio.to_thread(
        github_client.fetch_pr_diff, owner, repo, pr_number, github_token
    )
    diff_str = diff_data.get("diff", "") if diff_data else "Diff not available."

    system_prompt = (
        "You are MergeMaster AI's Interactive PR Copilot (IBM AI Builders Challenge).\n"
        "You help software engineers and managers understand pull request risks, findings, and remediation.\n"
        "Format your answer cleanly in Markdown (use bullet points, bold text, and syntax-highlighted code blocks where appropriate).\n"
        "Do NOT return JSON. Return natural, human-readable Markdown.\n"
        "Be concise, technical, direct, and reference code specifics when answering.\n"
        f"Pull Request: {repo_name} #{pr_number}\n\n"
        f"Diff Context:\n{diff_str[:30000]}"
    )

    if not (config.LLM_API_BASE and config.GEMINI_API_KEY):
        return {
            "answer": (
                f"MergeMaster AI Copilot (offline mode): PR #{pr_number} on {repo_name} "
                f"contains {len(diff_str)} characters of diff. Connect GEMINI_API_KEY for dynamic LLM reasoning."
            )
        }

    try:
        answer = await llm_client.chat_completions(
            system=system_prompt,
            user=question,
            temperature=0.3,
            json_mode=False,
        )
        return {"answer": answer}
    except Exception as exc:
        logger.warning("chat completions failed: %s", exc)
        return {"answer": f"Unable to generate response: {exc}"}


@app.post("/generate-tests")
@app.post("/api/generate-tests")
async def generate_pr_tests(request: Request):
    """
    Generate unit tests for a pull request.
    Body: { "repo_name": "owner/repo", "pr_number": 12, "title": "...", "github_token": "..." }
    """
    body = await request.json()
    repo_name = (body.get("repo_name") or "").strip()
    pr_number = body.get("pr_number")
    github_token = body.get("github_token") or None

    if not repo_name or not isinstance(pr_number, int):
        raise HTTPException(
            status_code=422, detail="repo_name and pr_number are required"
        )

    owner, repo = repo_name.split("/", 1)
    diff_data = await asyncio.to_thread(
        github_client.fetch_pr_diff, owner, repo, pr_number, github_token
    )
    if not diff_data:
        raise HTTPException(status_code=404, detail="Failed to fetch PR diff")

    tests = await test_generator.generate_tests(
        pr_title=diff_data.get("title") or body.get("title") or "",
        diff=diff_data.get("diff", ""),
        files=diff_data.get("files", []),
    )
    if not tests:
        raise HTTPException(status_code=500, detail="Test generation failed")

    # Save to Convex pull_requests record
    await convex_client.save_generated_tests(
        github_pr_id=str(pr_number),
        repo_name=repo_name,
        generated_tests=tests.model_dump(),
    )

    return tests.model_dump()


@app.post("/push-tests")
@app.post("/api/push-tests")
async def push_pr_tests(request: Request):
    """
    Push generated unit tests directly to the PR branch.
    Body: { "repo_name": "owner/repo", "pr_number": 12, "test_file_path": "...", "test_code": "...", "github_token": "..." }
    """
    body = await request.json()
    repo_name = (body.get("repo_name") or "").strip()
    pr_number = body.get("pr_number")
    test_file_path = (body.get("test_file_path") or "").strip()
    test_code = body.get("test_code") or ""
    github_token = body.get("github_token") or None

    if (
        not repo_name
        or not isinstance(pr_number, int)
        or not test_file_path
        or not test_code
    ):
        raise HTTPException(
            status_code=422,
            detail="repo_name, pr_number, test_file_path, and test_code are required",
        )

    owner, repo = repo_name.split("/", 1)
    diff_data = await asyncio.to_thread(
        github_client.fetch_pr_diff, owner, repo, pr_number, github_token
    )
    head_ref = diff_data.get("head_ref") if diff_data else None
    if not head_ref:
        raise HTTPException(status_code=404, detail="Failed to locate PR head ref")

    commit_sha, msg = await asyncio.to_thread(
        test_generator.push_test_commit,
        repo_name=repo_name,
        head_ref=head_ref,
        test_file_path=test_file_path,
        test_code=test_code,
        github_token=github_token,
    )
    return {"commit_sha": commit_sha, "message": msg}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)