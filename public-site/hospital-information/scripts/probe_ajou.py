#!/usr/bin/env python3
"""Official Ajou cancer center page structure, read-only, respecting robots."""
import sys,requests,urllib.robotparser
from bs4 import BeautifulSoup
from urllib.parse import urljoin
ROOT="https://hosp.ajoumc.or.kr"
URL=ROOT+"/doctor/profCancerList.do?deptNo=38"
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
with requests.Session() as s:
 s.headers.update({"User-Agent":UA})
 robots=s.get(ROOT+"/robots.txt",timeout=18,allow_redirects=False)
 print("ROBOTS",robots.status_code,repr(robots.text[:300]))
 if robots.status_code!=200:sys.exit(2)
 rp=urllib.robotparser.RobotFileParser();rp.parse(robots.text.splitlines())
 print("ALLOW",rp.can_fetch(UA,URL))
 if not rp.can_fetch(UA,URL):sys.exit(3)
 response=s.get(URL,timeout=25,allow_redirects=False)
 print("HTTP",response.status_code,"SIZE",len(response.content),"URL",response.url)
 response.raise_for_status()
 soup=BeautifulSoup(response.text,"html.parser")
 for name in ("함석진","유우식","정준호"):
  for x in soup.find_all(string=lambda z:z and z.strip()==name)[:2]:
   print("DOCTOR",name)
   p=x.parent
   for a in list(p.parents)[:5]:
    print("PARENT",a.name,a.get("class"),str(a)[:700].replace("\n"," "))
 print("CARDS",len(soup.select("li.doc_blk")))
 for card in soup.select("li.doc_blk")[:3]:
  print("CARD_ANCHORS",[(x.get_text(" ",strip=True),x.get("href"),x.get("onclick")) for x in card.select("a[href],a[onclick]")])
  print("CARD_HTML_END",str(card)[-1100:].replace("\\n"," "))
 print("ONCOLOGY_MENU",[(x.get_text(" ",strip=True),x.get("href")) for x in soup.select('a[href*="profCancerList.do?deptNo="]')][:40])
 print("ANCHOR_SAMPLES")
 links=[]
 for a in soup.select("a[href],a[onclick]"):
  text=a.get_text(" ",strip=True)
  href=a.get("href","");js=a.get("onclick","")
  if ("자세히" in text or "의료진" in text or "prof" in href or "deptNo=" in href or js):
   links.append((text[:25],href[:160],js[:180]))
 for l in links[:55]:print(l)
 print("JS_HANDLER_CALLS")
 for script in soup.select("script"):
  t=script.get_text(" ",strip=True)
  if "openDoctorView" in t:
   pos=t.find("openDoctorView")
   print("HANDLER_JS",repr(t[max(0,pos-100):pos+900]))
 print("JS_SOURCES",[x.get("src") for x in soup.select("script[src]") if "doctor" in x.get("src","").lower() or "prof" in x.get("src","").lower()])
 for kw in ("위암센터","폐암센터","유방암센터"):
  for node in soup.find_all(string=lambda z:z and z.strip()==kw)[:2]:
   print("MENU_NODE",kw,str(node.parent.parent)[:900].replace("\\n"," "))
 print("TEXT",soup.get_text(" ",strip=True)[-2200:])
