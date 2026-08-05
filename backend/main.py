import os
import hmac
import hashlib
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from dotenv import load_dotenv

from agents.graph import run_pipeline

# Load environment variables from .env
load_dotenv()

app = FastAPI(title="MergeMaster AI Backend", version="1.0.0")

GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET")

def verify_github_signature(payload_body: bytes, signature_header: str):
    """
    Validates that the incoming webhook is genuinely from GitHub
    by hashing the payload with the Webhook Secret.
    """
    if not signature_header:
        raise HTTPException(status_code=401, detail="X-Hub-Signature-256 header missing")
        
    if not GITHUB_WEBHOOK_SECRET:
        print("⚠️ WARNING: GITHUB_WEBHOOK_SECRET is not set in .env. Skipping signature verification (Not recommended for production).")
        return True
        
    # The signature from GitHub looks like `sha256=123456789...`
    expected_signature = hmac.new(
        key=GITHUB_WEBHOOK_SECRET.encode(),
        msg=payload_body,
        digestmod=hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(f"sha256={expected_signature}", signature_header):
        raise HTTPException(status_code=401, detail="Invalid webhook signature")

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
    
    print(f"✅ Received GitHub Event: {event_type}")
    
    # 3. Handle specific events (Phase 2 Implementations)
    if event_type == "installation":
        # Handle App installation (when a user adds MergeMaster to a repository)
        action = payload.get("action")
        repositories = payload.get("repositories", [])
        print(f"📦 App Installation action: {action}")
        print(f"Repositories granted: {[r['name'] for r in repositories]}")
        # TODO: Sync these repositories to the Convex DB
        
    elif event_type == "pull_request":
        # Handle PR events (opened, synchronized, closed)
        action = payload.get("action")
        pr = payload.get("pull_request", {})
        pr_number = pr.get("number")
        repo_name = payload.get("repository", {}).get("full_name")
        print(f"🔄 Pull Request #{pr_number} action: {action} on {repo_name}")
        if action in ("opened", "synchronize", "reopened", "ready_for_review"):
            # Phase 3: Kick off the LangGraph pipeline in the background
            background_tasks.add_task(
                run_pipeline,
                repo_name=repo_name,
                pr_number=pr_number,
                title=pr.get("title", ""),
                author=(pr.get("user") or {}).get("login", ""),
            )
        
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    # Run the server on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
