"""ApuDa V3 real-page 2-tab regression. SYNTHETIC RECORDS ONLY.
Run: pip install playwright && playwright install chromium
     python tools/tests/apuda-note-v3-full-ui-e2e.py

Opens the actual public-site/note/index.html with all local app modules on
an ephemeral localhost server in an empty Chromium profile. External network,
Google OAuth/Drive and service workers are BLOCKED. No production URL opened.
"""
from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import tempfile
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright

SITE = Path(__file__).resolve().parents[2] / "public-site"
assert (SITE / "note" / "index.html").is_file(), "note/index.html missing"
assert (SITE / "note" / "note-app.js").is_file(), "note-app.js missing"
assert (SITE / "note" / "note-unsaved-draft.js").is_file(), "unsaved module missing"

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE), **kwargs)
    def log_message(self, *_args):
        pass

server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
port = server.server_address[1]
origin = f"http://127.0.0.1:{port}"
Thread(target=server.serve_forever, daemon=True).start()

seed_note = {
    "profile": {"name": "가상 초기 기록", "cancer": "가상암종",
                "devices": [], "rxCombo": [], "rxPlan": []},
    "checks": {}, "roadmap": [], "meds": [], "logs": [], "labs": [],
    "questions": [{"question": "가상 질문"}],
    "supports": [], "distress": [],
    "triage": {"items": [], "at": 0}, "meta": {"lastBackup": ""}
}
seed_chat = [{"w": "me", "h": "가상 이전 대화", "c": "", "at": 1, "key": "synthetic-seed"}]
seed_script = """
(function() {
  if (location.hostname !== '127.0.0.1') return;
  if (localStorage.getItem('__apuda_e2e_synthetic_only__') !== null) return;
  localStorage.setItem('apuda_cancer_care_v1', %s);
  localStorage.setItem('apuda_note_chat_v1', %s);
  localStorage.setItem('__apuda_e2e_synthetic_only__', '1');
})();
""" % (json.dumps(json.dumps(seed_note, ensure_ascii=False), ensure_ascii=False),
       json.dumps(json.dumps(seed_chat, ensure_ascii=False), ensure_ascii=False))

checks = []
def check(label: str, ok: bool):
    if not ok:
        raise AssertionError(f"FAIL: {label}")
    checks.append(label)
    print(f"PASS {len(checks):02d}: {label}", flush=True)

def json_storage(tab, key):
    raw = tab.evaluate("(k) => localStorage.getItem(k)", key)
    return json.loads(raw) if raw is not None else None

def new_tab(context):
    page = context.new_page()
    problems = []
    page.on("pageerror", lambda err: problems.append(str(err)))
    response = page.goto(origin + "/note/index.html", wait_until="domcontentloaded", timeout=30000)
    check("V3 page HTTP 200", response is not None and response.status == 200)
    try:
        page.wait_for_function(
            "() => typeof window.save === 'function' && typeof window.saveChat === 'function' && !!window.ApuDaNoteUnsavedDraft",
            timeout=20000)
    except Exception:
        raise AssertionError(f"actual V3 runtime not ready: {problems[:4]}")
    return page

def pause_outcome(tab, name):
    return tab.evaluate("""(newName) => {
      state.profile.name = newName;
      try { save(); return {failed:false}; }
      catch(e) { return {failed:true, code:e.message,
        held:window.ApuDaNoteUnsavedDraft.count(),
        pause:noteWritesPaused&&chatWritesPaused,
        warning:!document.getElementById('note-unsaved-banner').hidden}; }
    }""", name)

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        context = browser.new_context(accept_downloads=True, service_workers="block", locale="ko-KR")
        context.add_init_script(script=seed_script)

        # External Google OAuth, fonts, maps, and all third-party requests are denied.
        def local_only(route):
            if route.request.url.startswith(origin + "/"):
                route.continue_()
            else:
                route.abort()
        context.route("**/*", local_only)

        a = new_tab(context)
        b = new_tab(context)
        check("two actual V3 pages share isolated local origin",
              json_storage(a, "apuda_cancer_care_v1")["profile"]["name"] ==
              json_storage(b, "apuda_cancer_care_v1")["profile"]["name"] == "가상 초기 기록")
        check("both V3 pages initially show no unsaved warning",
              a.locator("#note-unsaved-banner").is_hidden() and
              b.locator("#note-unsaved-banner").is_hidden())

        # Both actual forms are edited. Tab B starts typing BEFORE tab A
        # writes. The external storage event must NOT silently rebase B's form.
        b.locator('button[aria-label="내 정보와 설정"]').click()
        b.locator('#profileForm input[name="name"]').fill("가상 탭 B 미저장 수정")
        a.locator('button[aria-label="내 정보와 설정"]').click()
        a.locator('#profileForm input[name="name"]').fill("가상 탭 A 최신 기록")
        a.locator("#profileForm button").click()
        check("real profile form saves via V3 save()", 
              json_storage(a, "apuda_cancer_care_v1")["profile"]["name"] == "가상 탭 A 최신 기록")

        b.wait_for_function("() => noteWritesPaused && ApuDaNoteUnsavedDraft.count() > 0", timeout=10000)
        check("dirty form receives a blocked external storage event",
              b.evaluate("noteWritesPaused && chatWritesPaused"))
        check("still-visible form retains typed input",
              b.locator('#profileForm input[name="name"]').input_value() == "가상 탭 B 미저장 수정")
        # Attempting to submit must fail closed, without rewriting tab A's data.
        b.locator("#profileForm button").click()
        stale = b.evaluate("""() => ({
            pause:noteWritesPaused&&chatWritesPaused,
            warning:!document.getElementById('note-unsaved-banner').hidden,
            held:ApuDaNoteUnsavedDraft.count()
          })""")
        check("stale tab write is blocked", stale.get("pause") and stale.get("warning"))
        check("failure freezes note and chat writes", stale.get("pause"))
        check("visible persistent warning in real V3 DOM", stale.get("warning"))
        check("real V3 keeps attempted unsaved note in memory", stale.get("held", 0) >= 1)
        check("latest saved note is never overwritten by stale tab",
              json_storage(b, "apuda_cancer_care_v1")["profile"]["name"] == "가상 탭 A 최신 기록")

        with tempfile.TemporaryDirectory(prefix="apuda-synthetic-e2e-") as tmp:
            with b.expect_download(timeout=10000) as ev:
                b.locator("#note-unsaved-export").click()
            download = ev.value
            check("real V3 export button triggers JSON download",
                  "저장실패_검토용" in download.suggested_filename and
                  download.suggested_filename.endswith(".json"))
            target = Path(tmp) / "synthetic-review.json"
            download.save_as(str(target))
            exported = json.loads(target.read_text(encoding="utf-8"))
            check("downloaded JSON is not auto-restorable normal backup",
                  exported.get("format") == "apuda.note.unsaved-review" and
                  exported.get("reviewOnly") is True)
            check("download preserves exact attempted note text",
                  json.loads(exported["items"][0]["raw"])["profile"]["name"] == "가상 탭 B 미저장 수정")

        check("download does not automatically erase memory",
              b.evaluate("window.ApuDaNoteUnsavedDraft.count()") == stale["held"])
        b.evaluate("window.resetAll()")
        check("whole-note deletion blocked with unsaved draft",
              json_storage(b, "apuda_cancer_care_v1")["profile"]["name"] == "가상 탭 A 최신 기록")

        # Two additional actual app tabs independently load the latest note/chat.
        c = new_tab(context)
        d = new_tab(context)
        first_chat = c.evaluate("""() => {
          chat.push({w:'me',h:'가상 탭 C 최신 대화',c:'',at:2,key:'chat-c'});
          return saveChat();
        }""")
        check("first tab can save chat through real V3 function", first_chat is True)
        second_chat = d.evaluate("""() => {
          chat.push({w:'me',h:'가상 탭 D 미저장 대화',c:'',at:3,key:'chat-d'});
          return saveChat();
        }""")
        check("stale chat write is refused", second_chat is False)
        check("latest saved chat remains intact",
              json_storage(d, "apuda_note_chat_v1")[-1]["h"] == "가상 탭 C 최신 대화")
        check("unsaved chat draft and warning are present",
              d.evaluate("window.ApuDaNoteUnsavedDraft.count()") == 1 and
              d.locator("#note-unsaved-banner").is_visible())

        # Quota fault injection on the temporary origin only.
        e = new_tab(context)
        quota = e.evaluate("""() => {
          const original = Storage.prototype.setItem;
          Storage.prototype.setItem = function(k,v) {
            if (k === 'apuda_cancer_care_v1') {
              throw new DOMException('synthetic quota','QuotaExceededError');
            }
            return original.call(this,k,v);
          };
          state.profile.name = '가상 용량 오류에서 미저장';
          try { save(); return {failed:false}; }
          catch(err) {return {failed:true,held:window.ApuDaNoteUnsavedDraft.count(),
            warning:!document.getElementById('note-unsaved-banner').hidden}; }
        }""")
        check("quota error retains unsaved note", quota.get("failed") and
              quota.get("held") == 1 and quota.get("warning"))
        check("quota error does not change last saved note",
              json_storage(a, "apuda_cancer_care_v1")["profile"]["name"] == "가상 탭 A 최신 기록")

        # No user data at any point: localhost-only, new profile, all synthetic.
        check("test runs only against localhost", urlparse(a.url).hostname == "127.0.0.1")

        # First staged async UI call sites: real profile and question forms.
        # Mock writer returns a delayed Promise. No actual writes occur until
        # the test explicitly releases the synthetic commit gate.
        ack_context = browser.new_context(accept_downloads=True,service_workers="block",locale="ko-KR")
        ack_context.add_init_script(script=seed_script)
        ack_context.route("**/*", local_only)
        ack = new_tab(ack_context)
        ack.evaluate("""() => {
            const legacySave=window.save;
            window.save=()=>new Promise((resolve,reject)=>{
                window.__ackResolve=()=>{try{resolve(legacySave());}catch(err){reject(err);}};
                window.__ackReject=()=>reject(new Error('synthetic async reject'));
            });
        }""")
        ack.locator('button[aria-label="내 정보와 설정"]').click()
        ack.locator('#profileForm input[name="name"]').fill("가상 지연 저장 정보")
        ack.locator('#profileForm button').click()
        ack.wait_for_function("() => profileSavePending && typeof __ackResolve==='function'")
        check("profile submit waits for async commit",ack.evaluate("profileSavePending") and
              ack.locator('#sh-settings').evaluate("(x)=>x.classList.contains('open')"))
        check("profile submit disables controls and indicates busy",ack.locator('#profileForm input[name="name"]').is_disabled() and
              ack.locator('#profileForm button').is_disabled() and
              ack.locator('#profileForm').get_attribute('aria-busy')=='true')
        check("pending commit has not written record",
              json_storage(ack, "apuda_cancer_care_v1")["profile"]["name"] == "가상 초기 기록")
        check("no premature success toast",ack.locator('#toast').inner_text()!='내 정보를 저장했어요')
        ack.evaluate("window.__ackResolve()")
        ack.wait_for_function("() => !profileSavePending && localStorage.getItem('apuda_cancer_care_v1').includes('가상 지연 저장 정보')")
        check("profile success follows commit",json_storage(ack,"apuda_cancer_care_v1")["profile"]["name"]=="가상 지연 저장 정보" and
              ack.locator('#toast').inner_text()=='내 정보를 저장했어요' and
              not ack.locator('#sh-settings').evaluate("(x)=>x.classList.contains('open')"))

        # Rejected asynchronous profile save: keep form, raw draft and warning.
        fail= new_tab(ack_context)
        fail.evaluate("""() => {window.save=()=>Promise.reject(new Error('synthetic async rejected'));}""")
        fail.locator('button[aria-label="내 정보와 설정"]').click()
        fail.locator('#profileForm input[name="name"]').fill("가상 실패한 정보")
        fail.locator('#profileForm button').click()
        fail.wait_for_function("() => !profileSavePending && ApuDaNoteUnsavedDraft.count()>0")
        check("async profile failure preserves form and draft",fail.locator('#sh-settings').evaluate("(x)=>x.classList.contains('open')") and
              fail.locator('#note-unsaved-banner').is_visible() and
              json.loads(fail.evaluate("ApuDaNoteUnsavedDraft.exportText()"))['items'][0]['raw'].find('가상 실패한 정보')!=-1)
        check("async profile failure re-enables controls",not fail.locator('#profileForm button').is_disabled() and
              not fail.locator('#profileForm input[name="name"]').is_disabled() and
              fail.locator('#profileForm').get_attribute('aria-busy') is None)
        check("rejected profile save leaves confirmed record unchanged",
              json_storage(fail, "apuda_cancer_care_v1")["profile"]["name"] == "가상 지연 저장 정보" and
              fail.locator('#toast').inner_text()!='내 정보를 저장했어요')

        # Real dynamic question form on plan tab (not a toy stand-in).
        q= new_tab(ack_context)
        q.evaluate("""() => {planTab='qs';renderPlan();tab('plan');
            const legacySave=window.save;
            window.save=()=>new Promise((resolve,reject)=>{
                window.__ackResolve=()=>{try{resolve(legacySave());}catch(err){reject(err);}};
                window.__ackReject=()=>reject(new Error('synthetic async reject'));
            });
        }""")
        question_form=q.locator('#v-plan form[onsubmit*="addQ"]')
        question_form.locator('input[name="t"]').fill("가상 비동기 진료 질문")
        question_form.locator('button').click()
        q.wait_for_function("() => questionSavePending && typeof __ackResolve==='function'")
        check("question submit waits for async writer",q.evaluate("questionSavePending") and
              question_form.get_attribute('aria-busy')=='true' and question_form.locator('button').is_disabled())
        check("question write not yet confirmed",len(json_storage(q,'apuda_cancer_care_v1')['questions'])==1)
        check("question has no premature success toast",q.locator('#toast').inner_text()!='질문을 추가했어요')
        q.evaluate("window.__ackResolve()")
        q.wait_for_function("() => !questionSavePending && JSON.parse(localStorage.getItem('apuda_cancer_care_v1')).questions.length===2")
        check("question success appears after commit",json_storage(q,'apuda_cancer_care_v1')['questions'][0]['question']=='가상 비동기 진료 질문' and
              q.locator('#toast').inner_text()=='질문을 추가했어요')

        rejected_q=new_tab(ack_context)
        rejected_q.evaluate("""() => {planTab='qs';renderPlan();tab('plan'); window.save=()=>Promise.reject(new Error('synthetic async rejected'));}""")
        qform=rejected_q.locator('#v-plan form[onsubmit*="addQ"]')
        qform.locator('input[name="t"]').fill("가상 저장 실패 질문")
        qform.locator('button').click()
        rejected_q.wait_for_function("() => !questionSavePending && ApuDaNoteUnsavedDraft.count()>0")
        check("rejected question is captured and displayed",
              rejected_q.locator('#note-unsaved-banner').is_visible() and
              '가상 저장 실패 질문' in rejected_q.evaluate('ApuDaNoteUnsavedDraft.exportText()'))
        check("rejected question is not in persisted note",
              len(json_storage(rejected_q,'apuda_cancer_care_v1')['questions'])==2 and
              rejected_q.locator('#toast').inner_text()!='질문을 추가했어요')
        ack_context.close()

        context.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()
print(f"RESULT {len(checks)}/{len(checks)} PASS; synthetic localhost full V3 UI")
