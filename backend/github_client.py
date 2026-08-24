import itertools
import logging
import time

from github import Github, GithubIntegration

import config

logger = logging.getLogger(__name__)

GATE_CONTEXT = "MergeMaster AI / risk-gate"

# GitHub App installation tokens are valid for 1 hour; cache per-owner so we
# don't re-sign the JWT and re-enumerate installations on every pipeline step.
_TOKEN_TTL_SECONDS = 55 * 60
_token_cache: dict[str, tuple[str, float]] = {}


def _private_key() -> str | None:
    raw = config.GITHUB_PRIVATE_KEY
    if not raw:
        return None
    return raw.replace("\\n", "\n")


def _cached_token(owner: str) -> str | None:
    entry = _token_cache.get(owner)
    if entry and entry[1] > time.monotonic():
        return entry[0]
    return None


def get_installation_token(owner: str) -> str | None:
    cached = _cached_token(owner)
    if cached:
        return cached

    if not (config.GITHUB_APP_ID and _private_key()):
        logger.info(
            "GITHUB_APP_ID / GITHUB_PRIVATE_KEY not set; cannot authenticate as GitHub App"
        )
        return None

    try:
        integration = GithubIntegration(str(config.GITHUB_APP_ID), _private_key())
        installations = list(integration.get_installations())
    except Exception as exc:
        logger.warning("GitHub App authentication failed: %s", exc)
        return None

    matched = None
    for installation in installations:
        if (installation.account.login or "").lower() == owner.lower():
            matched = installation
            break
    # Fall back only when there is exactly one installation: guessing the first
    # one across multiple accounts would leak a token meant for another owner.
    if matched is None and len(installations) == 1:
        matched = installations[0]

    if matched is None:
        logger.info("no installation found for owner '%s'", owner)
        return None

    try:
        token = integration.get_access_token(matched.id).token
    except Exception as exc:
        logger.warning("failed to obtain installation access token: %s", exc)
        return None

    _token_cache[owner] = (token, time.monotonic() + _TOKEN_TTL_SECONDS)
    return token


def fetch_pr_diff(
    owner: str, repo: str, pr_number: int, token: str | None = None
) -> dict | None:
    """Fetch PR diff/file list/head info.

    `token` is an optional user-provided OAuth token (used when the GitHub App
    is not installed on the repo); otherwise an App installation token is used.
    """
    if token:
        gh = Github(token)
    else:
        token = get_installation_token(owner)
        if not token:
            return None
        gh = Github(token)
    try:
        pr = gh.get_repo(f"{owner}/{repo}").get_pull(pr_number)
        files = list(pr.get_files())
    except Exception as exc:
        logger.warning(
            "failed to fetch PR files for %s/%s #%s: %s", owner, repo, pr_number, exc
        )
        return None
    diff = "\n".join(
        f"--- {f.filename}\n+++ {f.filename} ({f.status})\n{f.patch or ''}" for f in files
    )
    return {
        "diff": diff,
        "files": [f.filename for f in files],
        "head_sha": pr.head.sha,
        "head_ref": pr.head.ref,
        "title": pr.title,
        "author": pr.user.login if pr.user else "",
        "mergeable": pr.mergeable,
    }


def enforce_gate(
    *,
    repo_name: str,
    pr_number: int,
    head_sha: str,
    status: str,
    risk_score: int,
    summary: str,
    github_token: str | None = None,
    findings: list | None = None,
) -> None:
    """Set the GitHub commit status gate and consolidate blocker issues on GitHub."""
    owner, repo = repo_name.split("/", 1)
    token = github_token or get_installation_token(owner) or getattr(config, "GITHUB_TOKEN", None)
    if not token:
        logger.info("no GitHub token or GitHub App access; skipping commit-status gate enforcement")
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
        logger.info("commit status '%s' set on %s@%s", gate_state, repo_name, head_sha[:7])
    except Exception as exc:
        logger.warning("failed to set commit status: %s", exc)

    issue_prefix = f"[MergeMaster] Blocker on PR #{pr_number}"

    if status == "blocked":
        try:
            # Build 1 single consolidated issue body containing all issues/findings
            findings_list = findings or []
            findings_table = ""
            if findings_list:
                rows = []
                for f in findings_list:
                    f_dict = f.model_dump() if hasattr(f, "model_dump") else (f if isinstance(f, dict) else {})
                    severity = str(f_dict.get("severity", "high")).upper()
                    category = str(f_dict.get("category", "security"))
                    file_path = str(f_dict.get("file", ""))
                    detail = str(f_dict.get("detail", ""))
                    icon = "🔴" if severity == "CRITICAL" else ("🟡" if severity == "HIGH" else "⚪")
                    rows.append(f"| {icon} **{severity}** | {category} | `{file_path}` | {detail} |")
                findings_table = (
                    "### ⚠️ Combined Findings & Vulnerabilities\n"
                    "| Severity | Category | Target File | Issue Description |\n"
                    "| :--- | :--- | :--- | :--- |\n" + "\n".join(rows) + "\n\n"
                )

            body = (
                f"## 🛑 MergeMaster AI Release Gate: PR #{pr_number} Blocked\n\n"
                f"**Risk Score:** `{risk_score}/100`  \n"
                f"**AI Decision Summary:** {summary}\n\n"
                f"{findings_table}"
                f"---\n"
                f"*This single consolidated blocker issue is automatically managed by MergeMaster AI.*"
            )

            title = f"[MergeMaster] Blocker on PR #{pr_number}"

            # Check for ANY existing open blocker issue on this PR to prevent redundant issues
            existing_issue = None
            for i in itertools.islice(gh_repo.get_issues(state="open"), 0, 100):
                if i.title.startswith(issue_prefix):
                    existing_issue = i
                    break

            if existing_issue:
                # Update existing issue with latest consolidated findings rather than opening duplicate
                existing_issue.edit(title=title, body=body)
                logger.info("Updated existing consolidated Blocker issue #%s for PR #%s", existing_issue.number, pr_number)
            else:
                new_issue = gh_repo.create_issue(title=title, body=body)
                logger.info("Created single consolidated Blocker issue #%s for PR #%s", new_issue.number, pr_number)
        except Exception as exc:
            logger.warning("failed to manage Blocker ticket: %s", exc)

    elif status in ("approved", "merged"):
        try:
            # Automatically close open blocker issue if one exists
            for i in itertools.islice(gh_repo.get_issues(state="open"), 0, 50):
                if i.title.startswith(issue_prefix):
                    i.create_comment(
                        f"✅ **MergeMaster Gate Passed**: PR #{pr_number} reached status `{status}` (risk {risk_score}/100).\n"
                        f"Closing this blocker issue automatically."
                    )
                    i.edit(state="closed")
                    logger.info("Closed resolved Blocker issue #%s for PR #%s", i.number, pr_number)
        except Exception as exc:
            logger.warning("failed to close resolved Blocker ticket: %s", exc)