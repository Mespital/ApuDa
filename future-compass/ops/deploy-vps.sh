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
cp future-compass/ops/compose.yaml future-compass/ops/Caddyfile "$work/"
ssh_opts=(-i "$work/key" -o BatchMode=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$work/known_hosts")
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'mkdir -p ~/future-compass/releases ~/future-compass/auth ~/future-compass/private; chmod 700 ~/future-compass/private'
scp "${ssh_opts[@]}" "$work/site.tgz" "$work/auth.tgz" "$work/live.tgz" "$work/compose.yaml" "$work/Caddyfile" "$VPS_USER@$VPS_HOST:future-compass/"
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'set -eu; tar -xzf "$HOME/future-compass/auth.tgz" -C "$HOME/future-compass/auth"; release=$(date -u +%Y%m%dT%H%M%SZ); mkdir -p "$HOME/future-compass/releases/$release"; tar -xzf "$HOME/future-compass/site.tgz" -C "$HOME/future-compass/releases/$release"; ln -s "releases/$release" "$HOME/future-compass/current.next"; mv -Tf "$HOME/future-compass/current.next" "$HOME/future-compass/current"'
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'set -eu; cd "$HOME/future-compass"; umask 077; printf "COMPASS_UID=%s\nCOMPASS_GID=%s\n" "$(id -u)" "$(id -g)" > .env; docker compose -p future-compass -f compose.yaml up -d --force-recreate; curl --fail --silent --show-error --retry 8 --retry-delay 2 --retry-all-errors http://127.0.0.1:8092/health; curl --fail --silent --show-error --retry 8 --retry-delay 2 --retry-all-errors --output /dev/null http://127.0.0.1:8092/login.html'
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'set -eu; test "$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8092/study.html)" = 302; test "$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8092/api/study)" = 401'
echo 'VPS app serving on loopback port 8092. Public HTTPS routing remains separate.'  >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"

# ── 실시간 중계 + 흰둥이 똑똑 모드 (선택: FC_LIVE_SECRET 이 있을 때만) ──
if [ -n "${FC_LIVE_SECRET:-}" ]; then
  [ "${#FC_LIVE_SECRET}" -ge 24 ] || { echo 'FC_LIVE_SECRET must be 24+ chars' >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"; exit 0; }
  printf 'FC_LIVE_SECRET=%s\nANTHROPIC_API_KEY=%s\n' "$FC_LIVE_SECRET" "${ANTHROPIC_API_KEY:-}" > "$work/live.env"
  chmod 600 "$work/live.env"
  scp "${ssh_opts[@]}" "$work/live.env" "$VPS_USER@$VPS_HOST:future-compass/live.env"
  ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'set -eu; cd "$HOME/future-compass"; chmod 600 live.env; rm -rf live; mkdir -p live; tar -xzf live.tgz -C live; docker compose -p future-compass -f compose.yaml --profile live up -d --force-recreate live; curl --fail --silent --show-error --retry 8 --retry-delay 2 --retry-all-errors http://127.0.0.1:8093/health'
  echo 'Live relay serving on loopback port 8093.' >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"
  if [ -n "${FUTURE_LIVE_HOST:-}" ]; then
    [[ "$FUTURE_LIVE_HOST" =~ ^[a-z0-9.-]+\.[a-z]{2,}$ ]] || exit 2
    # 기존 Caddy 설정은 건드리지 않고, 이 호스트 블록이 없을 때만 끝에 추가 → 검사 통과 시에만 reload
    ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" "set -eu; H='$FUTURE_LIVE_HOST'; F=/etc/caddy/Caddyfile; S=''; test -w \$F || S='sudo -n'; if grep -q \"^\$H {\" \$F; then echo 'caddy block exists'; else cp \$F /tmp/Caddyfile.fc; printf '\n%s {\n  reverse_proxy 127.0.0.1:8093 {\n    flush_interval -1\n  }\n}\n' \"\$H\" >> /tmp/Caddyfile.fc; caddy validate --config /tmp/Caddyfile.fc --adapter caddyfile >/dev/null 2>&1 && \$S cp /tmp/Caddyfile.fc \$F && \$S systemctl reload caddy && echo 'caddy block added' || echo 'caddy update skipped (validate or permission failed)'; fi" >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}" || echo 'Caddy step failed; add the block manually (see ops/README).' >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"
  fi
fi

