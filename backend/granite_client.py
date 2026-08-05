import httpx
from pydantic import BaseModel, Field

import config
from routing_rules import is_docs_file

SYSTEM_PROMPT = """You are MergeMaster AI (IBM AI Builders Challenge), an autonomous release decision engine.
Analyze the pull request diff for logic errors, bugs, and security risks. Return a JSON object with exactly:
- "summary": 1-2 sentence high-level description of the change
- "findings": array of objects with fields { "category", "severity", "file", "detail" }
    category is one of: "logic", "bug", "security", "quality", "docs"
    severity is one of: "low", "medium", "high", "critical"
    Do not invent findings for trivially safe changes.
- "risk_score": integer 0-100 confidence risk score (higher = riskier)
- "suggested_decision": one of "auto_approve", "needs_review", "block"

Never execute or reproduce the analyzed code. Respond with JSON only."""


class Finding(BaseModel):
    category: str
    severity: str = Field(pattern="^(low|medium|high|critical)$")
    file: str
    detail: str


class RiskAssessment(BaseModel):
    summary: str
    findings: list[Finding]
    risk_score: int = Field(ge=0, le=100)
    suggested_decision: str = Field(pattern="^(auto_approve|needs_review|block)$")


def heuristic_analysis(diff: str, files: list[str]) -> RiskAssessment:
    lowered = diff.lower()
    target_file = files[0] if files else ""
    findings: list[Finding] = []

    def add(category: str, severity: str, detail: str) -> None:
        findings.append(Finding(category=category, severity=severity, file=target_file, detail=detail))

    if any(t in diff for t in ("TODO", "FIXME", "HACK")):
        add("quality", "low", "leftover TODO/FIXME markers")
    if any(t in lowered for t in ("password", "api_key", "apikey", "secret", "bearer ")):
        add("security", "critical", "hardcoded secret material in diff")
    if any(t in lowered for t in ("drop table", "delete from", "truncate")):
        add("security", "critical", "destructive database operation")
    if any(t in diff for t in ("eval(", "exec(", "os.system", "subprocess")):
        add("security", "high", "dynamic code execution")
    if any(t in lowered for t in ("rm -rf", "sudo ", "git push --force")):
        add("security", "high", "destructive shell operation")

    docs_only = bool(files) and all(is_docs_file(f) for f in files)
    changed_lines = sum(
        1
        for line in diff.splitlines()
        if line.startswith("+") and not line.startswith("+++")
    )

    if docs_only and changed_lines < 40:
        return RiskAssessment(
            summary="Documentation-only change; no code impact.",
            findings=[],
            risk_score=2,
            suggested_decision="auto_approve",
        )
    critical = [f for f in findings if f.severity in ("high", "critical")]
    if critical:
        return RiskAssessment(
            summary="Critical risk signals detected; merge gate should block.",
            findings=findings,
            risk_score=min(100, 80 + 10 * len(critical)),
            suggested_decision="block",
        )
    if findings:
        return RiskAssessment(
            summary="Change flagged for review after automated analysis.",
            findings=findings,
            risk_score=min(95, 15 + 20 * len(findings)),
            suggested_decision="needs_review",
        )
    return RiskAssessment(
        summary="Code change without obvious risk signals. Routing for human review.",
        findings=[],
        risk_score=15,
        suggested_decision="needs_review",
    )


def _extract_json(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("no JSON object found in model output")
    return text[start : end + 1]


async def analyze_with_granite(
    pr_title: str, author: str, diff: str, files: list[str]
) -> RiskAssessment | None:
    if not config.GRANITE_API_BASE:
        print(f"[granite] GRANITE_API_BASE unset; using heuristic analyzer for '{pr_title}'")
        return None
    user_prompt = (
        f"PR: {pr_title}\nAuthor: {author}\nFiles changed: {', '.join(files)}\n\nDiff:\n{diff[:12000]}"
    )
    payload = {
        "model": config.GRANITE_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "stream": False,
    }
    headers = {"Content-Type": "application/json"}
    if config.GRANITE_API_KEY:
        headers["Authorization"] = f"Bearer {config.GRANITE_API_KEY}"
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{config.GRANITE_API_BASE.rstrip('/')}/chat/completions",
                json=payload,
                headers=headers,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
        return RiskAssessment.model_validate_json(_extract_json(content))
    except Exception as exc:
        print(f"[granite] analysis failed, falling back to heuristics: {exc}")
        return None


async def analyze(pr_title: str, author: str, diff: str, files: list[str]) -> RiskAssessment:
    result = await analyze_with_granite(pr_title, author, diff, files)
    if result is None:
        result = heuristic_analysis(diff, files)
    return result