#!/usr/bin/env bash
# Dedicated directory under deploy user's home. Does not modify existing web services.
set -euo pipefail
: "${VPS_HOST:?missing FUTURE_VPS_HOST}"
: "${VPS_USER:?missing FUTURE_VPS_USER}"
: "${VPS_SSH_KEY:?missing FUTURE_VPS_SSH_KEY}"

[[ "$VPS_HOST" =~ ^[a-zA-Z0-9.-]+$ ]] || exit 2
[[ "$VPS_USER" =~ ^[a-zA-Z0-9_-]+$ ]] || exit 2
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
printf '%s\n' "$VPS_SSH_KEY" > "$work/key"
if [ -n "${VPS_KNOWN_HOSTS:-}" ]; then
  printf '%s\n' "$VPS_KNOWN_HOSTS" > "$work/known_hosts"
else
  # Reuse the existing VPS deployment's first-use host-key discovery.
  ssh-keyscan -T 10 -H "$VPS_HOST" > "$work/known_hosts"
  echo 'VPS host key discovered on first use; pin FUTURE_VPS_KNOWN_HOSTS for future runs.' >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"
fi
chmod 600 "$work/key" "$work/known_hosts"
tar -czf "$work/site.tgz" -C future-compass/dist .
tar -czf "$work/auth.tgz" -C future-compass/auth .
tar -czf "$work/live.tgz" -C future-compass/live .
printf 'FC_LIVE_SECRET=%s\nANTHROPIC_API_KEY=%s\nOPENAI_API_KEY=%s\nFC_CHAT_PROVIDER=%s\nFC_OPENAI_MODEL=%s\nOLLAMA_MODEL=%s\nOLLAMA_URL=http://ollama:11434\n' "${FC_LIVE_SECRET:-}" "${ANTHROPIC_API_KEY:-}" "${OPENAI_API_KEY:-}" "${FC_CHAT_PROVIDER:-}" "${FC_OPENAI_MODEL:-}" "${FC_OLLAMA_MODEL:-}" > "$work/live.env"
chmod 600 "$work/live.env"
trap 'echo "::error::deploy-vps.sh failed at line $LINENO"' ERR
cp future-compass/ops/compose.yaml future-compass/ops/Caddyfile "$work/"
ssh_opts=(-i "$work/key" -o BatchMode=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$work/known_hosts")
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'mkdir -p ~/future-compass/releases ~/future-compass/auth ~/future-compass/private; chmod 700 ~/future-compass/private'
scp "${ssh_opts[@]}" "$work/site.tgz" "$work/auth.tgz" "$work/live.tgz" "$work/live.env" "$work/compose.yaml" "$work/Caddyfile" "$VPS_USER@$VPS_HOST:future-compass/"
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'set -eu; tar -xzf "$HOME/future-compass/auth.tgz" -C "$HOME/future-compass/auth"; cd "$HOME/future-compass"; chmod 600 live.env; rm -rf live; mkdir -p live live-data; chmod 700 live-data; tar -xzf live.tgz -C live; release=$(date -u +%Y%m%dT%H%M%SZ); mkdir -p "$HOME/future-compass/releases/$release"; tar -xzf "$HOME/future-compass/site.tgz" -C "$HOME/future-compass/releases/$release"; ln -s "releases/$release" "$HOME/future-compass/current.next"; mv -Tf "$HOME/future-compass/current.next" "$HOME/future-compass/current"'
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'set -eu; cd "$HOME/future-compass"; umask 077; printf "COMPASS_UID=%s\nCOMPASS_GID=%s\n" "$(id -u)" "$(id -g)" > .env; docker compose -p future-compass -f compose.yaml up -d --force-recreate auth web; curl --fail --silent --show-error --retry 8 --retry-delay 2 --retry-all-errors http://127.0.0.1:8092/health; curl --fail --silent --show-error --retry 8 --retry-delay 2 --retry-all-errors --output /dev/null http://127.0.0.1:8092/login.html'
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'set -eu; test "$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8092/study.html)" = 302; test "$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8092/api/study)" = 401'
echo 'VPS app serving on loopback port 8092. Public HTTPS routing remains separate.'  >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"

# ── 실시간 중계 + 흰둥이 똑똑 모드 (위 compose up 에서 같이 기동) ──
# 무료 AI(Ollama): FC_OLLAMA_MODEL 이 있을 때만. 모델은 처음 한 번 내려받음(수 GB)
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'echo "vps: cpu $(nproc) · mem $(free -m | awk "/Mem:/{print \$2\"MB total, \"\$7\"MB free\"}") · disk $(df -h "$HOME" | awk "NR==2{print \$4\" free\"}")"' 2>&1 | sed 's/^/::notice::/' || true
if [ -n "${FC_OLLAMA_MODEL:-}" ]; then
  [[ "$FC_OLLAMA_MODEL" =~ ^[a-zA-Z0-9._:/-]+$ ]] || exit 2
  ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" "cd \"\$HOME/future-compass\"; mkdir -p ollama-data; OLLAMA_MEM='${OLLAMA_MEM:-4g}' docker compose -p future-compass -f compose.yaml --profile ollama up -d ollama >/dev/null 2>&1; for i in 1 2 3 4 5 6 7 8 9 10; do docker compose -p future-compass -f compose.yaml exec -T ollama ollama list >/dev/null 2>&1 && break; sleep 3; done; timeout 1500 docker compose -p future-compass -f compose.yaml exec -T ollama ollama pull '$FC_OLLAMA_MODEL' 2>&1 | tail -1; echo \"ollama models: \$(docker compose -p future-compass -f compose.yaml exec -T ollama ollama list 2>&1 | tail -n +2 | awk '{print \$1\" \"\$3\$4}' | tr '\\n' ' ')\"" 2>&1 | tr -d '\r' | grep -v '^$' | tail -2 | sed 's/^/::notice::/' || echo '::warning::ollama step failed'
fi
# 수동 실행 때만: 무료 모델 실제 답변 속도·품질 한 번 확인
if [ -n "${FC_OLLAMA_MODEL:-}" ] && [ "${GITHUB_EVENT_NAME:-}" = "workflow_dispatch" ]; then
  ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" "cd \"\$HOME/future-compass\"; s=\$(date +%s); a=\$(timeout 240 docker compose -p future-compass -f compose.yaml exec -T ollama ollama run '$FC_OLLAMA_MODEL' '고등학생에게 광합성을 한국어 세 문장으로 쉽게 설명해줘.' 2>/dev/null | tr '\n' ' ' | cut -c1-300); echo \"ollama test \$(( \$(date +%s) - s ))s: \$a\"" 2>&1 | tr -d '\r' | sed 's/^/::notice::/' || true
fi
live_out=$(ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'cd "$HOME/future-compass"; docker compose -p future-compass -f compose.yaml up -d --force-recreate live 2>&1 | tail -2 | tr "\n" " "; curl -s --retry 10 --retry-delay 2 --retry-all-errors http://127.0.0.1:8093/health || docker logs --tail 5 future-compass-live-1 2>&1 | tr "\n" " "' 2>&1 || true)
printf "live relay: %s\n" "${live_out:0:400}" | tr -d "\r" | sed "s/^/::notice::/"
# 공개 주소: DNS(live.apuda.app 등)가 이 VPS를 가리킬 때만 Caddy 끝에 블록 추가 (기존 블록은 그대로, validate 통과 시에만 reload)
H="${FUTURE_LIVE_HOST:-live.apuda.app}"
[[ "$H" =~ ^[a-z0-9.-]+\.[a-z]{2,}$ ]] || exit 2
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" "set -u; H='$H'; F=/etc/caddy/Caddyfile
  echo \"vps: cpu \$(nproc), mem(MB) \$(free -m | awk '/Mem:/{print \$2\"/avail \"\$7}'), disk \$(df -h \$HOME | awk 'NR==2{print \$4}') free, swap \$(free -m | awk '/Swap:/{print \$2}')MB\"
  echo \"live health: \$(curl -s -m 5 http://127.0.0.1:8093/health || docker logs --tail 3 future-compass-live-1 2>&1 | tr '\\n' ' ')\"
  mine=\$( (hostname -I 2>/dev/null; getent ahostsv4 ai.apuda.app | awk '{print \$1}') | tr ' ' '\n' | sort -u)
  his=\$(getent ahostsv4 \$H | awk '{print \$1}' | sort -u)
  if [ -z \"\$his\" ] || ! printf '%s\n' \"\$his\" | grep -qxF -f <(printf '%s\n' \"\$mine\"); then echo \"live: DNS \$H not pointing here yet (\${his:-none})\"; exit 0; fi
  if grep -q \"^\$H {\" \$F; then echo \"live: caddy block for \$H exists\"; exit 0; fi
  S=''; test -w \$F || S='sudo -n'
  cp \$F /tmp/Caddyfile.fc && printf '\n%s {\n  reverse_proxy 127.0.0.1:8093 {\n    flush_interval -1\n  }\n}\n' \"\$H\" >> /tmp/Caddyfile.fc
  if caddy validate --config /tmp/Caddyfile.fc --adapter caddyfile >/dev/null 2>&1 && \$S cp /tmp/Caddyfile.fc \$F && \$S systemctl reload caddy; then echo \"live: caddy block added for \$H\"; else echo 'live: caddy update skipped (validate or permission failed) - add block manually (ops/README)'; fi" 2>&1 | sed 's/^/::notice::/' || echo '::warning::live: caddy step failed'
