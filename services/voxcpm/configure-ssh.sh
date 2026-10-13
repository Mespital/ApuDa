#!/usr/bin/env bash
set -euo pipefail
test -n "$VPS_HOST" && test -n "$VPS_USER" && test -n "$VPS_SSH_KEY"
[[ "$VPS_HOST" =~ ^[a-zA-Z0-9.-]+$ ]]
[[ "$VPS_USER" =~ ^[a-zA-Z0-9_-]+$ ]]
port="${VPS_SSH_PORT:-22}"
[[ "$port" =~ ^[0-9]+$ ]]
install -m 700 -d ~/.ssh
printf '%s\n' "$VPS_SSH_KEY" > ~/.ssh/id_ed25519
chmod 600 ~/.ssh/id_ed25519
if [ -n "${VPS_KNOWN_HOSTS:-}" ]; then
  printf '%s\n' "$VPS_KNOWN_HOSTS" > ~/.ssh/known_hosts
else
  ssh-keyscan -T 10 -p "$port" -H "$VPS_HOST" > ~/.ssh/known_hosts
fi
cat > ~/.ssh/config <<EOF
Host apuda-vps
  HostName $VPS_HOST
  User $VPS_USER
  Port $port
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
  BatchMode yes
  StrictHostKeyChecking yes
  ConnectTimeout 15
  ServerAliveInterval 30
  ServerAliveCountMax 6
EOF
chmod 600 ~/.ssh/config ~/.ssh/known_hosts
