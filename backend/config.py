import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_APP_ID = os.getenv("GITHUB_APP_ID")
GITHUB_PRIVATE_KEY = os.getenv("GITHUB_PRIVATE_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN") or os.getenv("GH_TOKEN")
CONVEX_URL = os.getenv("CONVEX_URL")
CONVEX_ADMIN_KEY = os.getenv("CONVEX_ADMIN_KEY")
# LLM backend: Google Gemini via its OpenAI-compatible endpoint.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("LLM_API_KEY")
LLM_API_BASE = os.getenv(
    "LLM_API_BASE", "https://generativelanguage.googleapis.com/v1beta/openai"
)
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-3.5-flash-lite")