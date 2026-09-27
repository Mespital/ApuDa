# ApuDa AI Input Service

CPU-oriented AI input service for the ApuDa Health OS.

## Responsibilities

- OCR of uploaded lab-result images
- Korean speech-to-text for short symptom notes
- deterministic symptom/lab parsing
- Redis-backed background jobs
- automatic temporary-file deletion
- user confirmation required before parsed results are written to the Health OS database

## API

- `GET /health`
- `POST /api/v1/ocr`
- `POST /api/v1/stt`
- `POST /api/v1/parse/lab`
- `POST /api/v1/parse/symptom`
- `GET /api/v1/jobs/{job_id}`

All health-data endpoints require:

`X-ApuDa-AI-Key: <secret>`

Do not expose the worker or Redis ports publicly.

## VPS deployment target

Designed for the current CPU-only ApuDa VPS.

Recommended initial settings:

- worker concurrency: 1
- faster-whisper: small / int8
- 2 CPU threads
- short voice notes: approximately 5–30 seconds
- reverse proxy terminates HTTPS
- API bound to localhost and proxied through Nginx/Caddy
- Redis internal Docker network only

## Start

```bash
cp .env.example .env
# Replace APUDA_AI_API_KEY with a long random secret.
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:8000/health
```

## Privacy

Do not log raw OCR text, transcripts, names, diagnoses, lab values, audio, or uploaded images.

Uploads are deleted by the worker after processing. Results are short-lived in Redis and should only be persisted to the Health OS after the user reviews and confirms them.
