"""ApuDa integrated V3/V4 isolation regression on a single synthetic origin.
This is a DEVELOPMENT / DRAFT PR check, not a production cutover.
Only localhost; external requests, Google Drive, SW, and real user records blocked.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import json

SITE=Path(__file__).resolve().parents[2]/"public-site"
assert (SITE/"note"/"index.html").is_file()
assert (SITE/"note-v4"/"v3-v4-handoff-lab.html").is_file()
NOTE_KEY="apuda_cancer_care_v1"
CHAT_KEY="apuda_note_chat_v1"
SYNTHETIC_NOTE={
 "profile":{"name":"통합 검증용 가상 환자","cancer":"가상암종","devices":[],"rxCombo":[],"rxPlan":[]},
 "checks":{},"logs":[],"labs":[],"meds":[],"roadmap":[],"questions":[{"question":"통합 시험 질문","id":"synth-q"}],
 "supports":[],"distress":[],"triage":{"items":[],"at":0},"meta":{}
}
SYNTHETIC_CHAT=[{"w":"me","h":"가상 대화 원문","c":"","key":"chat-synth","at":1}]
raw_note=json.dumps(SYNTHETIC_NOTE,ensure_ascii=False,separators=(",",":"))
raw_chat=json.dumps(SYNTHETIC_CHAT,ensure_ascii=False,separators=(",",":"))
seed="""(() => {
 if(location.hostname!=='127.0.0.1')return;
 if(localStorage.getItem('__apuda_integrated_test_only__')==='1')return;
 localStorage.setItem('apuda_cancer_care_v1',%s);
 localStorage.setItem('apuda_note_chat_v1',%s);
 localStorage.setItem('__apuda_integrated_test_only__','1');
})();""" % (json.dumps(raw_note,ensure_ascii=False),json.dumps(raw_chat,ensure_ascii=False))

class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):
  super().__init__(*args,directory=str(SITE),**kwargs)
 def log_message(self,*_args):pass
server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
origin=f"http://127.0.0.1:{server.server_address[1]}"
Thread(target=server.serve_forever,daemon=True).start()

passed=0
def verify(label,ok):
 global passed
 assert ok,label
 passed+=1
 print(f"PASS {passed:02d}: {label}",flush=True)

try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
  ctx=browser.new_context(service_workers="block",locale="ko-KR")
  ctx.add_init_script(script=seed)
  ctx.route("**/*",lambda route:route.continue_() if route.request.url.startswith(origin+"/") else route.abort())
  page=ctx.new_page()
  errors=[]
  page.on("pageerror",lambda err:errors.append(str(err)))
  initial=page.goto(origin+"/note/index.html",wait_until="domcontentloaded",timeout=30000)
  verify("V3 actual page available",initial is not None and initial.status==200)
  page.wait_for_function("() => typeof window.saveChat==='function' && !!window.ApuDaNoteUnsavedDraft")
  verify("V3 loads the synthetic profile",
         page.evaluate("state.profile.name")=="통합 검증용 가상 환자")
  original=page.evaluate("""() => ({
    note:localStorage.getItem('apuda_cancer_care_v1'),
    chat:localStorage.getItem('apuda_note_chat_v1')
  })""")
  verify("baseline original note exact",original["note"]==raw_note)
  verify("baseline original chat exact",original["chat"]==raw_chat)
  verify("V3 app shell has noindex from latest main",page.locator('meta[name="robots"][content="noindex"]').count()==1)
  v4=page.goto(origin+"/note-v4/v3-v4-handoff-lab.html",wait_until="load",timeout=30000)
  verify("V4 isolated handoff lab available",v4 is not None and v4.status==200)
  verify("V4 test page noindex",page.locator('meta[name="robots"][content*="noindex"]').count()==1)
  page.locator("#run").click()
  page.wait_for_function("""() => ['pass','fail'].includes(document.getElementById('summary').dataset.result)""",timeout=45000)
  summary=page.locator("#summary").inner_text()
  verify("V4 synthetic atomic handoff 15/15 passes",page.locator("#summary").get_attribute("data-result")=="pass" and "15/15" in summary)
  verify("V4 lab deletes synthetic IndexedDBs", "삭제 확인" in summary)
  after=page.evaluate("""() => ({
    note:localStorage.getItem('apuda_cancer_care_v1'),
    chat:localStorage.getItem('apuda_note_chat_v1')
  })""")
  verify("V4 staging does not modify V3 profile original",after["note"]==original["note"])
  verify("V4 staging does not modify V3 chat original",after["chat"]==original["chat"])
  back=page.goto(origin+"/note/index.html",wait_until="domcontentloaded")
  verify("V3 remains available after V4 rehearsal",back is not None and back.status==200)
  page.wait_for_function("() => typeof window.saveChat==='function'")
  verify("V3 original profile loads unchanged after V4 test",page.evaluate("state.profile.name")=="통합 검증용 가상 환자")
  verify("V3 chat exact raw retained after V4 test",
         page.evaluate("localStorage.getItem('apuda_note_chat_v1')")==raw_chat)
  verify("V3/V4 isolation has no browser page errors",not errors)
  ctx.close()
  browser.close()
finally:
 server.shutdown()
 server.server_close()
print(f"RESULT {passed}/{passed} PASS — combined V3 / V4 synthetic isolation on localhost",flush=True)
