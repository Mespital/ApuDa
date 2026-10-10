#!/usr/bin/env python3
"""Read-only audit of additional searchable official doctor directories."""
import requests,re,urllib.robotparser
from urllib.parse import quote
from bs4 import BeautifulSoup
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
TARGETS=[
("anam","https://anam.kumc.or.kr","/kr/doctor-department/doctor.do"),
("guro","https://guro.kumc.or.kr","/kr/doctor-department/doctor.do"),
("ansan","https://ansan.kumc.or.kr","/kr/doctor-department/doctor.do"),
("smc-stomach","https://www.samsunghospital.com","/home/reservation/doctorDetailInfo.do?SW="+quote("위암")),
("smc-lung","https://www.samsunghospital.com","/home/reservation/doctorDetailInfo.do?SW="+quote("폐암"))
]
for title,root,path in TARGETS:
 print("\n===",title,root+path,flush=True)
 try:
  s=requests.Session();s.headers.update({"User-Agent":UA})
  robots=s.get(root+"/robots.txt",timeout=15,allow_redirects=False)
  print("ROBOTS",robots.status_code,flush=True)
  if robots.status_code!=200:continue
  parser=urllib.robotparser.RobotFileParser();parser.parse(robots.text.splitlines())
  if not parser.can_fetch(UA,root+path):print("POLICY_DENIED",flush=True);continue
  resp=s.get(root+path,timeout=22,allow_redirects=False)
  print("FETCH",resp.status_code,len(resp.content),flush=True)
  if resp.status_code!=200:continue
  soup=BeautifulSoup(resp.text,"html.parser")
  print("PAGE",soup.title.get_text(" ",strip=True)[:100] if soup.title else "-",flush=True)
  names=["강은주","강석호","이준행","엄상원","이경종","강상희","강가원"]
  for name in names:
   matches=soup.find_all(string=lambda t:t and t.strip()==name)
   if matches:
    a=matches[0].parent
    print("MATCH",name,"PARENT",str(a)[:300].replace("\n"," "),flush=True)
    for i,p in enumerate(a.parents):
     if i>=5:break
     print("ANCESTOR",i,p.name,p.get("class"),"TEXT",p.get_text(" ",strip=True)[:240],flush=True)
     links=[(q.get_text(" ",strip=True)[:30],q.get("href","")[:160],q.get("onclick","")[:100]) for q in p.select("a[href],a[onclick]")]
     print("ANCESTOR_LINKS",i,links[:3],flush=True)
  print("DOCTOR_CLASS_COUNTS",[(cls,len(soup.select(cls))) for cls in [
   ".doctor-list",".doctor-item",".doctor-wrap",".list-item",".doctors-list",
   ".doc-list",".doctor-area",".doctor-card",".professor-list",
   ".doc_profile",".doctor-lst",".doctor_info"]],flush=True)
  print("PROFILE_LINKS",[(a.get_text(" ",strip=True)[:20],a.get("href","")[:170]) for a in soup.select("a[href]") if any(v in a.get("href","").lower() for v in ["doctor", "professor", "profile", "staff"])][:16],flush=True)
 except Exception as e:
  print("ERROR",type(e).__name__,str(e)[:150],flush=True)
