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
cp future-compass/ops/compose.yaml future-compass/ops/Caddyfile "$work/"
ssh_opts=(-i "$work/key" -o BatchMode=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$work/known_hosts")
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'mkdir -p ~/future-compass/releases ~/future-compass/auth ~/future-compass/private; chmod 700 ~/future-compass/private'
scp "${ssh_opts[@]}" "$work/site.tgz" "$work/auth.tgz" "$work/compose.yaml" "$work/Caddyfile" "$VPS_USER@$VPS_HOST:future-compass/"
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'set -eu; tar -xzf "$HOME/future-compass/auth.tgz" -C "$HOME/future-compass/auth"; release=$(date -u +%Y%m%dT%H%M%SZ); mkdir -p "$HOME/future-compass/releases/$release"; tar -xzf "$HOME/future-compass/site.tgz" -C "$HOME/future-compass/releases/$release"; ln -s "releases/$release" "$HOME/future-compass/current.next"; mv -Tf "$HOME/future-compass/current.next" "$HOME/future-compass/current"'
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'set -eu; cd "$HOME/future-compass"; umask 077; printf "COMPASS_UID=%s\nCOMPASS_GID=%s\n" "$(id -u)" "$(id -g)" > .env; docker compose -p future-compass -f compose.yaml up -d --force-recreate; curl --fail --silent --show-error --retry 8 --retry-delay 2 --retry-all-errors http://127.0.0.1:8092/health; curl --fail --silent --show-error --retry 8 --retry-delay 2 --retry-all-errors --output /dev/null http://127.0.0.1:8092/login.html'
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'set -eu; test "$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8092/study.html)" = 302; test "$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8092/api/study)" = 401'
echo 'VPS app serving on loopback port 8092. Public HTTPS routing remains separate.'  >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"
