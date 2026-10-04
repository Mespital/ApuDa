#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${APUDA_NEWS_ENV_FILE:-$HOME/.config/apuda/news.env}"
if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

: "${APUDA_REPO_DIR:=$HOME/apuda-repo}"
: "${APUDA_GITHUB_REPO:=Mespital/ApuDa}"
: "${APUDA_NEWS_BRANCH:=main}"
: "${APUDA_GITHUB_TOKEN:?APUDA_GITHUB_TOKEN is required}"

cd "$APUDA_REPO_DIR"
git fetch origin "$APUDA_NEWS_BRANCH"
git checkout "$APUDA_NEWS_BRANCH"
git reset --hard "origin/$APUDA_NEWS_BRANCH"

"$SCRIPT_DIR/.venv/bin/python" "$SCRIPT_DIR/news_bot.py" --repo-root "$APUDA_REPO_DIR"
"$SCRIPT_DIR/.venv/bin/python" "$SCRIPT_DIR/official_data.py"
"$SCRIPT_DIR/.venv/bin/python" "$SCRIPT_DIR/official_notices.py"
"$SCRIPT_DIR/.venv/bin/python" "$SCRIPT_DIR/hira_updates.py"
"$SCRIPT_DIR/.venv/bin/python" "$SCRIPT_DIR/nccn_monitor.py"
"$SCRIPT_DIR/.venv/bin/python" "$SCRIPT_DIR/drug_archive.py"

mapfile -t CHANGED_FILES < <(git status --porcelain -- public-site/news/data public-site/news/downloads | awk '{print substr($0,4)}')
if [ "${#CHANGED_FILES[@]}" -eq 0 ]; then
  echo "No news data changes."
  exit 0
fi

# Snapshot only generated/changed data files. If main advances while collectors run,
# re-apply these files on top of the new main instead of failing with non-fast-forward.
SNAPSHOT_DIR="$(mktemp -d)"
trap 'rm -rf "$SNAPSHOT_DIR"' EXIT
for path in "${CHANGED_FILES[@]}"; do
  mkdir -p "$SNAPSHOT_DIR/$(dirname "$path")"
  cp -a "$path" "$SNAPSHOT_DIR/$path"
done

AUTH="$(printf 'x-access-token:%s' "$APUDA_GITHUB_TOKEN" | base64 -w0)"
DATE_KST="$(TZ=Asia/Seoul date +%F)"

for attempt in 1 2 3; do
  echo "Publish attempt $attempt/3"
  git fetch origin "$APUDA_NEWS_BRANCH"
  git checkout "$APUDA_NEWS_BRANCH"
  git reset --hard "origin/$APUDA_NEWS_BRANCH"

  for path in "${CHANGED_FILES[@]}"; do
    mkdir -p "$(dirname "$path")"
    cp -a "$SNAPSHOT_DIR/$path" "$path"
  done

  git add -- "${CHANGED_FILES[@]}"
  if git diff --cached --quiet; then
    echo "Generated data is already current on origin/$APUDA_NEWS_BRANCH."
    exit 0
  fi

  git -c user.name="ApuDa News Bot" -c user.email="news-bot@apuda.app" commit -m "news: daily briefing $DATE_KST"

  if git -c http.https://github.com/.extraheader="AUTHORIZATION: basic $AUTH" push origin "$APUDA_NEWS_BRANCH"; then
    echo "News data published successfully."
    exit 0
  fi

  echo "Push raced with another main update; refreshing and retrying..."
  sleep $((attempt * 2))
done

echo "Failed to publish news data after 3 attempts."
exit 1
