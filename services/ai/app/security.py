import os
import secrets
from fastapi import Header, HTTPException

def verify_api_key(x_apuda_ai_key: str | None = Header(default=None)) -> None:
    expected = os.getenv("APUDA_AI_API_KEY", "")
    if not expected:
        raise HTTPException(status_code=503, detail="AI API key is not configured")
    if not x_apuda_ai_key or not secrets.compare_digest(x_apuda_ai_key, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")
