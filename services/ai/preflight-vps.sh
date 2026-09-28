#!/usr/bin/env bash
set -u

echo "== ApuDa AI VPS preflight =="
echo "Time: $(date -Is 2>/dev/null || date)"
echo

echo "-- OS --"
if [[ -f /etc/os-release ]]; then
  . /etc/os-release
  echo "${PRETTY_NAME:-unknown}"
else
  uname -a
fi

echo
echo "-- CPU / Memory / Disk --"
command -v nproc >/dev/null && echo "CPU cores: $(nproc)"
command -v free >/dev/null && free -h
df -h / /srv 2>/dev/null || df -h /

echo
echo "-- Required commands --"
for cmd in docker curl openssl; do
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "OK   $cmd: $(command -v "$cmd")"
  else
    echo "MISS $cmd"
  fi
done

if command -v docker >/dev/null 2>&1; then
  if docker compose version >/dev/null 2>&1; then
    echo "OK   docker compose: $(docker compose version)"
  else
    echo "MISS docker compose v2"
  fi
fi

echo
echo "-- Existing listeners --"
if command -v ss >/dev/null 2>&1; then
  ss -lntp 2>/dev/null | grep -E ':(80|443|8000|6379)\b' || echo "No listeners found on 80/443/8000/6379"
else
  echo "ss command not available"
fi

echo
echo "-- DNS target --"
if command -v getent >/dev/null 2>&1; then
  getent ahostsv4 ai.apuda.app 2>/dev/null | head -n 3 || echo "ai.apuda.app does not resolve yet"
else
  echo "getent not available"
fi

echo
echo "-- Existing ApuDa AI deployment --"
if [[ -d /srv/apuda-ai ]]; then
  echo "/srv/apuda-ai exists"
  if [[ -f /srv/apuda-ai/docker-compose.yml ]] && command -v docker >/dev/null 2>&1; then
    (cd /srv/apuda-ai && docker compose ps) || true
  fi
else
  echo "/srv/apuda-ai not found"
fi

echo
echo "-- Local health endpoint --"
if curl -fsS --max-time 3 http://127.0.0.1:8000/health >/dev/null 2>&1; then
  echo "OK   http://127.0.0.1:8000/health"
  curl -fsS --max-time 3 http://127.0.0.1:8000/health
  echo
else
  echo "WAIT local AI service is not healthy yet"
fi

echo
echo "Preflight complete. This script does not modify the server."
