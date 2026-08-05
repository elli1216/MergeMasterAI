import asyncio
import logging

import convex_client
import github_client
from committer_agent import apply_fixes, draft_fixes
from analysis import analyze
from routing_rules import route_files
from agents.state import PipelineState

logger = logging.getLogger(__name__)

APPROVED = "approved"
BLOCKED = "blocked"
PENDING = "pending"


async def extract_diff(state: PipelineState) -> PipelineState:
    if state.get("diff") and state.get("files"):
        return state
    owner, repo = state["repo_name"].split("/", 1)
    try:
        data = await asyncio.to_thread(
            github_client.fetch_pr_diff,
            owner,
            repo,
            state["pr_number"],
            state.get("github_token"),
        )
    except Exception as exc:
        return {**state, "error": f"diff extraction failed: {exc}"}
    if not data:
        return {**state, "error": "diff extraction failed: no GitHub credentials or installation found"}
    merged = {
        **state,
        "diff": data["diff"],
        "files": data["files"],
        "head_sha": data["head_sha"],
        "head_ref": data["head_ref"],
        "has_merge_conflicts": data.get("mergeable") is False,
    }
    if not merged.get("title"):
        merged["title"] = data.get("title", "")
    if not merged.get("author"):
        merged["author"] = data.get("author", "")
    return merged


async def analyze_changes(state: PipelineState) -> PipelineState:
    if state.get("has_merge_conflicts"):
        return {
            **state,
            "decision": "block",
            "risk_score": 100,
            "findings": [],
            "ai_summary": "Merge conflicts detected. Please resolve conflicts before AI review.",
        }

    result = await analyze(
        state.get("title", ""), state.get("author", ""), state["diff"], state["files"]
    )
    return {
        **state,
        "decision": result.suggested_decision,
        "risk_score": result.risk_score,
        "findings": result.findings,
        "ai_summary": result.summary,
    }


async def route_reviewers(state: PipelineState) -> PipelineState:
    reviewers, docs_only = route_files(state.get("files", []))
    decision = state["decision"]
    if decision == "auto_approve":
        status = APPROVED
    elif decision == "block":
        status = BLOCKED
    elif docs_only:
        status = APPROVED
    else:
        status = PENDING

    ai_summary = state["ai_summary"]
    findings = state.get("findings", [])
    if findings and status != APPROVED:
        flagged = ", ".join(f"{f.severity}: {f.detail}" for f in findings)
        ai_summary = f"{ai_summary} Findings: {flagged}."
    if status == PENDING:
        ai_summary = f"{ai_summary} Routed to: {', '.join(reviewers)}."
    return {**state, "reviewers": reviewers, "status": status, "ai_summary": ai_summary}


async def committer_agent(state: PipelineState) -> PipelineState:
    if state.get("error"):
        return state
    fixes, notes = await draft_fixes(state.get("findings", []), state["diff"])
    note = "; ".join(notes)
    if not fixes:
        note = f"{note}; " if note else ""
        note += "no safe automatic remediation drafted"
        return {**state, "remediation_note": note}
    new_sha, applied = await asyncio.to_thread(
        apply_fixes, state["repo_name"], state["head_ref"], state["head_sha"], fixes
    )
    if not applied:
        note = f"{note}; " if note else ""
        note += "fixes drafted but could not be pushed (no GitHub App access)"
        return {**state, "remediation_note": note}
    ai_summary = f"{state['ai_summary']} Remediation commit {new_sha[:7]} pushed by Committer Agent."
    return {
        **state,
        "status": PENDING,
        "ai_summary": ai_summary,
        "head_sha": new_sha,
        "remediation_sha": new_sha,
        "remediation_note": note,
    }


async def enforce_gate(state: PipelineState) -> PipelineState:
    if state.get("error"):
        return state
    await asyncio.to_thread(
        github_client.enforce_gate,
        repo_name=state["repo_name"],
        pr_number=state["pr_number"],
        head_sha=state["head_sha"],
        status=state["status"],
        risk_score=state["risk_score"],
        summary=state["ai_summary"],
    )
    return state


async def record_result(state: PipelineState) -> PipelineState:
    if state.get("error"):
        logger.error(
            "pipeline failed for PR #%s: %s", state.get("pr_number"), state["error"]
        )
        return state

    full_review = {
        "repo_name": state.get("repo_name"),
        "pr_number": state.get("pr_number"),
        "status": state.get("status"),
        "risk_score": state.get("risk_score"),
        "decision": state.get("decision"),
        "ai_summary": state.get("ai_summary"),
        "reviewers": state.get("reviewers", []),
        "findings": [f.model_dump() for f in state.get("findings", [])] if state.get("findings") else [],
        "head_sha": state.get("head_sha"),
        "remediation_note": state.get("remediation_note"),
        "error": state.get("error"),
    }

    await convex_client.update_pull_request_analysis(
        github_pr_id=str(state["pr_number"]),
        repo_name=state["repo_name"],
        status=state["status"],
        risk_score=state["risk_score"],
        ai_summary=state["ai_summary"],
        full_review=full_review,
    )

    decision_type = (
        "remediate_code"
        if state.get("remediation_sha")
        else {
            APPROVED: "auto_approve",
            BLOCKED: "block_merge",
            PENDING: "route_reviewer",
        }.get(state["status"], "route_reviewer")
    )
    await convex_client.log_analysis_decision(
        github_pr_id=str(state["pr_number"]),
        repo_name=state["repo_name"],
        decision_type=decision_type,
        reasoning=state["ai_summary"],
    )

    logger.info(
        "PR #%s -> %s (risk %s) reviewers=%s",
        state["pr_number"],
        state["status"],
        state["risk_score"],
        state.get("reviewers"),
    )
    return state