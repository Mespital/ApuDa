import re
#!/usr/bin/env python3
"""Read-only Boramae doctors department markup and profile-link audit."""
import requests,urllib.robotparser
from bs4 import BeautifulSoup
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
HOST="https://www.brmh.org"
CODES=["001023000"]
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
  scripts=soup.select("script")
  detail=HOST+"/custom/popup/layer_doctor_view.do?dt_no=421&medi_code=001023000%7C001023000"
  print("DETAIL_ROBOT_ALLOWED",rp.can_fetch(UA,detail),flush=True)
  if rp.can_fetch(UA,detail):
   response=s.get(detail,timeout=20,allow_redirects=False,headers={"Referer":url})
   detail_text=BeautifulSoup(response.text,"html.parser").get_text(" ",strip=True)
   print("DETAIL_HTTP",response.status_code,"LEN",len(response.content),"HAS_NAME",("서경석" in detail_text),"SAMPLE",detail_text[:350],flush=True)
  print("SCRIPT_SOURCE_COUNT",len(scripts),flush=True)
  for script in scripts:
   body=script.get_text(" ",strip=False)
   if "function openDoctorView" in body or "openDoctorView = function" in body:
    pos=body.find("openDoctorView")
    print("JS_SOURCE_FN",body[max(0,pos-150):pos+2500],flush=True)
  print("JS_URLS",[(a.get("src") or "") for a in scripts if any(term in (a.get("src") or "").lower() for term in ["doctor","medical","medi","custom"])][:25],flush=True)
  for src in ["/common/js/mediteam.js"]:
   scripturl=HOST+src
   if not rp.can_fetch(UA,scripturl):
    print("JS_ROBOTS_DENIED",src,flush=True)
    continue
   code=s.get(scripturl,timeout=18,allow_redirects=False)
   print("JS_HTTP",code.status_code,"LENGTH",len(code.content),flush=True)
   if code.status_code==200:
    txt=code.text
    for phrase in ("openDoctorView","doctor_view","doctor_info","doctorView"):
     index=txt.find(phrase)
     if index>=0:print("JS_MATCH",phrase,re.sub(r"\\s+"," ",txt[max(0,index-220):index+2200]),flush=True)
  for inline in scripts:
   txt=inline.get_text("",strip=False)
   i=txt.find("function openDoctorView")
   if i>=0:print("INLINE_JS_FN",re.sub(r"\\s+"," ",txt[i:i+2400]),flush=True)

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
