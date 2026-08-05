from typing import TypedDict

from committer_agent import FixDraft
from analysis import Finding


class PipelineState(TypedDict, total=False):
    repo_name: str
    pr_number: int
    title: str
    author: str
    diff: str
    files: list[str]
    head_sha: str
    head_ref: str
    findings: list[Finding]
    fixes: list[FixDraft]
    remediation_sha: str | None
    remediation_note: str | None
    reviewers: list[str]
    decision: str
    status: str
    risk_score: int
    ai_summary: str
    error: str | None