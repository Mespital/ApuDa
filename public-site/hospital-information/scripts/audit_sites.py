#!/usr/bin/env python3
"""Audit public medical directory HTML and robots policies (read-only)."""
import requests, urllib.robotparser, re, json
from urllib.parse import urljoin
from bs4 import BeautifulSoup
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
TARGETS=[
("jbuh-imho","https://www.jbuh.co.kr","/prog/mdcl/main/sub01_01_01/viewStf.do?mdclCd=IMHO"),
("jbuh-impm","https://www.jbuh.co.kr","/prog/mdcl/main/sub01_01_01/viewStf.do?mdclCd=IMPM"),
("jbuh-rt","https://www.jbuh.co.kr","/prog/mdcl/main/sub01_01_01/viewStf.do?mdclCd=RT"),
("sev-doctors","https://www.severance.healthcare","/sev/doctor/doctor.do"),
("sev-cancer","https://cancer.severance.healthcare","/cancer/doctor/doctor.do"),
("cmc-doctors","https://www.cmcseoul.or.kr","/page/doctor"),
("smc-doctors","https://www.samsunghospital.com","/home/reservation/deptDoctor.do"),
("snuh-doctors","https://www.snuh.org","/health/nMedInfo/nMedicalInfo.do")
]
def main():
    for title,root,path in TARGETS[:1]:
        print("\n=== TARGET",title,root+path,"===",flush=True)
        try:
            s=requests.Session();s.headers.update({"User-Agent":UA,"Accept":"text/html"})
            rb=s.get(root+"/robots.txt",timeout=12,allow_redirects=False)
            print("ROBOTS",rb.status_code,flush=True)
            if rb.status_code!=200:
                print("SKIP policy unavailable",flush=True);continue
            rp=urllib.robotparser.RobotFileParser();rp.parse(rb.text.splitlines())
            url=root+path;allowed=rp.can_fetch(UA,url)
            print("ALLOWED",allowed,flush=True)
            if not allowed:continue
            resp=s.get(url,timeout=20,allow_redirects=False)
            print("HTTP",resp.status_code,"SIZE",len(resp.content),"FINAL",resp.url,flush=True)
            if resp.status_code!=200:continue
            soup=BeautifulSoup(resp.text,"html.parser")
            print("TITLE",soup.title.get_text(" ",strip=True)[:140] if soup.title else "",flush=True)
            for i,block in enumerate(soup.select(".doctor-list")[:1]):
                print("DOCTOR_LIST_CHILDREN",[(x.name,x.get("class")) for x in block.find_all(recursive=False)][:10],flush=True)
                for item in block.find_all(recursive=False)[:2]:
                    print("CARD_HTML",i,str(item)[:5500].replace("\\n"," "),flush=True)
                    i+=1
            print("DEPT_LINKS",[(a.get_text(" ",strip=True)[:35],a.get("href","")[:120]) for a in soup.select('a[href*="viewStf.do"]')][:50],flush=True)

            for i, name in enumerate(soup.select(".doctor-list .dl-name")[:3]):
                box=name
                for j in range(3):
                    box=box.parent
                    print("DOCTOR_ANCESTOR",i,j,box.name,box.get("class"),re.sub(r"\\s+"," ",str(box))[:2800],flush=True)
            print("CARD_COUNTS",len(soup.select(".doctor-list .dl-name")),flush=True)
            inner=soup.select_one(".doctor-list .dl-inner")
            if inner:
                print("INNER_CHILD_CLASSES",[(x.name,x.get("class")) for x in inner.find_all(recursive=False)][:18],flush=True)
            for name in soup.select(".doctor-list .dl-name")[:2]:
                container=name.find_parent(class_="dl-text-box")
                if container:
                    print("NAME_AND_SPECIALTY",container.get_text(" ",strip=True)[:1100],flush=True)
                for level in range(1,6):
                    ancestor=list(name.parents)[level]
                    links=[(x.get_text(" ",strip=True)[:30],x.get("href")) for x in ancestor.select("a[href]")]
                    if links and any("mdclStfEmplNo" in (h or "") for t,h in links):
                        print("PROFILE_CONTAINER",level,ancestor.get("class"),"TEXT",ancestor.get_text(" ",strip=True)[:1100],"LINKS",links[:4],flush=True)
                        break
            for pattern in ["li","div","article"]:
                counts=[]
                for element in soup.select(pattern+"[class]"):
                    c=" ".join(element.get("class",[]))
                    if any(z in c.lower() for z in ["doctor","staff","prof","mdcl","medi"]):
                        counts.append((c,len(element.get_text(" ",strip=True))))
                print("DOCTOR_CLASS",pattern,counts[:16],flush=True)
            for name in ["김진영","박승용","이흥범","최영훈","이종석"]:
                m=soup.find_all(string=lambda x:x and name in x)
                if m:
                    for node in m[:1]:
                        el=node.parent
                        print("NAME",name,"parent",str(el)[:180],"ancestor",str(el.parent.parent)[:750],flush=True)
            print("DOC_LINKS",[(x.get_text(" ",strip=True)[:35],x.get("href","")[:170]) for x in soup.select("a[href]") if any(y in x.get("href","").lower() for y in ["mdclstf","doctor","prof","staff","medical"])][:15],flush=True)
            print("BODY_SAMPLE",soup.get_text(" ",strip=True)[-950:],flush=True)
        except Exception as e:
            print("ERROR",type(e).__name__,str(e)[:180],flush=True)
if __name__=="__main__":main()
