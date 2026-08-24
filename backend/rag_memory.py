import logging
import math
import convex_client
import llm_client

logger = logging.getLogger(__name__)


def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def _token_overlap_score(query: str, doc: str) -> float:
    words_q = set(query.lower().split())
    words_d = set(doc.lower().split())
    if not words_q or not words_d:
        return 0.0
    return len(words_q.intersection(words_d)) / len(words_q.union(words_d))


async def get_historical_context(
    repo_name: str,
    current_pr_title: str = "",
    current_files: list[str] | None = None,
) -> str:
    """Retrieve semantically relevant past PR decisions and recurring patterns for this repository."""
    try:
        past = await convex_client.get_past_decisions(repo_name)
        if not past:
            return ""

        query_text = f"{current_pr_title} {' '.join(current_files or [])}"
        query_embedding = await llm_client.get_text_embedding(query_text) if query_text else None

        scored_records: list[tuple[float, dict]] = []
        for p in past:
            score = 0.0
            doc_text = f"{p.get('title', '')} {p.get('summary', '')}"
            if query_embedding and p.get("embedding"):
                score = _cosine_similarity(query_embedding, p["embedding"])
            else:
                score = _token_overlap_score(query_text, doc_text)
            scored_records.append((score, p))

        # Sort by relevance descending
        scored_records.sort(key=lambda item: item[0], reverse=True)

        lines = ["Historical learnings & relevant prior PR outcomes for this codebase:"]
        for _, p in scored_records[:4]:
            findings_str = ""
            if p.get("findings"):
                findings_str = " | Prior Flags: " + ", ".join(
                    f"{f.get('category', 'issue')}: {f.get('detail', '')}"
                    for f in p["findings"][:2]
                )
            lines.append(
                f"- PR #{p.get('github_pr_id')}: \"{p.get('title')}\" -> {p.get('status', 'reviewed').upper()} "
                f"(Risk: {p.get('risk_score', 0)}%){findings_str}"
            )
        return "\n".join(lines)
    except Exception as exc:
        logger.warning("failed to fetch semantic historical context: %s", exc)
        return ""
