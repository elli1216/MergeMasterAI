import logging

import config
import http_client

logger = logging.getLogger(__name__)


async def _call_mutation(path: str, args: dict) -> bool:
    if not (config.CONVEX_URL and config.CONVEX_ADMIN_KEY):
        logger.info("CONVEX_URL / CONVEX_ADMIN_KEY not set; skipping '%s'", path)
        return False
    try:
        resp = await http_client.get_async_client().post(
            f"{config.CONVEX_URL.rstrip('/')}/api/mutation",
            json={"path": path, "args": args},
            headers={"Authorization": f"Convex {config.CONVEX_ADMIN_KEY}"},
        )
        resp.raise_for_status()
        return True
    except Exception as exc:
        logger.warning("failed to call mutation '%s': %s", path, exc)
        return False


async def _call_query(path: str, args: dict) -> dict | list | None:
    if not (config.CONVEX_URL and config.CONVEX_ADMIN_KEY):
        return None
    try:
        resp = await http_client.get_async_client().post(
            f"{config.CONVEX_URL.rstrip('/')}/api/query",
            json={"path": path, "args": args},
            headers={"Authorization": f"Convex {config.CONVEX_ADMIN_KEY}"},
        )
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, dict) and "value" in data:
            return data["value"]
        return data
    except Exception as exc:
        logger.warning("failed to call query '%s': %s", path, exc)
        return None


async def update_pull_request_analysis(
    *,
    github_pr_id: str,
    repo_name: str,
    status: str,
    risk_score: int,
    ai_summary: str,
    full_review: dict | None = None,
) -> bool:
    ok = await _call_mutation(
        "pullRequests:updatePullRequestAnalysis",
        {
            "github_pr_id": github_pr_id,
            "repo_name": repo_name,
            "status": status,
            "risk_score": risk_score,
            "ai_summary": ai_summary,
            "full_review": full_review,
        },
    )
    if ok:
        logger.info("updated PR #%s on %s", github_pr_id, repo_name)
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


async def get_routing_rules() -> list[dict] | None:
    """Fetch active routing rules from the Convex database."""
    res = await _call_query("routingRules:getRoutingRules", {})
    if isinstance(res, list):
        return res
    return None


async def sync_installation_repositories(
    *,
    action: str,
    repositories: list[dict],
) -> bool:
    """Sync repositories added/removed via GitHub App installation."""
    return await _call_mutation(
        "repositories:syncInstallationRepositories",
        {
            "action": action,
            "repositories": repositories,
        },
    )