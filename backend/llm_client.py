import asyncio
import logging
import re
import httpx

import config
import http_client

logger = logging.getLogger(__name__)


def clean_json_response(raw: str) -> str:
    """Sanitize LLM output by removing markdown code fences and surrounding text."""
    text = raw.strip()
    # Remove markdown code fences e.g. ```json ... ``` or ``` ... ```
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    # If extra conversational text surrounds the JSON, extract the JSON object/array
    first_brace = text.find("{")
    first_bracket = text.find("[")
    
    if first_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
        last_brace = text.rfind("}")
        if last_brace != -1 and last_brace > first_brace:
            text = text[first_brace : last_brace + 1]
    elif first_bracket != -1:
        last_bracket = text.rfind("]")
        if last_bracket != -1 and last_bracket > first_bracket:
            text = text[first_bracket : last_bracket + 1]

    return text


async def chat_completions(
    *,
    system: str,
    user: str,
    temperature: float,
    json_mode: bool = True,
    max_retries: int = 3,
) -> str:
    """OpenAI-compatible chat completion against the configured LLM endpoint
    (Google Gemini by default) with exponential backoff and JSON extraction.
    """
    payload: dict = {
        "model": config.LLM_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "stream": False,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    headers = {"Content-Type": "application/json"}
    if config.GEMINI_API_KEY:
        headers["Authorization"] = f"Bearer {config.GEMINI_API_KEY}"

    url = f"{config.LLM_API_BASE.rstrip('/')}/chat/completions"
    client = http_client.get_async_client()

    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            resp = await client.post(url, json=payload, headers=headers, timeout=45.0)
            resp.raise_for_status()
            raw_content = resp.json()["choices"][0]["message"]["content"]
            return clean_json_response(raw_content) if json_mode else raw_content
        except (httpx.HTTPStatusError, httpx.RequestError, KeyError) as exc:
            last_err = exc
            if attempt < max_retries:
                backoff = 2 ** (attempt - 1) * 0.5
                logger.warning(
                    "LLM call attempt %d failed (%s); backing off %.1fs...",
                    attempt,
                    exc,
                    backoff,
                )
                await asyncio.sleep(backoff)
            else:
                logger.error("LLM call permanently failed after %d attempts: %s", max_retries, exc)

    if last_err:
        raise last_err
    raise RuntimeError("LLM completion unreachable")


async def get_text_embedding(text: str) -> list[float] | None:
    """Generate 768-dim semantic vector embedding using standard Gemini embeddings API."""
    if not (config.LLM_API_BASE and config.GEMINI_API_KEY):
        return None

    # Use OpenAI-compatible embeddings endpoint or return None gracefully
    url = f"{config.LLM_API_BASE.rstrip('/')}/embeddings"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config.GEMINI_API_KEY}",
    }
    payload = {
        "model": "text-embedding-004",
        "input": text[:8000],
    }
    client = http_client.get_async_client()
    try:
        resp = await client.post(url, json=payload, headers=headers, timeout=15.0)
        resp.raise_for_status()
        data = resp.json()
        return data["data"][0]["embedding"]
    except Exception as exc:
        logger.debug("text embedding generation skipped / fallback: %s", exc)
        return None