import logging

import httpx

import config
import http_client

logger = logging.getLogger(__name__)


async def chat_completions(
    *,
    system: str,
    user: str,
    temperature: float,
    json_mode: bool = True,
) -> str:
    """OpenAI-compatible chat completion against the configured LLM endpoint
    (Google Gemini by default). Returns the assistant message content.

    Raises on failure; callers are responsible for fallback logic.
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
    for attempt in (1, 2):
        try:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]
        except httpx.HTTPError as exc:
            if attempt == 1:
                logger.warning("LLM call attempt %s failed (%s); retrying once", attempt, exc)
                continue
            raise
    raise RuntimeError("unreachable")  # pragma: no cover