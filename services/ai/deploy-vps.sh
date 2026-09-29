#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose v2 is required."
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created services/ai/.env from .env.example."
  echo "Set APUDA_AI_API_KEY to a long random secret before deployment."
  exit 2
fi

if grep -q "replace-with-long-random-secret" .env; then
  echo "Replace the placeholder APUDA_AI_API_KEY in services/ai/.env."
  exit 3
fi

docker compose config -q
docker compose up -d --build

echo "Waiting for API health check..."
for _ in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then
    echo "ApuDa AI API is healthy."
    docker compose ps
    exit 0
  fi
  sleep 2
done

echo "Health check failed."
docker compose ps
docker compose logs --tail=120 api worker
exit 4
