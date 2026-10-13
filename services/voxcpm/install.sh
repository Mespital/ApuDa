#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ "$(id -u)" -ne 0 ]; then
  printf 'Run this installer with sudo.\n' >&2
  exit 1
fi
command -v docker >/dev/null
command -v caddy >/dev/null
docker compose version >/dev/null
python3 - <<'PY'
from pathlib import Path
import shutil, socket
assert shutil.disk_usage('.').free >= 6 * 1024 ** 3, 'At least 6 GiB disk space is required'
# An existing VoxCPM installation owns this port. New installations must find it free.
if not Path('data/jobs.sqlite3').is_file():
    with socket.socket() as probe:
        try:
            probe.bind(('127.0.0.1', 8818))
        except OSError:
            raise SystemExit('Port 8818 is occupied; installation stopped')
PY
install -d -m 755 models
install -d -m 700 data
chown 10001:10001 data
python3 - <<'PY'
from pathlib import Path
import os
p = Path('.env')
if not p.is_file():
    existing = Path('/srv/apuda-ai/.env')
    key = ''
    if existing.is_file():
        for line in existing.read_text().splitlines():
            if line.startswith('APUDA_AI_API_KEY='):
                key = line.split('=', 1)[1].strip().strip('"\'')
                break
    if len(key) < 16:
        raise SystemExit('Existing ApuDa AI API key is missing; configure .env locally')
    # Compose treats $ specially; use literal single-quoted dotenv values.
    if any(char in key for char in "\n\r'"):
        raise SystemExit('Existing API key has an unsupported dotenv character')
    p.write_text("VOXCPM_API_KEY='" + key + "'\nVOXCPM_MIN_AVAILABLE_MIB=4300\n")
p.chmod(0o600)
PY
python3 download_models.py models
if ! docker image inspect "${VOXCPM_IMAGE:-apuda-voxcpm:cpu}" >/dev/null 2>&1; then
  docker build -t "${VOXCPM_IMAGE:-apuda-voxcpm:cpu}" .
fi
docker compose -f compose.yml up -d --wait --wait-timeout 90
python3 configure_caddy.py
curl --max-time 10 -fsS http://127.0.0.1:8818/health
printf '\nOpen https://ai.apuda.app/voice/ and enter the existing ApuDa AI API key.\n'
