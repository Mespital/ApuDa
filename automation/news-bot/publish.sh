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

if git diff --quiet -- public-site/news/data; then
  echo "No news data changes."
  exit 0
fi

git add public-site/news/data
DATE_KST="$(TZ=Asia/Seoul date +%F)"
git -c user.name="ApuDa News Bot" -c user.email="news-bot@apuda.app" commit -m "news: daily briefing $DATE_KST"

AUTH="$(printf 'x-access-token:%s' "$APUDA_GITHUB_TOKEN" | base64 -w0)"
git -c http.https://github.com/.extraheader="AUTHORIZATION: basic $AUTH" push origin "$APUDA_NEWS_BRANCH"
