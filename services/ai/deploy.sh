#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required." >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "Missing services/ai/.env. Copy .env.example and set secrets first." >&2
  exit 1
fi

docker compose pull redis
docker compose build --pull
docker compose up -d
docker compose ps

echo
echo "Health check:"
curl --fail --silent --show-error http://127.0.0.1:8000/health
echo
