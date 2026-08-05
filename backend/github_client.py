from github import Github, GithubIntegration

import config

GATE_CONTEXT = "MergeMaster AI / risk-gate"


def _private_key() -> str | None:
    raw = config.GITHUB_PRIVATE_KEY
    if not raw:
        return None
    return raw.replace("\\n", "\n")


def get_installation_token(owner: str) -> str | None:
    if not (config.GITHUB_APP_ID and _private_key()):
        print("[github] GITHUB_APP_ID / GITHUB_PRIVATE_KEY not set; cannot authenticate as GitHub App")
        return None
    try:
        integration = GithubIntegration(config.GITHUB_APP_ID, _private_key())
        installations = list(integration.get_installations())
    except Exception as exc:
        print(f"[github] GitHub App authentication failed: {exc}")
        return None
    for installation in installations:
        if (installation.account.login or "").lower() == owner.lower():
            return installation.get_access_token().token
    for installation in installations:
        try:
            return installation.get_access_token().token
        except Exception:
            continue
    print(f"[github] no installation found for owner '{owner}'")
    return None


def fetch_pr_diff(owner: str, repo: str, pr_number: int) -> dict | None:
    token = get_installation_token(owner)
    if not token:
        return None
    gh = Github(token)
    pr = gh.get_repo(f"{owner}/{repo}").get_pull(pr_number)
    files = list(pr.get_files())
    diff = "\n".join(
        f"--- {f.filename}\n+++ {f.status}\n{f.patch or ''}" for f in files
    )
    return {
        "diff": diff,
        "files": [f.filename for f in files],
        "head_sha": pr.head.sha,
    }


def enforce_gate(
    *,
    repo_name: str,
    pr_number: int,
    head_sha: str,
    status: str,
    risk_score: int,
    summary: str,
) -> None:
    """Set the GitHub commit status gate and log a Blocker ticket on critical flaws."""
    owner, repo = repo_name.split("/", 1)
    token = get_installation_token(owner)
    if not token:
        print("[github] no GitHub App access; skipping commit-status gate enforcement")
        return
    gh = Github(token)
    gh_repo = gh.get_repo(repo_name)

    gate_state = {
        "approved": "success",
        "pending": "pending",
        "blocked": "failure",
        "merged": "success",
        "closed": "pending",
    }.get(status, "pending")
    description = f"MergeMaster: {status} (risk {risk_score}/100)"
    try:
        gh_repo.get_commit(head_sha).create_status(
            state=gate_state,
            description=description[:140],
            context=GATE_CONTEXT,
        )
        print(f"[github] commit status '{gate_state}' set on {repo_name}@{head_sha[:7]}")
    except Exception as exc:
        print(f"[github] failed to set commit status: {exc}")

    if status == "blocked":
        try:
            gh_repo.create_issue(
                title=f"[MergeMaster] Blocker on PR #{pr_number} (risk {risk_score}/100)",
                body=(
                    f"MergeMaster AI blocked PR #{pr_number}.\n\n"
                    f"**Reason:** {summary}\n\n"
                    f"**Risk score:** {risk_score}/100"
                ),
            )
            print(f"[github] Blocker ticket created for PR #{pr_number}")
        except Exception as exc:
            print(f"[github] failed to create Blocker ticket: {exc}")