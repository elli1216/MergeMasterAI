from typing import TypedDict

from granite_client import Finding


class PipelineState(TypedDict, total=False):
    repo_name: str
    pr_number: int
    title: str
    author: str
    diff: str
    files: list[str]
    head_sha: str
    findings: list[Finding]
    reviewers: list[str]
    decision: str
    status: str
    risk_score: int
    ai_summary: str
    error: str | None