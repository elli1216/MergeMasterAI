import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

import github_client

def test():
    owner = "elli1216"
    token = github_client.get_installation_token(owner)
    print(f"Token for {owner}: {'[REDACTED]' if token else 'None'}")
    
test()
