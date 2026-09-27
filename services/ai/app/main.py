import os
import uuid
from pathlib import Path

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from redis import Redis
from rq import Queue
from rq.job import Job

from .jobs import run_ocr_job, run_stt_job
from .parsers import parse_lab_text, parse_symptom_text
from .security import verify_api_key

TEMP_DIR = Path(os.getenv("AI_TEMP_DIR", "/data/tmp"))
TEMP_DIR.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(15 * 1024 * 1024)))
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

redis = Redis.from_url(REDIS_URL)
queue = Queue("apuda-ai", connection=redis, default_timeout=600)

app = FastAPI(title="ApuDa AI Input API", version="0.1.0")

origins = [x.strip() for x in os.getenv("ALLOWED_ORIGINS", "").split(",") if x.strip()]
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type", "X-ApuDa-AI-Key"],
    )

class TextPayload(BaseModel):
    text: str

async def save_upload(upload: UploadFile) -> str:
    suffix = Path(upload.filename or "").suffix[:10]
    target = TEMP_DIR / f"{uuid.uuid4().hex}{suffix}"
    size = 0

    with target.open("wb") as handle:
        while chunk := await upload.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_UPLOAD_BYTES:
                handle.close()
                target.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="Upload too large")
            handle.write(chunk)

    return str(target)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/api/v1/ocr", dependencies=[Depends(verify_api_key)])
async def create_ocr_job(file: UploadFile = File(...)):
    path = await save_upload(file)
    job = queue.enqueue(run_ocr_job, path, job_timeout=600, result_ttl=900)
    return {"job_id": job.id, "status": "queued"}

@app.post("/api/v1/stt", dependencies=[Depends(verify_api_key)])
async def create_stt_job(file: UploadFile = File(...)):
    path = await save_upload(file)
    job = queue.enqueue(run_stt_job, path, job_timeout=600, result_ttl=900)
    return {"job_id": job.id, "status": "queued"}

@app.post("/api/v1/parse/lab", dependencies=[Depends(verify_api_key)])
def parse_lab(payload: TextPayload):
    return parse_lab_text(payload.text)

@app.post("/api/v1/parse/symptom", dependencies=[Depends(verify_api_key)])
def parse_symptom(payload: TextPayload):
    return parse_symptom_text(payload.text)

@app.get("/api/v1/jobs/{job_id}", dependencies=[Depends(verify_api_key)])
def get_job(job_id: str):
    try:
        job = Job.fetch(job_id, connection=redis)
    except Exception:
        raise HTTPException(status_code=404, detail="Job not found")

    response = {"job_id": job.id, "status": job.get_status(refresh=True)}
    if job.is_finished:
        response["result"] = job.result
    elif job.is_failed:
        response["error"] = "processing_failed"
    return response
