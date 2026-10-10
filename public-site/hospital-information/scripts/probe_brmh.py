#!/usr/bin/env python3
"""Read-only Boramae doctors department markup and profile-link audit."""
import requests,urllib.robotparser
from bs4 import BeautifulSoup
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
HOST="https://www.brmh.org"
CODES=["001035000","001023000","001011000","001010000"]
s=requests.Session();s.headers.update({"User-Agent":UA})
r=s.get(HOST+"/robots.txt",timeout=15,allow_redirects=False)
print("ROBOTS",r.status_code,flush=True)
if r.status_code!=200:raise SystemExit(2)
rp=urllib.robotparser.RobotFileParser();rp.parse(r.text.splitlines())
for code in CODES:
 url=HOST+"/medical/medi_doctor_info.do?mcode="+code
 print("DEPARTMENT",code,"ROBOT_ALLOWED",rp.can_fetch(UA,url),flush=True)
 if not rp.can_fetch(UA,url):continue
 try:
  rr=s.get(url,timeout=22,allow_redirects=False)
  print("HTTP",rr.status_code,"SIZE",len(rr.content),flush=True)
  if rr.status_code!=200:continue
  soup=BeautifulSoup(rr.text,"html.parser")
  for name in ["곽재용","서경석","전혜원","정현"]:
   t=soup.find_all(string=lambda z:z and z.strip()==name)
   if not t:continue
   x=t[0].parent
   print("NAME",name,"CHILD",str(x)[:180],flush=True)
   for i,p in enumerate(x.parents):
    if i>=5:break
    print("PARENT",i,p.name,p.get("class"),"TEXT",p.get_text(" ",strip=True)[:260],flush=True)
    print("PARENT_LINKS",i,[(a.get_text(" ",strip=True)[:25],a.get("href","")[:150],a.get("onclick","")[:90]) for a in p.select("a[href],a[onclick]")][:5],flush=True)
  print("MEDICAL_LIST",[(x.get("class"),x.get_text(" ",strip=True)[:150]) for x in soup.select("li, div, article") if any(c in " ".join(x.get("class",[])).lower() for c in ["doctor","medical","staff"])][:12],flush=True)
  print("PROFILE_LINKS",[(a.get_text(" ",strip=True)[:25],a.get("href","")[:160],a.get("onclick","")[:100]) for a in soup.select("a[href],a[onclick]") if any(t in a.get_text(" ",strip=True) for t in ["자세히 보기","의료진"])][:15],flush=True)
 except Exception as e:print("ERROR",type(e).__name__,str(e)[:180],flush=True)
