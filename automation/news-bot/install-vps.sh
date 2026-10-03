#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET=/srv/apuda-news
REPO_DIR=${APUDA_REPO_DIR:-/srv/apuda-repo}

sudo mkdir -p "$TARGET" /etc/apuda
sudo cp "$SRC_DIR"/news_bot.py "$SRC_DIR"/config.json "$SRC_DIR"/requirements.txt "$SRC_DIR"/publish.sh "$TARGET"/
sudo chmod +x "$TARGET/news_bot.py" "$TARGET/publish.sh"
if [ ! -d "$TARGET/.venv" ]; then
  sudo python3 -m venv "$TARGET/.venv"
fi
sudo "$TARGET/.venv/bin/pip" install -r "$TARGET/requirements.txt"

if [ ! -d "$REPO_DIR/.git" ]; then
  sudo rm -rf "$REPO_DIR"
  sudo git clone https://github.com/Mespital/ApuDa.git "$REPO_DIR"
fi
sudo chown -R "$(id -u):$(id -g)" "$REPO_DIR" "$TARGET"

sudo tee /etc/systemd/system/apuda-news.service >/dev/null <<EOF
[Unit]
Description=ApuDa Daily News Collector and Publisher
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
WorkingDirectory=$REPO_DIR
EnvironmentFile=/etc/apuda/news.env
ExecStart=$TARGET/publish.sh
Nice=5
EOF

sudo tee /etc/systemd/system/apuda-news.timer >/dev/null <<'EOF'
[Unit]
Description=Run ApuDa News Collector daily

[Timer]
OnCalendar=*-*-* 09:03:00 Asia/Seoul
Persistent=true
RandomizedDelaySec=0
Unit=apuda-news.service

[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now apuda-news.timer
systemctl list-timers apuda-news.timer --no-pager
