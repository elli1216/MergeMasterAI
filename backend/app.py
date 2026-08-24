"""
ASGI entrypoint alias: re-exports `app` from `main.py` so both `main:app`
and `app:app` work seamlessly across local development, Docker, Render,
and standard WSGI/ASGI runners.
"""
from main import app

__all__ = ["app"]
