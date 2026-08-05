import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

async def test():
    url = f"{os.getenv('CONVEX_URL').rstrip('/')}/api/mutation"
    key = os.getenv("CONVEX_ADMIN_KEY")
    
    print("Testing with Bearer...")
    resp = httpx.post(
        url,
        json={"path": "pullRequests:updatePullRequestAnalysis", "args": {"github_pr_id": "999", "repo_name": "test", "status": "pending", "risk_score": 0, "ai_summary": "test"}},
        headers={"Authorization": f"Bearer {key}"}
    )
    print("Bearer:", resp.status_code, resp.text)
    
    print("Testing with Convex...")
    resp = httpx.post(
        url,
        json={"path": "pullRequests:updatePullRequestAnalysis", "args": {"github_pr_id": "999", "repo_name": "test", "status": "pending", "risk_score": 0, "ai_summary": "test"}},
        headers={"Authorization": f"Convex {key}"}
    )
    print("Convex:", resp.status_code, resp.text)

asyncio.run(test())
