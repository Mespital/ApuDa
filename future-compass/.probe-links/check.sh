#!/usr/bin/env bash
# 링크 점검: 상태코드·최종 주소·제목·크기·'없는 페이지' 문구
UA='Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36'
out=future-compass/.probe-links/result.tsv; : > $out
while read -r u; do
  [ -z "$u" ] && continue
  f=$(mktemp)
  meta=$(curl -sSL --compressed -m 25 -A "$UA" -H 'Accept-Language: ko-KR,ko;q=0.9' -o "$f" -w '%{http_code}\t%{url_effective}\t%{size_download}\t%{time_total}' "$u" 2>&1 | tr '\n' ' ')
  t=$(iconv -f utf-8 -t utf-8 -c "$f" 2>/dev/null | tr '\n\r' '  ' | grep -oiE '<title[^>]*>[^<]{0,120}' | head -1 | sed 's/<title[^>]*>//I')
  bad=$(iconv -f utf-8 -t utf-8 -c "$f" 2>/dev/null | grep -oiE '페이지를 찾을 수 없|존재하지 않는|잘못된 접근|404 Not Found|Page Not Found|삭제된 게시물|서비스 종료|접근이 차단|해외 IP|Access Denied' | head -1)
  printf '%s\t%s\t%s\t%s\n' "$u" "$meta" "$t" "$bad" >> $out
  rm -f "$f"
done < future-compass/.probe-links/urls.txt
