#!/usr/bin/env bash
# 앱 안의 외부 링크 점검 (2026-10-19). 사용: bash scripts/check-links.sh > links.tsv
# 열: 주소, 상태코드, 최종 주소, 크기(바이트), 제목
# 주의: 해외 서버(GitHub Actions 등)에서 돌리면 일부 한국 사이트가 해외 접속을 막아 시간 초과로 보일 수 있다(예: 족보닷컴). 한국 네트워크에서 다시 확인할 것.
cd "$(dirname "$0")/../dist" || exit 1
UA='Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36'
grep -rhoE "https?://[a-zA-Z0-9./?=_&%:#~+@-]+" *.js *.html hub/*.js hub/*.json 2>/dev/null | sed 's/[.,)]*$//' \
  | grep -vE "apuda\.app|w3\.org|localhost|schema\.org|example|fonts\.|cdn|unpkg|api\.|map\.naver|kyobobook|nominatim|formsubmit|githubusercontent|chatgpt\.com" | sort -u \
  | while read -r u; do
      f=$(mktemp)
      m=$(curl -sSL --compressed -m 30 -A "$UA" -H 'Accept-Language: ko-KR' -o "$f" -w '%{http_code}\t%{url_effective}\t%{size_download}' "$u" 2>/dev/null || echo "000		0")
      t=$(tr '\n' ' ' < "$f" | grep -oiE '<title[^>]*>[^<]{0,80}' | head -1 | sed 's/<title[^>]*>//I')
      printf '%s\t%s\t%s\n' "$u" "$m" "$t"; rm -f "$f"
    done
