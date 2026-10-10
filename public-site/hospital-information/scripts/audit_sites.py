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
    for title,root,path in TARGETS:
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
