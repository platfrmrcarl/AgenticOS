import json
import os
from pathlib import Path
from anthropic import AsyncAnthropic


def _make_client() -> AsyncAnthropic:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if api_key:
        return AsyncAnthropic(api_key=api_key)
    creds_path = Path.home() / ".claude" / ".credentials.json"
    if creds_path.exists():
        try:
            creds = json.loads(creds_path.read_text())
            token = creds.get("claudeAiOauth", {}).get("accessToken")
            if token:
                return AsyncAnthropic(auth_token=token)
        except Exception:
            pass
    raise RuntimeError("No Anthropic credentials found")


client = _make_client()
