"""Chat queue and message acknowledgment on actual V3 UI with fake medical records.
Chromium localhost-only; external network, Google Drive and SW are blocked.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import json

SITE=Path(__file__).resolve().parents[2]/"public-site"
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(SITE),**kwargs)
    def log_message(self,*_args):pass
server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
origin=f"http://127.0.0.1:{server.server_address[1]}"
Thread(target=server.serve_forever,daemon=True).start()
seed_note={
 "profile":{"name":"가상 환자","cancer":"가상암종","devices":[],"rxCombo":[],"rxPlan":[]},
 "checks":{},"logs":[],"labs":[],"meds":[],"roadmap":[],"questions":[],
 "supports":[],"distress":[],"triage":{"items":[],"at":0},"meta":{}
}
seed="""(() => {
 if(location.hostname!=='127.0.0.1'||localStorage.getItem('__synthetic_chat_seed__')==='1')return;
 localStorage.setItem('apuda_cancer_care_v1',%s);
 localStorage.setItem('apuda_note_chat_v1','[]');
 localStorage.setItem('__synthetic_chat_seed__','1');
})();""" % json.dumps(json.dumps(seed_note,ensure_ascii=False),ensure_ascii=False)
checks=[]
def check(title,condition):
    if not condition:raise AssertionError("FAIL: "+title)
    checks.append(title)
    print(f"PASS {len(checks):02d}: {title}",flush=True)
def persisted(page):
    return json.loads(page.evaluate("localStorage.getItem('apuda_note_chat_v1')"))
def review(page):
    return json.loads(page.evaluate("ApuDaNoteUnsavedDraft.exportText()"))
try:
 with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
    def context():
        ctx=browser.new_context(locale="ko-KR",service_workers="block",accept_downloads=True)
        ctx.add_init_script(script=seed)
        ctx.route("**/*",lambda route:route.continue_() if route.request.url.startswith(origin+"/") else route.abort())
        return ctx
    def open_page(ctx):
        page=ctx.new_page();errs=[]
        page.on("pageerror",lambda e:errs.append(str(e)))
        response=page.goto(origin+"/note/index.html",wait_until="domcontentloaded",timeout=30000)
        check("V3 real UI HTTP 200",response is not None and response.status==200)
        page.wait_for_function("() => typeof saveChat==='function' && typeof commitChatRaw==='function'")
        return page,errs
    # Serial queue: two rapid messages must never be acknowledged out of order.
    ctx=context();page,errs=open_page(ctx)
    page.evaluate("""() => {
      const actual=window.commitChatRaw;
      window.__releases=[];
      window.commitChatRaw=(raw)=>new Promise((resolve,reject)=>{
        window.__releases.push(()=>{
          try{resolve(actual(raw));}catch(e){reject(e);}
        });
      });
      addMsg('me','가상 사용자 메시지 1');
      addMsg('bot','가상 AI 안내 2');
    }""")
    page.wait_for_function("() => chatWritesInFlight===2 && window.__releases.length===1")
    statuses=page.locator('#thread .msg[data-chat-save]').all()
    check("both chat bubbles remain visibly pending",
          len(statuses)==2 and all(e.get_attribute("data-chat-save")=="pending" for e in statuses))
    check("chat has not persisted prior to write acknowledgment",persisted(page)==[])
    page.evaluate("window.__releases.shift()()")
    page.wait_for_function("() => window.__releases.length===1 && document.querySelectorAll('#thread .msg[data-chat-save=\"saved\"]').length===1")
    check("first commit stores only first chat item",len(persisted(page))==1 and persisted(page)[0]["h"]=="가상 사용자 메시지 1")
    check("second chat item still pending after first",page.locator('#thread .msg[data-chat-save="pending"]').count()==1)
    page.evaluate("window.__releases.shift()()")
    page.wait_for_function("() => chatWritesInFlight===0 && document.querySelectorAll('#thread .msg[data-chat-save=\"saved\"]').length===2")
    latest=persisted(page)
    check("serial writes preserve both messages in original order",len(latest)==2 and
          [x["h"] for x in latest]==["가상 사용자 메시지 1","가상 AI 안내 2"])
    check("visible status only changes to saved after commit",
          all(s.get_attribute("data-chat-save")=="saved" for s in page.locator('#thread .msg[data-chat-save]').all()))
    check("save indicators never leak into stored message HTML",
          all("chat-save-indicator" not in x["h"] for x in latest))
    check("serial queue has no JS errors",not errs)
    ctx.close()

    # Rejected write: preserve the COMPLETE latest chat including messages
    # enqueued after the first, mark all bubbles failed, stop later send.
    ctx=context();failure,errs=open_page(ctx)
    failure.evaluate("""() => {
      window.commitChatRaw=()=>Promise.reject(new Error('synthetic chat reject'));
      addMsg('me','가상 미저장 대화 A');
      addMsg('bot','가상 미저장 안내 B');
    }""")
    failure.wait_for_function("() => chatWritesPaused && chatWritesInFlight===0")
    check("failure leaves persisted chat unchanged",persisted(failure)==[])
    check("both unsaved bubbles visibly marked failed",
          failure.locator('#thread .msg[data-chat-save="failed"]').count()==2)
    exported=review(failure)
    check("recovery copy is review-only",exported["format"]=="apuda.note.unsaved-review" and exported["reviewOnly"] is True)
    check("recovery copy preserves both enqueued messages",any(
          "가상 미저장 대화 A" in item["raw"] and "가상 미저장 안내 B" in item["raw"]
          for item in exported["items"]))
    check("persistent alert displayed",failure.locator("#note-unsaved-banner").is_visible())
    check("write lock blocks both note/chat storage",failure.evaluate("noteWritesPaused && chatWritesPaused"))
    failure.evaluate("sendText('가상 추가 전송 금지')")
    check("message not appended after a failed write",
          failure.locator('#thread .msg[data-chat-at]').count()==2)
    check("rejection has no unhandled page errors",not errs)
    ctx.close()

    # Inter-tab external write occurs while this tab has a pending message.
    ctx=context();waiting,errA=open_page(ctx);other,errB=open_page(ctx)
    waiting.evaluate("""() => {
      const actual=window.commitChatRaw;
      window.__releaseChat=null;
      window.commitChatRaw=(raw)=>new Promise((resolve,reject)=>{
        window.__releaseChat=()=>{try{resolve(actual(raw));}catch(e){reject(e);}};
      });
      addMsg('me','가상 탭 A 대기중');
    }""")
    waiting.wait_for_function("() => chatWritesInFlight===1 && typeof __releaseChat==='function'")
    other.evaluate("addMsg('me','가상 탭 B 최신')")
    other.wait_for_function("() => chatWritesInFlight===0")
    waiting.wait_for_function("() => chatWritesPaused && ApuDaNoteUnsavedDraft.count()>0")
    check("pending tab notices external chat edit",waiting.evaluate("noteWritesPaused && chatWritesPaused"))
    check("external winner remains in storage before stale release",
          persisted(waiting)[-1]["h"]=="가상 탭 B 최신")
    waiting.evaluate("window.__releaseChat()")
    waiting.wait_for_function("() => chatWritesInFlight===0")
    check("stale tab does not overwrite newer chat",persisted(waiting)[-1]["h"]=="가상 탭 B 최신")
    check("pending tab retains unsaved message",any(
          "가상 탭 A 대기중" in item["raw"] for item in review(waiting)["items"]))
    check("stale bubble marked failed",waiting.locator('#thread .msg[data-chat-save="failed"]').count()==1)
    check("two-tab test has no JS errors",not errA and not errB)
    ctx.close()

    # Simulate browser storage quota exception.
    ctx=context();quota,errq=open_page(ctx)
    quota.evaluate("""() => {
      const old=Storage.prototype.setItem;
      Storage.prototype.setItem=function(k,v){
        if(k==='apuda_note_chat_v1')throw new DOMException('synthetic quota','QuotaExceededError');
        return old.call(this,k,v);
      };
      addMsg('me','가상 용량 오류 메시지');
    }""")
    quota.wait_for_function("() => chatWritesPaused && chatWritesInFlight===0")
    check("quota exception preserves original storage",persisted(quota)==[])
    check("quota exception retains complete message draft",any(
          "가상 용량 오류 메시지" in x["raw"] for x in review(quota)["items"]))
    check("quota message visibly marked failed",quota.locator('#thread .msg[data-chat-save="failed"]').count()==1)
    check("quota exception causes no unhandled errors",not errq)
    ctx.close()

    # Undo note change: the UI cannot claim success until note AND chat
    # persistence have confirmed (chat acknowledgment is deliberately delayed).
    ctx=context();undo,erru=open_page(ctx)
    undo.evaluate("sendText('메모: 가상 기록 취소 테스트')")
    undo.wait_for_function("() => chatWritesInFlight===0")
    button=undo.locator("#thread button.undo")
    check("real V3 note undo button rendered",button.count()>0)
    undo.evaluate("""() => {
      const actual=window.commitChatRaw;
      window.__releaseUndoChat=null;
      window.commitChatRaw=(raw)=>new Promise((resolve,reject)=>{
        window.__releaseUndoChat=()=>{try{resolve(actual(raw));}catch(e){reject(e);}};
      });
    }""")
    button.first.click()
    undo.wait_for_function("() => chatUndoPending && typeof __releaseUndoChat==='function'")
    check("undo does not show success while chat save pending",
          undo.locator("#toast").inner_text()!='방금 기록을 취소했어요')
    undo.evaluate("window.__releaseUndoChat()")
    undo.wait_for_function("() => !chatUndoPending && chatWritesInFlight===0")
    check("undo reports success only after chat ack",
          undo.locator("#toast").inner_text()=='방금 기록을 취소했어요')
    check("undo saved chat excludes UI status marker",
          all("chat-save-indicator" not in x["h"] for x in persisted(undo)))
    check("undo real V3 UI has no JS errors",not erru)
    ctx.close()
    browser.close()
finally:
 server.shutdown()
 server.server_close()
print(f"RESULT {len(checks)}/{len(checks)} PASS — actual V3 chat queue, synthetic localhost",flush=True)
