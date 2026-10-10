#!/usr/bin/env python3
"""Read-only SNUBH official medical-team HTML diagnostic."""
import requests,urllib.robotparser,sys
from bs4 import BeautifulSoup
from urllib.parse import urljoin
ROOT="https://www.snubh.org"
URLS=[
ROOT+"/medical/drMedicalTeam.do?DP_CD=DCD16&DP_TP=O",
ROOT+"/medical/drMedicalTeam.do?DP_CD=RC&DP_TP=H"]
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
with requests.Session() as s:
 s.headers.update({"User-Agent":UA})
 r=s.get(ROOT+"/robots.txt",timeout=18,allow_redirects=False)
 print("ROBOTS",r.status_code,repr(r.text[:280]))
 if r.status_code!=200:sys.exit(2)
 rp=urllib.robotparser.RobotFileParser();rp.parse(r.text.splitlines())
 for url in URLS:
  print("URL",url,"ALLOWED",rp.can_fetch(UA,url))
  if not rp.can_fetch(UA,url):sys.exit(3)
  x=s.get(url,timeout=28,allow_redirects=False)
  print("LIST",x.status_code,"size",len(x.content),"final",x.url)
  x.raise_for_status()
  soup=BeautifulSoup(x.text,"html.parser")
  for name in ("김관민","이종석","조석기","이춘택"):
   for t in soup.find_all(string=lambda z:z and name in z)[:2]:
    print("DOCTOR",name)
    for p in list(t.parent.parents)[:4]:
     print("PARENT",p.name,str(p.get("class")),"html",str(p)[:600].replace("\n"," "))
  matches=[]
  for a in soup.select("a[href],a[onclick]"):
   text=a.get_text(" ",strip=True);href=a.get("href","");on=a.get("onclick","")
   if "의료진" in text or "교수" in text or "상세" in text or "doctor" in href.lower() or "Doctor" in on:
    matches.append((text[:40],href[:160],on[:160]))
  print("LINK_SAMPLES",matches[:25])
  for mark in ("전문진료분야","김관민","이종석"):
   pos=soup.get_text(" ",strip=True).find(mark)
   print("TEXT_AT",mark,soup.get_text(" ",strip=True)[max(0,pos-100):pos+320])
