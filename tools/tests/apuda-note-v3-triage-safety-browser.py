"""ApuDa clinical safety regressions: urgent triage MUST render even when
synthetic V3 storage fails, and distress entries require commit acknowledgement.

Only ephemeral 127.0.0.1 Chromium profile + synthetic patient fixture;
external sites, Google Drive, service workers and real user data blocked.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
from playwright.sync_api import sync_playwright

SITE=Path(__file__).resolve().parents[2]/"public-site"
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(SITE),**kwargs)
    def log_message(self,*args):pass

server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
origin=f"http://127.0.0.1:{server.server_address[1]}"
Thread(target=server.serve_forever,daemon=True).start()
NOTE_KEY="apuda_cancer_care_v1"
fixture={
 "profile":{"name":"가상 환자","cancer":"가상암종","devices":[],"rxCombo":[],"rxPlan":[]},
 "checks":{},"logs":[],"labs":[],"meds":[],"roadmap":[],
 "questions":[],"supports":[],"distress":[],
 "triage":{"items":[],"at":0},"meta":{}
}
raw=json.dumps(fixture,ensure_ascii=False,separators=(",",":"))
seed="""(() => {
 if(location.hostname!=='127.0.0.1'||localStorage.getItem('__safety_test_only__')==='1')return;
 localStorage.setItem('apuda_cancer_care_v1',%s);
 localStorage.setItem('apuda_note_chat_v1','[]');
 localStorage.setItem('__safety_test_only__','1');
})();"""%json.dumps(raw,ensure_ascii=False)
checks=[]
def verify(label,ok):
    if not ok:raise AssertionError("FAIL: "+label)
    checks.append(label);print(f"PASS {len(checks):02d}: {label}",flush=True)

try:
 with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
    def setup():
        ctx=browser.new_context(service_workers="block",locale="ko-KR")
        ctx.add_init_script(script=seed)
        ctx.route("**/*",lambda route:route.continue_() if route.request.url.startswith(origin+"/") else route.abort())
        page=ctx.new_page();errors=[]
        page.on("pageerror",lambda err:errors.append(str(err)))
        response=page.goto(origin+"/note/index.html",wait_until="domcontentloaded",timeout=30000)
        verify("real V3 UI loaded",response is not None and response.status==200)
        page.wait_for_function("() => typeof triage==='function' && typeof saveDistress==='function'")
        return ctx,page,errors
    def stored(page):
        return json.loads(page.evaluate("(k)=>localStorage.getItem(k)",NOTE_KEY))
    def reviewed(page,text):
        items=json.loads(page.evaluate("ApuDaNoteUnsavedDraft.exportText()"))["items"]
        return any(text in item.get("raw","") for item in items)

    # Critically, emergency action text renders before a deferred IDB write
    # acknowledges. It must stay visible if the pending writer then rejects.
    ctx,a,errs=setup()
    a.evaluate("""() => {
      window.__writePending=false;
      window.save=()=>new Promise((resolve,reject)=>{
        window.__writePending=true;
        window.__rejectSave=()=>reject(new Error('synthetic idb rejected'));
      });
      openSheet('sos');
    }""")
    a.locator("#sh-sos input[value='red-fever']").check()
    a.wait_for_function("() => window.__writePending===true")
    red=a.locator("#triageResult")
    verify("red emergency guidance visible before storage acknowledged",
           red.is_visible() and "지금 바로" in red.inner_text() and "119" in red.inner_text())
    verify("red guidance is an assertive accessible alert",
           red.get_attribute("role")=="alert" and red.get_attribute("aria-live")=="assertive")
    verify("deferred writer has not persisted triage selection",
           stored(a)["triage"]["items"]==[])
    a.evaluate("window.__rejectSave()")
    a.wait_for_function("() => ApuDaNoteUnsavedDraft.count()>0")
    verify("red warning remains after rejected Promise",red.is_visible() and
           "지금 바로" in red.inner_text() and red.get_attribute("class")=="result red")
    verify("rejected red symptom captured for manual review",
           reviewed(a,"red-fever") and a.locator("#note-unsaved-banner").is_visible())
    verify("rejected red entry never changes prior confirmed storage",
           stored(a)["triage"]["items"]==[])
    verify("no unhandled browser errors on rejected emergency save",not errs)
    ctx.close()

    # Both synchronous quota exceptions and pre-paused writes must not hide
    # clinical instructions, including same-day amber symptoms.
    ctx,b,errs=setup()
    b.evaluate("""() => {
      window.save=()=>{throw new DOMException('synthetic quota','QuotaExceededError')};
      openSheet('sos');
    }""")
    b.locator("#sh-sos input[value='amber-meal']").check()
    b.wait_for_function("() => ApuDaNoteUnsavedDraft.count()>0")
    amber=b.locator("#triageResult")
    verify("amber guidance renders despite synchronous quota exception",
           amber.is_visible() and "오늘 안에" in amber.inner_text())
    verify("amber instruction is accessible status",amber.get_attribute("role")=="status")
    verify("quota error preserves amber selection without writing it",
           reviewed(b,"amber-meal") and stored(b)["triage"]["items"]==[])
    b.locator("#sh-sos input[value='red-fever']").check()
    verify("new emergency red warning overrides amber even when writes paused",
           "지금 바로" in amber.inner_text() and "119" in amber.inner_text())
    verify("paused-state triage leaves durable storage unchanged",
           stored(b)["triage"]["items"]==[])
    verify("synchronous quota exception causes no unhandled page errors",not errs)
    ctx.close()

    # A storage adapter can resolve a Promise with an explicit non-saved
    # result rather than throwing; this still must preserve the emergency UI.
    ctx,c,errs=setup()
    c.evaluate("""() => {
      window.save=()=>Promise.resolve({status:'conflict'});
      openSheet('sos');
    }""")
    c.locator("#sh-sos input[value='red-breath']").check()
    c.wait_for_function("() => ApuDaNoteUnsavedDraft.count()>0")
    verify("conflict result never suppresses breathing emergency alert",
           "지금 바로" in c.locator("#triageResult").inner_text())
    verify("non-saved status retains symptom without overwriting last note",
           reviewed(c,"red-breath") and stored(c)["triage"]["items"]==[])
    verify("non-saved status causes no uncaught JavaScript errors",not errs)
    ctx.close()

    # Mood/distress save must not show "recorded" until the writer confirms.
    ctx,d,errs=setup()
    d.evaluate("""() => {
      tab('log');
      const real=window.save;
      window.save=()=>new Promise((resolve,reject)=>{
        window.__release=()=>{try{resolve(real());}catch(e){reject(e);}};
      });
      const slider=document.getElementById('distress');
      slider.value='8';slider.dispatchEvent(new Event('input',{bubbles:true}));
    }""")
    d.locator('button[onclick="saveDistress()"]').click()
    d.wait_for_function("() => noteMutationPending && typeof window.__release==='function'")
    verify("distress save waits for commit",d.evaluate("noteMutationPending") and
           len(stored(d)["distress"])==0)
    verify("distress success is not shown prematurely",
           d.locator("#toast").inner_text()!="마음 온도계 8점 기록")
    d.evaluate("window.__release()")
    d.wait_for_function("() => !noteMutationPending && JSON.parse(localStorage.getItem('apuda_cancer_care_v1')).distress.length===1")
    verify("distress committed value has correct score",
           stored(d)["distress"][0]["score"]==8)
    verify("distress success appears after durable acknowledgement",
           d.locator("#toast").inner_text()=="마음 온도계 8점 기록")
    verify("confirmed distress record has no unsaved draft",
           d.evaluate("ApuDaNoteUnsavedDraft.count()")==0)
    verify("confirmed distress path has no JavaScript errors",not errs)
    ctx.close()

    # Rejected distress persistence leaves prior original untouched and
    # preserves the attempted numeric score in a review-only JSON.
    ctx,e,errs=setup()
    e.evaluate("""() => {
      tab('log');
      window.save=()=>Promise.reject(new Error('synthetic declined'));
      const slider=document.getElementById('distress');
      slider.value='9';slider.dispatchEvent(new Event('input',{bubbles:true}));
    }""")
    e.locator('button[onclick="saveDistress()"]').click()
    e.wait_for_function("() => !noteMutationPending && ApuDaNoteUnsavedDraft.count()>0")
    verify("rejected distress update does not overwrite stored original",
           stored(e)["distress"]==[])
    verify("rejected distress retains score for manual review",
           reviewed(e,'"score":9') and e.locator("#note-unsaved-banner").is_visible())
    verify("rejected distress never shows saved confirmation",
           e.locator("#toast").inner_text()!="마음 온도계 9점 기록")
    verify("rejected distress blocks further edits",
           e.evaluate("noteWritesPaused && chatWritesPaused"))
    verify("rejected distress path has no uncaught JS errors",not errs)
    ctx.close()
    browser.close()
finally:
 server.shutdown()
 server.server_close()
print(f"RESULT {len(checks)}/{len(checks)} PASS — immediate triage warnings and distress storage acknowledgment",flush=True)
