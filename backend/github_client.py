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


def invalidate_cached_token(owner: str) -> None:
    """Invalidate any cached installation token for this owner."""
    _token_cache.pop(owner.lower(), None)


def get_candidate_tokens(owner: str, user_token: str | None = None) -> list[str]:
    """Return an ordered list of viable GitHub tokens for this owner.
    
    Priority:
    1. User-supplied OAuth / PAT token (if non-empty)
    2. GitHub App installation token (for the owner organization/user)
    3. Server-wide GITHUB_TOKEN / GH_TOKEN environment variable
    """
    candidates: list[str] = []
    if user_token and user_token.strip():
        candidates.append(user_token.strip())

    app_token = get_installation_token(owner)
    if app_token and app_token not in candidates:
        candidates.append(app_token)

    env_token = getattr(config, "GITHUB_TOKEN", None)
    if env_token and env_token.strip() and env_token.strip() not in candidates:
        candidates.append(env_token.strip())

    return candidates


def fetch_pr_diff(
    owner: str, repo: str, pr_number: int, token: str | None = None
) -> dict | None:
    """Fetch PR diff/file list/head info with multi-token fallback."""
    candidate_tokens = get_candidate_tokens(owner, token)
    if not candidate_tokens:
        logger.warning(
            "no GitHub token or GitHub App credentials found for owner '%s'", owner
        )
        return None

    last_error = None
    for cand_token in candidate_tokens:
        try:
            gh = Github(cand_token)
            pr = gh.get_repo(f"{owner}/{repo}").get_pull(pr_number)
            files = list(pr.get_files())
            diff = "\n".join(
                f"--- {f.filename}\n+++ {f.filename} ({f.status})\n{f.patch or ''}"
                for f in files
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
        except Exception as exc:
            last_error = exc
            err_msg = str(exc)
            if "401" in err_msg or "Bad credentials" in err_msg or "403" in err_msg:
                invalidate_cached_token(owner)
                logger.warning(
                    "GitHub credential rejected (%s) for %s/%s #%s; trying fallback token...",
                    err_msg[:120],
                    owner,
                    repo,
                    pr_number,
                )
            else:
                logger.warning(
                    "failed to fetch PR files with token for %s/%s #%s: %s",
                    owner,
                    repo,
                    pr_number,
                    err_msg[:120],
                )

    logger.warning(
        "all candidate tokens failed for %s/%s #%s. Last error: %s",
        owner,
        repo,
        pr_number,
        last_error,
    )
    return None


def get_authenticated_repo(repo_name: str, user_token: str | None = None):
    """Return an authenticated (Github, Repository) pair trying candidate tokens in order."""
    owner, _ = repo_name.split("/", 1)
    candidates = get_candidate_tokens(owner, user_token)
    for token in candidates:
        try:
            gh = Github(token)
            repo = gh.get_repo(repo_name)
            _ = repo.name
            return gh, repo
        except Exception as exc:
            err_msg = str(exc)
            if "401" in err_msg or "Bad credentials" in err_msg or "403" in err_msg:
                invalidate_cached_token(owner)
            logger.warning(
                "token candidate failed accessing %s: %s; trying next candidate...",
                repo_name,
                err_msg[:120],
            )
    return None, None


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
    reviewers: list | None = None,
) -> None:
    """Set the GitHub commit status gate, post/update PR sticky review comments, and manage blocker issues."""
    gh, gh_repo = get_authenticated_repo(repo_name, github_token)
    if not gh or not gh_repo:
        logger.info("no working GitHub token or GitHub App access for %s; skipping gate enforcement", repo_name)
        return

    # 1. Commit Status Check
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

    # 2. Build Findings Table (if any)
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
            "### ⚠️ Findings & Advisory Analysis\n"
            "| Severity | Category | Target File | Issue Description |\n"
            "| :--- | :--- | :--- | :--- |\n" + "\n".join(rows) + "\n\n"
        )

    # 3. Post / Update Sticky PR Review Comment on PR Conversation Thread
    comment_tag = "<!-- mergemaster-pr-review-gate -->"
    if status == "approved":
        status_badge = "✅ **AUTO-APPROVED**"
    elif status == "blocked":
        status_badge = "🛑 **MERGE BLOCKED**"
    else:
        status_badge = "⏳ **PENDING HUMAN REVIEW**"

    reviewers_str = ", ".join(f"`{r}`" for r in (reviewers or [])) if reviewers else "*None required (Auto)*"

    pr_comment_body = (
        f"{comment_tag}\n"
        f"## 🤖 MergeMaster AI Gatekeeper Assessment\n\n"
        f"| **Gate Status** | **Risk Score** | **Reviewer Routing** |\n"
        f"| :--- | :--- | :--- |\n"
        f"| {status_badge} | `{risk_score}/100` | {reviewers_str} |\n\n"
        f"### 📋 AI Decision Summary\n"
        f"{summary}\n\n"
    )
    if findings_table:
        pr_comment_body += f"{findings_table}\n"

    pr_comment_body += "### 🛠️ Recommended Actions\n"
    if status == "blocked":
        pr_comment_body += (
            "- 🔴 **Resolve Blocking Vulnerabilities:** Address the critical findings above or check if an automated remediation commit was pushed.\n"
            "- 💬 **PR Copilot:** Open the MergeMaster dashboard to explore AI refactoring and debugging assistance.\n"
        )
    elif status == "pending":
        pr_comment_body += (
            f"- 👥 **Human Review Required:** Assigned reviewers ({reviewers_str}) please inspect the diff and approve on GitHub.\n"
            "- 🧪 **Unit Tests:** You can generate and commit unit tests directly from the MergeMaster dashboard.\n"
        )
    else:  # approved
        pr_comment_body += (
            "- ✅ **Ready to Merge:** No critical security risks or blocking policies detected. Safe to merge!\n"
        )

    pr_comment_body += "\n---\n*Automated gatekeeper analysis powered by **IBM Granite** & **LangGraph**.*"

    try:
        pr = gh_repo.get_pull(int(pr_number))
        existing_comment = None
        for c in itertools.islice(pr.get_issue_comments(), 0, 50):
            if comment_tag in (c.body or ""):
                existing_comment = c
                break

        if existing_comment:
            existing_comment.edit(pr_comment_body)
            logger.info("Updated existing MergeMaster PR comment on PR #%s", pr_number)
        else:
            pr.create_issue_comment(pr_comment_body)
            logger.info("Posted new MergeMaster PR review comment on PR #%s", pr_number)
    except Exception as exc:
        logger.warning("failed to post/update PR review comment on PR #%s: %s", pr_number, exc)

    # 4. Manage Blocker Issues (if BLOCKED) or auto-close when resolved
    issue_prefix = f"[MergeMaster] Blocker on PR #{pr_number}"

    if status == "blocked":
        try:
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
                existing_issue.edit(title=title, body=body)
                logger.info("Updated existing consolidated Blocker issue #%s for PR #%s", existing_issue.number, pr_number)
            else:
                new_issue = gh_repo.create_issue(title=title, body=body)
                logger.info("Created single consolidated Blocker issue #%s for PR #%s", new_issue.number, pr_number)
        except Exception as exc:
            logger.warning("failed to manage Blocker ticket: %s", exc)

    elif status in ("approved", "merged"):
        try:
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