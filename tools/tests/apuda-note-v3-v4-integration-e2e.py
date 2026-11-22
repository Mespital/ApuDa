"""Cross-PR integration E2E: actual V3 UI -> V4 *synthetic-only* IDB handoff.

Only a new ephemeral Chromium context and localhost. All third-party traffic and
service workers are blocked. Never visits the user's real apuda.app origin.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import json

SITE=Path(__file__).resolve().parents[2]/"public-site"
KEY="apuda_cancer_care_v1"
CHAT="apuda_note_chat_v1"
SEED={
    "profile":{"name":"가상 원본 환자","cancer":"가상암종","devices":[],"rxCombo":[],"rxPlan":[]},
    "checks":{},"roadmap":[],"meds":[],"logs":[],"labs":[],
    "questions":[{"id":"synthetic-question","question":"가상 진료 질문"}],
    "supports":[],"distress":[],"triage":{"items":[],"at":0},"meta":{}
}
seed_script="""(() => {
 if(location.hostname!=='127.0.0.1'||localStorage.getItem('__v3v4_integration_seed__')) return;
 localStorage.setItem('apuda_cancer_care_v1',%s);
 localStorage.setItem('apuda_note_chat_v1','[]');
 localStorage.setItem('__v3v4_integration_seed__','1');
})();""" % json.dumps(json.dumps(SEED,ensure_ascii=False),ensure_ascii=False)

class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kwargs):
        super().__init__(*a,directory=str(SITE),**kwargs)
    def log_message(self,*a):pass

server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
origin=f"http://127.0.0.1:{server.server_address[1]}"
Thread(target=server.serve_forever,daemon=True).start()

results=[]
def check(label,condition):
    if not condition: raise AssertionError(f"FAIL: {label}")
    results.append(label)
    print(f"PASS {len(results):02d}: {label}",flush=True)

try:
  with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
    ctx=browser.new_context(service_workers="block",locale="ko-KR")
    ctx.add_init_script(script=seed_script)
    ctx.route("**/*",lambda route:route.continue_() if route.request.url.startswith(origin+"/") else route.abort())
    errors=[]
    page=ctx.new_page()
    page.on("pageerror",lambda e:errors.append(str(e)))
    response=page.goto(origin+"/note/index.html",wait_until="domcontentloaded",timeout=30000)
    check("actual V3 page loads",bool(response and response.status==200))
    page.wait_for_function("() => typeof window.save==='function' && typeof window.addMsg==='function'")
    check("V3 loads only synthetic patient record",
          json.loads(page.evaluate("(k)=>localStorage.getItem(k)",KEY))["profile"]["name"]=="가상 원본 환자")
    page.evaluate("""() => {
      addMsg('me','가상 인계 환자 질문');
      addMsg('bot','가상 인계 안내');
    }""")
    page.wait_for_function("() => chatWritesInFlight===0 && JSON.parse(localStorage.getItem('apuda_note_chat_v1')).length===2")
    chat_before=page.evaluate("(k)=>localStorage.getItem(k)",CHAT)
    note_before=page.evaluate("(k)=>localStorage.getItem(k)",KEY)
    check("actual V3 queue saved both messages",
          [m["h"] for m in json.loads(chat_before)]==["가상 인계 환자 질문","가상 인계 안내"])
    check("no persistence-status HTML in chat backup",
          all("chat-save-indicator" not in m["h"] for m in json.loads(chat_before)))

    # Test-only dynamic loading of V4 modules. Operational V3 HTML never loads these scripts.
    for path in [
        "v3-compat-audit.js","v3-lossless-stage.js","v4-extended-draft.js",
        "v4-migration-rehearsal.js","v3-v4-synthetic-handoff.js"
    ]:
        page.add_script_tag(url=origin+"/note-v4/"+path)
    check("V4 shadow handoff available only in test context",
          page.evaluate("typeof ApuDaV4SyntheticHandoff.stage==='function'"))

    phase1=page.evaluate("""async () => {
      const api=window.ApuDaV4SyntheticHandoff;
      const name=api.PREFIX+'integrated-'+(crypto.randomUUID?.()||Date.now());
      const db=await new Promise((resolve,reject)=>{
        const req=indexedDB.open(name,1);
        req.onupgradeneeded=()=>req.result.createObjectStore(api.STORE,{keyPath:'key'});
        req.onerror=()=>reject(req.error);
        req.onsuccess=()=>resolve(req.result);
      });
      window.__syntheticDb=db;
      window.__syntheticDbName=name;
      window.__syntheticSource={kind:'apuda.synthetic.v3.source',
        read:async()=>({note:localStorage.getItem('apuda_cancer_care_v1'),
                       chat:localStorage.getItem('apuda_note_chat_v1')})};
      const stage=await api.stage(db,window.__syntheticSource,0,false);
      const row=await api.read(db);
      const duplicate=await api.stage(db,window.__syntheticSource,0,false);
      return {stage,duplicate,row};
    }""")
    row=phase1["row"]
    check("shadow stage committed revision 1",phase1["stage"]["status"]=="staged" and row["revision"]==1)
    check("V3 note original raw preserved exactly",row["sourceNote"]==note_before)
    check("V3 chat original raw preserved exactly",row["sourceChat"]==chat_before)
    check("V4 candidate preserves original source archive",
          json.loads(row["candidateRaw"])["sourceArchive"]["original"]["raw"]==note_before)
    check("source and V4 proposal SHA256 fingerprints present",
          len(row["sourceSha256"])==64 and len(row["candidateSha256"])==64)
    check("V4 activation, cleanup and Drive writes always disabled",
          all(row[k] is False for k in (
             "readyForProduction","allowActivation","autoImportAllowed",
             "autoCleanupAllowed","driveUploadAllowed","drivePruneAllowed")))
    check("duplicate shadow stage does not overwrite",
          phase1["duplicate"]["status"]=="already-staged" and phase1["duplicate"]["revision"]==1)
    check("V3 source preserved across staging",
          page.evaluate("(k)=>localStorage.getItem(k)",KEY)==note_before and
          page.evaluate("(k)=>localStorage.getItem(k)",CHAT)==chat_before)

    # A second same-origin V3 tab saves a newer revision AFTER the shadow stage.
    old_tab=ctx.new_page()
    resp=old_tab.goto(origin+"/note/index.html",wait_until="domcontentloaded")
    check("second real V3 tab loads",bool(resp and resp.status==200))
    old_tab.wait_for_function("() => typeof window.save==='function'")
    old_tab.evaluate("""() => {state.profile.name='가상 새 탭 변경';save();}""")
    check("second tab successfully changed legacy source",
          json.loads(page.evaluate("(k)=>localStorage.getItem(k)",KEY))["profile"]["name"]=="가상 새 탭 변경")
    drift=page.evaluate("""async () => {
      const api=ApuDaV4SyntheticHandoff;
      const result=await api.stage(window.__syntheticDb,window.__syntheticSource,1,false);
      const staged=await api.read(window.__syntheticDb);
      return {result,staged};
    }""")
    check("changed source forces manual conflict review",
          drift["result"]["status"]=="manual-conflict-review")
    check("existing IDB snapshot remains unchanged",
          drift["staged"]["sourceNote"]==note_before and drift["staged"]["revision"]==1)
    check("no accidental V4 activation after source change",
          drift["staged"]["allowActivation"] is False)
    deleted=page.evaluate("""async () => {
      const name=window.__syntheticDbName;
      window.__syntheticDb.close();
      return await new Promise(resolve=>{
        const req=indexedDB.deleteDatabase(name);
        req.onsuccess=()=>resolve(true);
        req.onerror=()=>resolve(false);
        req.onblocked=()=>resolve(false);
      });
    }""")
    check("synthetic IDB deleted after exercise",deleted is True)
    check("no browser script errors",not errors)
    check("only local ephemeral origin used",
          page.url.startswith(origin+"/") and old_tab.url.startswith(origin+"/"))
    ctx.close();browser.close()
finally:
  server.shutdown();server.server_close()
print(f"RESULT {len(results)}/{len(results)} PASS — actual V3 synthetic record to V4 shadow IDB",flush=True)
