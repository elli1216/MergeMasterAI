import httpx

import config


async def _call_mutation(path: str, args: dict) -> bool:
    if not (config.CONVEX_URL and config.CONVEX_ADMIN_KEY):
        print(f"[convex] CONVEX_URL / CONVEX_ADMIN_KEY not set; skipping '{path}'")
        return False
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{config.CONVEX_URL.rstrip('/')}/api/mutation",
                json={"path": path, "args": args},
                headers={"Authorization": f"Bearer {config.CONVEX_ADMIN_KEY}"},
            )
            resp.raise_for_status()
        return True
    except Exception as exc:
        print(f"[convex] failed to call '{path}': {exc}")
        return False


async def update_pull_request_analysis(
    *,
    github_pr_id: str,
    repo_name: str,
    status: str,
    risk_score: int,
    ai_summary: str,
) -> bool:
    ok = await _call_mutation(
        "pullRequests:updatePullRequestAnalysis",
        {
            "github_pr_id": github_pr_id,
            "repo_name": repo_name,
            "status": status,
            "risk_score": risk_score,
            "ai_summary": ai_summary,
        },
    )
    if ok:
        print(f"[convex] updated PR #{github_pr_id} on {repo_name}")
    return ok


async def log_analysis_decision(
    *,
    github_pr_id: str,
    repo_name: str,
    decision_type: str,
    reasoning: str,
) -> bool:
    return await _call_mutation(
        "pullRequests:logAnalysisDecision",
        {
            "github_pr_id": github_pr_id,
            "repo_name": repo_name,
            "decision_type": decision_type,
            "reasoning": reasoning,
        },
    )