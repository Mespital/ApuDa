#!/usr/bin/env bash
set -euo pipefail

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="$HOME/apuda-news"
REPO_DIR="${APUDA_REPO_DIR:-$HOME/apuda-repo}"
ENV_FILE="$HOME/.config/apuda/news.env"
LOG_DIR="$HOME/.local/state/apuda-news"

mkdir -p "$TARGET" "$HOME/.config/apuda" "$LOG_DIR"
cp "$SRC_DIR"/news_bot.py "$SRC_DIR"/official_data.py "$SRC_DIR"/official_notices.py "$SRC_DIR"/hira_updates.py "$SRC_DIR"/nccn_monitor.py "$SRC_DIR"/smoke_test.py "$SRC_DIR"/official_sources.json "$SRC_DIR"/config.json "$SRC_DIR"/requirements.txt "$SRC_DIR"/publish.sh "$TARGET"/
chmod +x "$TARGET/news_bot.py" "$TARGET/official_data.py" "$TARGET/official_notices.py" "$TARGET/hira_updates.py" "$TARGET/nccn_monitor.py" "$TARGET/smoke_test.py" "$TARGET/publish.sh"

if [ ! -d "$TARGET/.venv" ]; then
  python3 -m venv "$TARGET/.venv"
fi
"$TARGET/.venv/bin/pip" install -r "$TARGET/requirements.txt"

if [ ! -d "$REPO_DIR/.git" ]; then
  rm -rf "$REPO_DIR"
  git clone https://github.com/Mespital/ApuDa.git "$REPO_DIR"
fi

CRON_CMD="APUDA_NEWS_ENV_FILE=$ENV_FILE $TARGET/publish.sh >> $LOG_DIR/news.log 2>&1"
(
  crontab -l 2>/dev/null \
    | grep -v '^CRON_TZ=Asia/Seoul$' \
    | grep -v 'APUDA_NEWS_ENV_FILE=.*apuda-news' \
    | grep -v 'apuda-news/publish.sh' \
    || true
  echo 'CRON_TZ=Asia/Seoul'
  echo "3 9 * * * $CRON_CMD"
) | crontab -

echo "Installed user cron:"
crontab -l
