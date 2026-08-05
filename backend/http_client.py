import httpx

_ACLIENT: httpx.AsyncClient | None = None


def get_async_client() -> httpx.AsyncClient:
    """Shared AsyncClient so we reuse TCP/TLS connections instead of
    handshaking on every LLM/Convex/GitHub call."""
    global _ACLIENT
    if _ACLIENT is None or _ACLIENT.is_closed:
        _ACLIENT = httpx.AsyncClient(timeout=60)
    return _ACLIENT