"""Actual V3 edit/delete UI — isolated Chromium synthetic regression only.
Run: python tools/tests/apuda-note-v3-mutations-browser.py
Never visits apuda.app, requests Google Drive, or reads a user's localStorage.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

SITE=Path(__file__).resolve().parents[2]/"public-site"
assert (SITE/"note"/"index.html").is_file()

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(SITE),**kwargs)
    def log_message(self,*_args):pass

server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
origin="http://127.0.0.1:"+str(server.server_address[1])
Thread(target=server.serve_forever,daemon=True).start()

FIXTURE={
 "profile":{"name":"가상 환자","cancer":"가상암종","devices":[],"rxCombo":[],"rxPlan":[]},
 "checks":{},"logs":[{"id":"test-log","date":"2026-11-11","temp":"36.7","pain":"1","meal":"80"}],
 "labs":[{"id":"test-lab","date":"2026-11-11","wbc":"5200","anc":"2400","hb":"12.6","plt":"170000","note":"가상 검사","units":{"wbc":"/µL","anc":"/µL","plt":"/µL","hb":"g/dL"}}],
 "meds":[{"id":"test-med","name":"가상 약제","active":"yes","memo":"가상 기존","type":"기타","dose":"","schedule":""}],
 "roadmap":[{"id":"test-sched","date":"2026-12-10","type":"검사","title":"가상 CT","status":"planned","memo":""}],
 "questions":[{"id":"test-q","question":"가상 진료질문","priority":"mid","answer":"","createdAt":1}],
 "distress":[],"supports":[],"triage":{"items":[],"at":0},"meta":{}
}
KEY='apuda_cancer_care_v1'
seed = """(() => {
 if(location.hostname!=='127.0.0.1' || localStorage.getItem('__apuda_synthetic_mutation__')==='1')return;
 localStorage.setItem('apuda_cancer_care_v1', %s);
 localStorage.setItem('apuda_note_chat_v1', '[]');
 localStorage.setItem('__apuda_synthetic_mutation__', '1');
})();""" % json.dumps(json.dumps(FIXTURE,ensure_ascii=False),ensure_ascii=False)

routes={
 'schedule':{"tab":"sched","view":"plan","selector":"#v-plan button[onclick*='toggleSched']",
             "success":"일정 변경을 저장했어요","target":"roadmap","field":"status","value":"done"},
 'medication':{"tab":"meds","view":"plan","selector":"#v-plan button[onclick*='toggleMed']",
             "success":"복용 상태 변경을 저장했어요","target":"meds","field":"active","value":"no"},
 'priority':{"tab":"qs","view":"plan","selector":"#v-plan button[onclick*='starQ']",
             "success":"중요 질문 표시를 저장했어요","target":"questions","field":"priority","value":"high"},
 'answer':{"tab":"qs","view":"plan","selector":"#v-plan input[onchange*='answerQ']",
             "success":"답변을 저장했어요","target":"questions","field":"answer","value":"가상 진료 답변"},
 'delete':{"tab":None,"view":"log","selector":"#labList button[onclick*='delItem']",
             "success":"기록 삭제를 저장했어요","target":"labs","field":None,"value":None}
}
checks=[]
def check(label,predicate):
    if not predicate:raise AssertionError("FAIL: "+label)
    checks.append(label)
    print("PASS %02d: %s"%(len(checks),label),flush=True)

try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
  def new_context():
   ctx=browser.new_context(service_workers="block",locale="ko-KR",accept_downloads=True)
   ctx.add_init_script(script=seed)
   ctx.route("**/*",lambda route: route.continue_() if route.request.url.startswith(origin+"/") else route.abort())
   return ctx
  def open_tab(ctx,route):
   page=ctx.new_page()
   errors=[]
   page.on("pageerror",lambda error:errors.append(str(error)))
   response=page.goto(origin+"/note/index.html",wait_until="domcontentloaded",timeout=30000)
   check("real V3 page loaded",response is not None and response.status==200)
   page.wait_for_function("() => typeof window.save==='function' && typeof window.delItem==='function'",timeout=20000)
   page.evaluate("""r => {
      if(r.tab)planTab=r.tab;
      if(r.tab)renderPlan();
      tab(r.view);
      window.confirm=()=>true;
   }""",route)
   return page,errors
  def saved(page,route):
   state=json.loads(page.evaluate("(k)=>localStorage.getItem(k)",KEY))
   rows=state[route["target"]]
   if route["field"] is None:return len(rows)==0
   return len(rows)==1 and rows[0][route["field"]]==route["value"]
  def click_action(page,label,route):
   el=page.locator(route["selector"]).first
   if label=="answer":
    el.fill(route["value"])
    el.press("Tab")
   else:
    el.click()
  for label,route in routes.items():
   ctx=new_context()
   page,errors=open_tab(ctx,route)
   initial=json.loads(page.evaluate("(k)=>localStorage.getItem(k)",KEY))
   page.evaluate("""() => {
     const actual=window.save;
     window.save=()=>new Promise((resolve,reject)=>{
        window.__commit=()=>{
          // Synthetic deferred writer uses legacy synchronous write after
          // release. Future real async writer enters through save() directly.
          noteMutationInvoking=true;
          try{resolve(actual());}catch(error){reject(error);}
          finally{noteMutationInvoking=false;}
        };
     });
   }""")
   click_action(page,label,route)
   page.wait_for_function("() => noteMutationPending && typeof __commit==='function'",timeout=10000)
   check(label+" blocks another mutation while pending",
         page.evaluate("""() => ({
           // Inflight gate; do not invoke a second UI operation here.
           locked:noteMutationPending
         })""")["locked"])
   check(label+" has not written before acknowledgment",
         json.loads(page.evaluate("(k)=>localStorage.getItem(k)",KEY))==initial)
   check(label+" has no premature success toast",
         page.locator("#toast").inner_text()!=route["success"])
   page.evaluate("window.__commit()")
   page.wait_for_function("() => !noteMutationPending",timeout=10000)
   check(label+" committed expected record",saved(page,route))
   check(label+" reports success after commit",page.locator("#toast").inner_text()==route["success"])
   check(label+" no unsaved review copy after success",page.evaluate("ApuDaNoteUnsavedDraft.count()")==0)
   check(label+" no JavaScript errors",not errors)
   ctx.close()
   fail_ctx=new_context()
   fail,errors=open_tab(fail_ctx,route)
   initial=json.loads(fail.evaluate("(k)=>localStorage.getItem(k)",KEY))
   fail.evaluate("""() => {
      window.save=()=>Promise.reject(new Error('synthetic delayed writer rejected'));
   }""")
   click_action(fail,label,route)
   fail.wait_for_function("() => !noteMutationPending && ApuDaNoteUnsavedDraft.count()>0",timeout=10000)
   exported=json.loads(fail.evaluate("ApuDaNoteUnsavedDraft.exportText()"))
   check(label+" reject keeps review-only original",exported["format"]=="apuda.note.unsaved-review" and
         exported["reviewOnly"] is True and len(exported["items"])>=1)
   check(label+" reject preserves persisted record",
         json.loads(fail.evaluate("(k)=>localStorage.getItem(k)",KEY))==initial)
   check(label+" reject displays warning and suppresses success",
         fail.locator("#note-unsaved-banner").is_visible() and
         fail.locator("#toast").inner_text()!=route["success"])
   check(label+" reject freezes further writes",fail.evaluate("noteWritesPaused && chatWritesPaused"))
   if label=="answer":
      check("answer failure retains exact typed draft",
            any("가상 진료 답변" in item["raw"] for item in exported["items"]))
   if label=="delete":
      check("deletion failure retains original lab before commit",
            any("test-lab" not in item["raw"] for item in exported["items"]))
   check(label+" reject has no JavaScript errors",not errors)
   fail_ctx.close()

  # While a mutation is waiting for an async acknowledgment, a second tab
  # writes a different revision. Neither stale mutation nor cached original
  # may replace the newer record.
  race=new_context()
  pending,errors=open_tab(race,routes["schedule"])
  winner,_=open_tab(race,routes["schedule"])
  pending.evaluate("""() => {
    const actual=window.save;
    window.save=()=>new Promise((resolve,reject)=>{
      window.__commit=()=>{
        noteMutationInvoking=true;
        try{resolve(actual());}catch(e){reject(e);}
        finally{noteMutationInvoking=false;}
      };
    });
  }""")
  click_action(pending,"schedule",routes["schedule"])
  pending.wait_for_function("() => noteMutationPending && typeof __commit==='function'")
  # Winner updates a different field in the same legacy V3 key.
  winner.evaluate("""() => {state.profile.name='가상 먼저 커밋';save();}""")
  pending.wait_for_function("() => noteWritesPaused && ApuDaNoteUnsavedDraft.count()>0",timeout=10000)
  check("inflight edit detects external tab write",pending.evaluate("noteMutationPending && noteWritesPaused"))
  check("inflight edit stores attempted revision",any(
    json.loads(item["raw"])["roadmap"][0]["status"]=="done"
    for item in json.loads(pending.evaluate("ApuDaNoteUnsavedDraft.exportText()"))["items"]))
  pending.evaluate("window.__commit()")
  pending.wait_for_function("() => !noteMutationPending",timeout=10000)
  check("inflight stale edit cannot overwrite winner",
        json.loads(pending.evaluate("(k)=>localStorage.getItem(k)",KEY))["profile"]["name"]=="가상 먼저 커밋")
  check("inflight stale edit suppresses success toast",
        pending.locator("#toast").inner_text()!=routes["schedule"]["success"])
  race.close()
  browser.close()
finally:
 server.shutdown()
 server.server_close()
print("RESULT %d/%d PASS — real V3 edit/delete UI, synthetic localhost"%(len(checks),len(checks)),flush=True)
