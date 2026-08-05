import os
from dotenv import load_dotenv

load_dotenv()

GITHUB_APP_ID = os.getenv("GITHUB_APP_ID")
GITHUB_PRIVATE_KEY = os.getenv("GITHUB_PRIVATE_KEY")
CONVEX_URL = os.getenv("CONVEX_URL")
CONVEX_ADMIN_KEY = os.getenv("CONVEX_ADMIN_KEY")
GRANITE_API_BASE = os.getenv("GRANITE_API_BASE")
GRANITE_API_KEY = os.getenv("GRANITE_API_KEY")
GRANITE_MODEL = os.getenv("GRANITE_MODEL", "granite3.2:8b")