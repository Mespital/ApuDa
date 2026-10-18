#!/usr/bin/env bash
UA='Mozilla/5.0 (Linux; Android 14; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Mobile Safari/537.36'
out=future-compass/.probe-links/detail.txt; : > $out
for u in https://dt.edunet.net http://dt.edunet.net https://www.zocbo.com http://www.zocbo.com https://m.zocbo.com https://edu.fss.or.kr https://www.fss.or.kr/edu https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1010 https://www.adiga.kr/ https://stdict.korean.go.kr https://www.kocw.net https://read365.edunet.net https://www.ebsi.co.kr/ https://www.moe.go.kr/ https://health.kdca.go.kr https://www.climate.go.kr https://www.law.go.kr; do
  echo "===== $u" >> $out
  curl -sSL --compressed -m 60 --retry 2 -A "$UA" -H 'Accept-Language: ko-KR' -D - "$u" -o /tmp/b 2>&1 | grep -iE '^(HTTP|location|curl)' | head -6 >> $out
  iconv -f utf-8 -t utf-8 -c /tmp/b 2>/dev/null | tr '\n\r\t' '   ' | sed 's/  */ /g' | head -c 700 >> $out; echo >> $out
  iconv -f utf-8 -t utf-8 -c /tmp/b 2>/dev/null | grep -oE '.{80}잘못된 접근.{80}' | head -1 >> $out
done
