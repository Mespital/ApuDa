#!/usr/bin/env bash
# Dedicated directory under deploy user's home. Does not modify existing web services.
set -euo pipefail
: "${VPS_HOST:?missing FUTURE_VPS_HOST}"
: "${VPS_USER:?missing FUTURE_VPS_USER}"
: "${VPS_SSH_KEY:?missing FUTURE_VPS_SSH_KEY}"
: "${VPS_KNOWN_HOSTS:?missing FUTURE_VPS_KNOWN_HOSTS}"
[[ "$VPS_HOST" =~ ^[a-zA-Z0-9.-]+$ ]] || exit 2
[[ "$VPS_USER" =~ ^[a-zA-Z0-9_-]+$ ]] || exit 2
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
printf '%s\n' "$VPS_SSH_KEY" > "$work/key"
printf '%s\n' "$VPS_KNOWN_HOSTS" > "$work/known_hosts"
chmod 600 "$work/key" "$work/known_hosts"
tar -czf "$work/site.tgz" -C future-compass/dist .
ssh_opts=(-i "$work/key" -o BatchMode=yes -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$work/known_hosts")
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'mkdir -p ~/future-compass/releases'
scp "${ssh_opts[@]}" "$work/site.tgz" "$VPS_USER@$VPS_HOST:future-compass/site.tgz"
ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" 'set -eu; release=$(date -u +%Y%m%dT%H%M%SZ); mkdir -p "$HOME/future-compass/releases/$release"; tar -xzf "$HOME/future-compass/site.tgz" -C "$HOME/future-compass/releases/$release"; ln -s "$HOME/future-compass/releases/$release" "$HOME/future-compass/current.next"; mv -Tf "$HOME/future-compass/current.next" "$HOME/future-compass/current"'
echo 'VPS files synced. Configure web server document root to ~/future-compass/current.' >> "${GITHUB_STEP_SUMMARY:-/dev/stdout}"
