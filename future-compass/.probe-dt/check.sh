#!/usr/bin/env bash
UA='Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
out=future-compass/.probe-dt/out.txt; : > $out
for u in https://webdt.edunet.net/login https://webdt.edunet.net/ https://dtbook.edunet.net/ https://www.edunet.net/; do
  echo "===== $u" >> $out
  curl -sS -m 40 -A "$UA" -D - -o /tmp/b "$u" 2>&1 | grep -iE '^(HTTP|location|x-frame-options|content-security-policy|set-cookie|curl)' | cut -c1-300 >> $out
  tr '\n' ' ' < /tmp/b | grep -oE '<title>[^<]*|frame-ancestors[^;"]*' | head -3 >> $out
  tr '\n' ' ' < /tmp/b | head -c 1500 >> $out; echo >> $out
done
