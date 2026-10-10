#!/usr/bin/env python3
"""Read-only official AMC staff listing probe. Never stores clinical data."""
import re
import sys
import urllib.robotparser
from collections import Counter
from urllib.parse import urljoin,urlparse,parse_qs
import requests
from bs4 import BeautifulSoup
BASE="https://www.amc.seoul.kr"
URL=BASE+"/asan/depts/cancer/K/staffcancer.do?menuId=3744"
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
s=requests.Session()
s.headers.update({"User-Agent":UA})
try:
    robots=s.get(BASE+"/robots.txt",timeout=15,allow_redirects=False)
    print("ROBOTS status",robots.status_code,"sample",repr(robots.text[:300]))
    if robots.status_code!=200:
        raise RuntimeError("robots.txt unavailable, abort per policy")
    parser=urllib.robotparser.RobotFileParser()
    parser.parse(robots.text.splitlines())
    print("ROBOTS allowed:",parser.can_fetch(UA,URL))
    if not parser.can_fetch(UA,URL):sys.exit(3)
    r=s.get(URL,timeout=25,allow_redirects=True)
    print("LIST status:",r.status_code,"final:",r.url,"bytes:",len(r.content))
    r.raise_for_status()
    sp=BeautifulSoup(r.text,"html.parser")
    for txt in ("김민지","김용희","이대호","송시열"):
        tags=sp.find_all(string=lambda z:z and z.strip()==txt)
        print("NAME",txt,"matches",len(tags))
        for t in tags[:2]:
            p=t.parent
            print("  parent",str(p)[:350])
            for ancestor in list(p.parents)[:5]:
                print("  ancestor",ancestor.name,ancestor.get("class"),ancestor.get("id"),str(ancestor)[:230].replace("\n"," "))
    links=[]
    for a in sp.find_all("a",href=True):
        h=a["href"];tx=a.get_text(" ",strip=True)
        if "staffcancer" in h or "staff" in h.lower() or "의료진소개" in tx:
            links.append((tx[:40],urljoin(r.url,h)))
    for x in list(dict.fromkeys(links))[:40]:
        print("LINK",repr(x[0]),x[1])
    print("TEXT REGION:")
    text=sp.get_text(" ",strip=True)
    idx=text.find("김민지")
    print(text[max(0,idx-100):idx+600])
except Exception as e:
    print("PROBE_ERROR",type(e).__name__,str(e))
    sys.exit(2)
