import os
import re
import secrets

from fastapi import Header, HTTPException

OWNER_TOKEN_RE = re.compile(r"^[0-9a-f]{64}$")

def verify_api_key(x_apuda_ai_key: str | None = Header(default=None)) -> None:
    expected = os.getenv("APUDA_AI_API_KEY", "")
    if not expected:
        raise HTTPException(status_code=503, detail="AI API key is not configured")
    if not x_apuda_ai_key or not secrets.compare_digest(x_apuda_ai_key, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")

def require_owner_token(
    x_apuda_owner: str | None = Header(default=None)
) -> str:
    if not x_apuda_owner or not OWNER_TOKEN_RE.fullmatch(x_apuda_owner):
        raise HTTPException(status_code=400, detail="Owner token is required")
    return x_apuda_owner
