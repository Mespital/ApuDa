"""ApuDa actual V3 UI synthetic IndexedDB bridge — Chrome integration regression.
No production domain, patient data, student records, Drive, or network.
Creates an ephemeral loopback origin and isolated disposable browser profile.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import json

SITE=Path(__file__).resolve().parents[2]/'public-site'
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(SITE),**kw)
    def log_message(self,*_a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
origin=f'http://127.0.0.1:{server.server_address[1]}'
Thread(target=server.serve_forever,daemon=True).start()
SYNTHETIC={
 'profile':{'name':'가상 원본','cancer':'가상암종','devices':[],'rxCombo':[],'rxPlan':[]},
 'checks':{},'logs':[],'labs':[],'meds':[],'roadmap':[],
 'questions':[{'id':'fake-q','question':'가상 질문','priority':'mid'}],
 'supports':[],'distress':[],'triage':{'items':[],'at':0},'meta':{}
}
rawNote=json.dumps(SYNTHETIC,ensure_ascii=False,separators=(',',':'))
rawChat='[]'
seed="""(() => {
  if(location.hostname!=='127.0.0.1'||localStorage.getItem('__apuda_v3_idb_bridge_fixture_only__'))return;
  localStorage.setItem('apuda_cancer_care_v1',%s);
  localStorage.setItem('apuda_note_chat_v1',%s);
  localStorage.setItem('__apuda_v3_idb_bridge_fixture_only__','synthetic-only');
})();"""%(json.dumps(rawNote,ensure_ascii=False),json.dumps(rawChat))
checks=[]
def verify(name,ok):
    assert ok,"FAIL: "+name
    checks.append(name)
    print(f"PASS {len(checks):02d}: {name}",flush=True)

MODULES=[
 'v3-unified-contract-sandbox.js',
 'v3-synthetic-async-port.js',
 'v3-synthetic-live-bridge.js'
]
try:
 with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    def context():
        ctx=browser.new_context(locale='ko-KR',service_workers='block')
        ctx.add_init_script(script=seed)
        ctx.route('**/*',lambda route:route.continue_() if route.request.url.startswith(origin+'/') else route.abort())
        return ctx
    def page(ctx):
        t=ctx.new_page();errors=[]
        t.on('pageerror',lambda err:errors.append(str(err)))
        res=t.goto(origin+'/note/index.html',wait_until='domcontentloaded',timeout=30000)
        verify('real V3 page loads',res is not None and res.status==200)
        t.wait_for_function("() => typeof window.save==='function' && typeof window.commitChatRaw==='function'")
        for module in MODULES:
            t.add_script_tag(url=origin+'/note/'+module)
        return t,errors
    def attach(t,name):
        return t.evaluate("""async (name)=>{
            window.__APUDA_V3_SYNTHETIC_BRIDGE_OPT_IN__=true;
            const api=ApuDaV3UnifiedContractSandbox;
            window.__bridgeDbName=name;
            window.__bridgeDb=await new Promise((resolve,reject)=>{
                const req=indexedDB.open(name,1);
                req.onupgradeneeded=()=>req.result.createObjectStore(api.STORE,{keyPath:'key'});
                req.onsuccess=()=>resolve(req.result);
                req.onerror=()=>reject(req.error);
            });
            window.__bridge=ApuDaV3SyntheticLiveBridge.install
              ? await ApuDaV3SyntheticLiveBridge.install(window.__bridgeDb):null;
            return window.__bridge.current();
        }""",name)
    def row(t):
        return t.evaluate("""async()=>ApuDaV3UnifiedContractSandbox.read(window.__bridgeDb)""")
    def local(t):
        return t.evaluate("""() => ({
          note:localStorage.getItem('apuda_cancer_care_v1'),
          chat:localStorage.getItem('apuda_note_chat_v1')
        })""")
    def cleanup(ctx,pages,name):
        for t in pages:
            try:t.evaluate("() => window.__bridgeDb?.close()")
            except Exception:pass
        # Explicitly delete only the synthetic prefix database.
        cleaner=pages[0]
        result=cleaner.evaluate("""name=>new Promise(resolve=>{
            if(!name.startsWith(ApuDaV3UnifiedContractSandbox.PREFIX)){resolve(false);return;}
            const req=indexedDB.deleteDatabase(name);
            req.onsuccess=()=>resolve(true);req.onerror=()=>resolve(false);
            req.onblocked=()=>resolve(false);
        })""",name)
        ctx.close()
        return result

    ctx=context()
    one,errorsOne=page(ctx)
    two,errorsTwo=page(ctx)
    dbname='apuda-v3-synthetic-unified-live-ui-20261114'
    first=attach(one,dbname)
    second=attach(two,dbname)
    verify('both V3 tabs attach to one synthetic revision',
           first['revision']==1 and second['revision']==1)
    verify('synthetic bridge is not production-ready',
           first['readyForProduction'] is False and second['backupPruneAllowed'] is False)
    before=local(one)
    verify('original V3 raw note/chat are synthetic seed',
           before['note']==rawNote and before['chat']==rawChat)
    one.locator('button[aria-label="내 정보와 설정"]').click()
    one.locator('#profileForm input[name="name"]').fill('가상 IndexedDB 제출')
    one.locator('#profileForm button').click()
    one.wait_for_function("""() => !profileSavePending &&
          window.__bridge?.current().revision===2""",timeout=15000)
    actual=row(one)
    verify('real profile form writes confirmed IDB revision',
           actual['revision']==2 and json.loads(actual['note'])['profile']['name']=='가상 IndexedDB 제출')
    verify('same transaction retains exact previously committed chat',
           actual['chat']==rawChat)
    verify('legacy localStorage keys are not mirrored by bridge',local(one)==before)
    verify('real V3 UI reports profile saved after IDB commit',
           one.locator('#toast').inner_text()=='내 정보를 저장했어요')
    two.locator('button[aria-label="내 정보와 설정"]').click()
    two.locator('#profileForm input[name="name"]').fill('가상 오래된 탭 변경')
    two.locator('#profileForm button').click()
    two.wait_for_function("""() => !profileSavePending &&
       noteWritesPaused && ApuDaNoteUnsavedDraft.count()>0""",timeout=15000)
    verify('stale V3 tab loses optimistic revision and freezes',
           two.evaluate("window.__bridge.current().paused && noteWritesPaused && chatWritesPaused"))
    verify('stale V3 typed value retained for review',
           '가상 오래된 탭 변경' in two.evaluate("ApuDaNoteUnsavedDraft.exportText()"))
    verify('winner stays intact despite stale tab action',
           row(one)['note']==actual['note'] and row(one)['chat']==actual['chat'])
    verify('stale tab does not claim save success',
           two.locator('#toast').inner_text()!='내 정보를 저장했어요')
    # A real uncooperative old V3 tab can still write localStorage. This
    # must be observed as P0 risk, not falsely reported as "prevented".
    legacy,errLegacy=page(ctx)
    legacy.evaluate("""() => {
      const next=JSON.parse(localStorage.getItem('apuda_cancer_care_v1'));
      next.profile.name='가상 구형 탭에서 로컬 저장';
      localStorage.setItem('apuda_cancer_care_v1',JSON.stringify(next));
    }""")
    one.wait_for_function("() => __bridge.diagnostics().legacyDrift===true",timeout=10000)
    verify('new bridge detects old-tab localStorage overwrite',
           one.evaluate("__bridge.diagnostics().legacyDrift && noteWritesPaused"))
    verify('old-tab write cannot change IDB committed note/chat',
           row(one)['note']==actual['note'] and row(one)['chat']==actual['chat'])
    verify('old-tab localStorage write remains possible (P0 open)',
           json.loads(local(one)['note'])['profile']['name']=='가상 구형 탭에서 로컬 저장')
    verify('new bridge refuses further writes after legacy drift',
           one.evaluate("""async () => (await save()).status==='blocked-review-required'"""))
    verify('first scenario has no uncaught page errors',
           not errorsOne and not errorsTwo and not errLegacy)
    verify('first synthetic IDB cleanup',cleanup(ctx,[one,two,legacy],dbname))

    # Fresh profile / DB verifies the actual chat addMsg UI write path,
    # serialized queue and one shared IDB record/chat revision.
    chatctx=context()
    ch,errChat=page(chatctx)
    chatname='apuda-v3-synthetic-unified-live-chat-20261114'
    init=attach(ch,chatname)
    ch.evaluate("""() => {
      addMsg('me','가상 메시지 A');
      addMsg('bot','가상 안내 B');
    }""")
    ch.wait_for_function("""() => chatWritesInFlight===0 &&
      document.querySelectorAll('#thread [data-chat-save="saved"]').length===2 &&
      __bridge.current().revision===3""",timeout=15000)
    crow=row(ch)
    verify('real V3 chat UI commits two messages in order',
           len(json.loads(crow['chat']))==2 and
           [v['h'] for v in json.loads(crow['chat'])]==['가상 메시지 A','가상 안내 B'])
    verify('chat-only updates retain committed note in bundle',
           crow['note']==rawNote and crow['revision']==3)
    verify('legacy chat localStorage remains unchanged during bridge',local(ch)['chat']==rawChat)
    verify('chat save indicators show acknowledged commits only',
           ch.locator('#thread .msg[data-chat-save="saved"]').count()==2)
    verify('chat scenario has no uncaught page errors',not errChat)
    verify('second synthetic IDB cleanup',cleanup(chatctx,[ch],chatname))
    browser.close()
finally:
 server.shutdown()
 server.server_close()
print(f'RESULT {len(checks)}/{len(checks)} PASS — actual V3 synthetic IDB bridge; P0 legacy drift demonstrated',flush=True)
