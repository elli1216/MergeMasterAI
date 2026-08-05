import asyncio

import convex_client
import github_client
from granite_client import analyze
from routing_rules import route_files
from agents.state import PipelineState

APPROVED = "approved"
BLOCKED = "blocked"
PENDING = "pending"


async def extract_diff(state: PipelineState) -> PipelineState:
    if state.get("diff") and state.get("files"):
        return state
    owner, repo = state["repo_name"].split("/", 1)
    try:
        data = await asyncio.to_thread(github_client.fetch_pr_diff, owner, repo, state["pr_number"])
    except Exception as exc:
        return {**state, "error": f"diff extraction failed: {exc}"}
    if not data:
        return {**state, "error": "diff extraction failed: no GitHub App credentials or installation found"}
    return {**state, "diff": data["diff"], "files": data["files"], "head_sha": data["head_sha"]}


async def analyze_changes(state: PipelineState) -> PipelineState:
    result = await analyze(state["title"], state["author"], state["diff"], state["files"])
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
        print(f"[pipeline] failed for PR #{state.get('pr_number')}: {state['error']}")
        return state

    await convex_client.update_pull_request_analysis(
        github_pr_id=str(state["pr_number"]),
        repo_name=state["repo_name"],
        status=state["status"],
        risk_score=state["risk_score"],
        ai_summary=state["ai_summary"],
    )

    decision_type = {
        APPROVED: "auto_approve",
        BLOCKED: "block_merge",
        PENDING: "route_reviewer",
    }.get(state["status"], "route_reviewer")
    await convex_client.log_analysis_decision(
        github_pr_id=str(state["pr_number"]),
        repo_name=state["repo_name"],
        decision_type=decision_type,
        reasoning=state["ai_summary"],
    )

    print(
        f"[pipeline] PR #{state['pr_number']} -> {state['status']} "
        f"(risk {state['risk_score']}) reviewers={state.get('reviewers')}"
    )
    return state