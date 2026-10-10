#!/usr/bin/env python3
"""Official healthcare site adapter reconnaissance. Read-only; robots first."""
import requests,urllib.robotparser,re,json,sys
from urllib.parse import urljoin
from bs4 import BeautifulSoup
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
SOURCES=[
 ("ajou-cancer","https://hosp.ajoumc.or.kr","/doctor/profCancerList.do?deptNo=116",["이현우","안미선"]),
 ("ajou-urology","https://hosp.ajoumc.or.kr","/doctor/profDeptList.do?deptNo=5",["김선일","추설호"]),
 ("ajou-search","https://hosp.ajoumc.or.kr","/search/search.do?keyword=폐암",[]),
 ("hwasun","https://www.cnuhh.com","/medical/info/dept.cs?mode=doctor",["윤명하"]),
 ("ncc","https://www.ncc.re.kr","/ncc_about03_param.ncc?searchKey=&searchValue=&dept=",[]),
 ("kuh","https://www.kuh.ac.kr","/doctor/basicInfo.do?dr_sid=20140123",["최우석"]),
 ("snuh","https://www.snuh.org","/blog/01045/career.do",["류지곤"]),
]
for name,domain,path,who in SOURCES:
 print("\n=== SOURCE",name,domain+path,flush=True)
 try:
  ses=requests.Session();ses.headers.update({"User-Agent":UA})
  robots=ses.get(domain+"/robots.txt",timeout=15,allow_redirects=False)
  print("ROBOTS",robots.status_code,flush=True)
  if robots.status_code!=200:continue
  rp=urllib.robotparser.RobotFileParser();rp.parse(robots.text.splitlines())
  url=domain+path
  allowed=rp.can_fetch(UA,url)
  print("ALLOWED",allowed,flush=True)
  if not allowed:continue
  r=ses.get(url,timeout=25,allow_redirects=False)
  print("HTTP",r.status_code,"SIZE",len(r.content),"REDIRECT",r.headers.get("location",""),flush=True)
  if r.status_code!=200:continue
  soup=BeautifulSoup(r.text,"html.parser")
  print("TITLE",soup.title.get_text(" ",strip=True)[:100] if soup.title else "-",flush=True)
  for term in who:
   matches=soup.find_all(string=lambda z:z and term in z)
   for t in matches[:1]:
    for level,ancestor in enumerate(list(t.parent.parents)[:5]):
     links=[(a.get_text(" ",strip=True)[:35],a.get("href","")[:140],a.get("onclick","")[:100]) for a in ancestor.select("a[href],a[onclick]")[:3]]
     print("DOCTOR",term,"LEVEL",level,"TAG",ancestor.name,"CLASS",ancestor.get("class"),"TEXT",ancestor.get_text(" ",strip=True)[:320],"LINKS",links,flush=True)
  for token in ["의료진","전문분야","진료분야"]:
   names=[]
   for text in soup.find_all(string=lambda z:z and z.strip()==token)[:2]:
    p=text.parent
    names.append(str(p.parent)[:1500].replace("\n"," "))
   print("TOKEN",token,names,flush=True)
  links=[(a.get_text(" ",strip=True)[:30],a.get("href","")[:180],a.get("onclick","")[:140]) for a in soup.select("a[href],a[onclick]") if any(x in (a.get("href","")+" "+a.get("onclick","")).lower() for x in ["prof", "doctor", "staff","view"])]
  print("LINK_COUNT",len(links),"EXAMPLES",links[:14],flush=True)
  print("CLASS_HINTS",[(tag.get("class"),tag.get_text(" ",strip=True)[:80]) for tag in soup.select("li[class],article[class]") if any(x in " ".join(tag.get("class",[])).lower() for x in ["prof","doctor","staff","card","list"])][:15],flush=True)
 except Exception as e:print("ERROR",type(e).__name__,str(e)[:200],flush=True)
