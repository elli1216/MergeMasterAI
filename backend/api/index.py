import os
import sys

# Ensure backend root is in Python sys.path so modules (agents, config, convex_client, etc.) import cleanly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
