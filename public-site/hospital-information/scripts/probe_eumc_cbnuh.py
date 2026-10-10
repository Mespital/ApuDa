import requests,urllib.robotparser
from bs4 import BeautifulSoup
UA="ApuDaMedicalDirectoryBot/1.0 (+https://apuda.app/)"
cases=[
("eumc","https://mokdong.eumc.ac.kr","/medical/dept/deptScheduleInfo.do?dept_cd=IMH&grp_yn=N",["조정민","함아롱"]),
("eumc-profile","https://mokdong.eumc.ac.kr","/doctor/basicInfo.do?dept_cd=IMH&dr_sid=1013917",["조정민"]),
("cbnuh","https://www.cbnuh.or.kr","/prog/clnicDept/main/sub01_01_02/view.do?clndCd=IMH",[])]
for name,root,path,names in cases:
 print("==",name,root+path,flush=True)
 try:
  s=requests.Session();s.headers.update({"User-Agent":UA})
  rb=s.get(root+"/robots.txt",timeout=14,allow_redirects=False)
  print("ROBOTS",rb.status_code,flush=True)
  if rb.status_code!=200:continue
  rp=urllib.robotparser.RobotFileParser();rp.parse(rb.text.splitlines())
  if not rp.can_fetch(UA,root+path):print("ROBOTS_DENIED",flush=True);continue
  response=s.get(root+path,timeout=23,allow_redirects=False)
  print("HTTP",response.status_code,"bytes",len(response.content),flush=True)
  if response.status_code!=200:continue
  soup=BeautifulSoup(response.text,"html.parser")
  for who in names:
   for node in soup.find_all(string=lambda z:z and who in z)[:1]:
    for i,p in enumerate(list(node.parent.parents)[:5]):
     print("CARD",who,i,p.name,p.get("class"),p.get_text(" ",strip=True)[:230],[(a.get_text(" ",strip=True)[:25],a.get("href","")[:130]) for a in p.select("a[href]")[:3]],flush=True)
  print("DOCTOR_LINKS",[(a.get_text(" ",strip=True)[:24],a.get("href","")[:160]) for a in soup.select("a[href]") if any(x in a.get("href","").lower() for x in ["doctor","dr_sid","clndcd"])][:25],flush=True)
 except Exception as exc:print("ERROR",type(exc).__name__,str(exc)[:160],flush=True)
