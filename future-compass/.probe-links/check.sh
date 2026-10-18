#!/usr/bin/env bash
UA='Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36'
out=future-compass/.probe-links/detail.txt; : > $out
for h in dt.edunet.net webdt.edunet.net dtbook.edunet.net www.zocbo.com zocbo.com; do echo "DNS $h: $(getent hosts $h | head -1)" >> $out; done
for u in https://webdt.edunet.net https://dtbook.edunet.net https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1010; do
  echo "===== $u" >> $out
  curl -sSL --compressed -m 40 -A "$UA" -D - "$u" -o /tmp/b 2>&1 | grep -iE '^(HTTP|location|curl)' | head -6 >> $out
  iconv -f utf-8 -t utf-8 -c /tmp/b | grep -oE '<title>[^<]*' | head -1 >> $out
  iconv -f utf-8 -t utf-8 -c /tmp/b | tr '\n' ' ' | grep -oE '.{60}(잘못된 접근|장래인구|연령구조|인구구조|지표명)[^<]{0,80}' | head -5 >> $out
done
