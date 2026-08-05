import asyncio
import logging
import config
import http_client

logging.basicConfig(level=logging.INFO)

async def fix():
    # 1. Fetch all PRs from convex via getActivePRs
    client = http_client.get_async_client()
    resp = await client.post(
        f"{config.CONVEX_URL.rstrip('/')}/api/query",
        json={"path": "pullRequests:getActivePRs", "args": {}},
        headers={"Authorization": f"Convex {config.CONVEX_ADMIN_KEY}"}
    )
    resp.raise_for_status()
    prs = resp.json().get("value", [])
    
    # 2. Iterate and fix corrupted PRs
    for pr in prs:
        if pr.get("full_review") and pr.get("risk_score") == 0 and not pr.get("ai_summary"):
            review = pr["full_review"]
            logging.info(f"Fixing PR {pr['repo_name']}#{pr['github_pr_id']}")
            
            await client.post(
                f"{config.CONVEX_URL.rstrip('/')}/api/mutation",
                json={
                    "path": "pullRequests:updatePullRequestAnalysis",
                    "args": {
                        "github_pr_id": pr["github_pr_id"],
                        "repo_name": pr["repo_name"],
                        "status": review.get("status", pr["status"]),
                        "risk_score": review.get("risk_score", 0),
                        "ai_summary": review.get("ai_summary", ""),
                        "full_review": review
                    }
                },
                headers={"Authorization": f"Convex {config.CONVEX_ADMIN_KEY}"}
            )
            logging.info("Fixed!")

if __name__ == "__main__":
    asyncio.run(fix())
