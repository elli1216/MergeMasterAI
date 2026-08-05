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
        token = matched.get_access_token().token
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
        logger.info("no GitHub App access; skipping commit-status gate enforcement")
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

    if status == "blocked":
        try:
            title = f"[MergeMaster] Blocker on PR #{pr_number} (risk {risk_score}/100)"
            # De-duplicate: repeated webhooks/retries must not spam the repo.
            existing = any(
                i.title == title
                for i in itertools.islice(gh_repo.get_issues(state="open"), 0, 300)
            )
            if existing:
                logger.info("Blocker ticket already exists for PR #%s; skipping", pr_number)
            else:
                gh_repo.create_issue(
                    title=title,
                    body=(
                        f"MergeMaster AI blocked PR #{pr_number}.\n\n"
                        f"**Reason:** {summary}\n\n"
                        f"**Risk score:** {risk_score}/100"
                    ),
                )
                logger.info("Blocker ticket created for PR #%s", pr_number)
        except Exception as exc:
            logger.warning("failed to create Blocker ticket: %s", exc)