"""ApuDa synthetic single-transaction note + chat commit verification.
Chromium localhost; NO actual note storage, Drive, or production calls.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

SITE=Path(__file__).resolve().parents[2]/"public-site"
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(SITE),**kw)
    def log_message(self,*_args): pass

server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
origin=f"http://127.0.0.1:{server.server_address[1]}"
Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
    ctx=browser.new_context(service_workers="block",locale="ko-KR")
    ctx.route("**/*",lambda route:route.continue_() if route.request.url.startswith(origin+"/") else route.abort())
    page=ctx.new_page()
    errors=[]
    page.on("pageerror",lambda err:errors.append(str(err)))
    resp=page.goto(origin+"/note/v3-unified-contract-lab.html",wait_until="load",timeout=30000)
    assert resp and resp.status==200
    page.add_script_tag(url=origin+"/note/note-unsaved-draft.js")
    page.add_script_tag(url=origin+"/note/v3-synthetic-async-port.js")
    result=page.evaluate(r"""async () => {
      const api=window.ApuDaV3UnifiedContractSandbox;
      const port=window.ApuDaV3SyntheticAsyncPort;
      const vault=window.ApuDaNoteUnsavedDraft;
      const checks=[],names=[],opened=[];
      function ok(name,yes){checks.push({name,ok:!!yes});}
      function note(name){return JSON.stringify({profile:{name,cancer:'가상암종'},
        logs:[],meds:[],questions:[{question:'가상 질문'}],unmapped:{mustKeep:'원문'}});}
      function chat(text){return JSON.stringify([{role:'user',text,synthetic:true}]);}
      async function open(n){
        return new Promise((resolve,reject)=>{
          const req=indexedDB.open(n,1);
          req.onupgradeneeded=()=>req.result.createObjectStore(api.STORE,{keyPath:'key'});
          req.onsuccess=()=>{opened.push(req.result);resolve(req.result);};
          req.onerror=()=>reject(req.error);
        });
      }
      async function erase(n){
        return new Promise(resolve=>{
          const r=indexedDB.deleteDatabase(n);
          r.onsuccess=()=>resolve(true);r.onerror=()=>resolve(false);r.onblocked=()=>resolve(false);
        });
      }
      try {
        const nA=api.PREFIX+'bundle-'+crypto.randomUUID(),
          nB=api.PREFIX+'bundle-port-'+crypto.randomUUID();
        names.push(nA,nB);
        const a=await open(nA),b=await open(nA);
        const n1=note('가상 최초 기록'),c1=chat('가상 최초 대화');
        const first=await api.saveBundle(a,api.expectedState(0,null,null),n1,c1);
        const initial=await api.read(b);
        ok('one-transaction note/chat commit returns saved',first.status==='saved'&&first.revision===1);
        ok('both originals match exact input bytes',initial.note===n1&&initial.chat===c1);
        ok('both originals share one revision',initial.revision===1&&initial.lastMutation==='bundle-save');
        ok('unknown source field preserved',JSON.parse(initial.note).unmapped.mustKeep==='원문');

        const expected=api.expectedState(1,n1,c1),na=note('가상 A'),nb=note('가상 B'),
          ca=chat('가상 A'),cb=chat('가상 B');
        const race=await Promise.all([api.saveBundle(a,expected,na,ca),api.saveBundle(b,expected,nb,cb)]);
        ok('concurrent transactions have exactly one winner',race.filter(r=>r.status==='saved').length===1);
        ok('stale transaction is rejected',race.filter(r=>r.status==='conflict').length===1);
        const winner=await api.read(a),winnerA=winner.note===na&&winner.chat===ca,
          winnerB=winner.note===nb&&winner.chat===cb;
        ok('winner has matching note and chat, never mixed',winnerA||winnerB);
        ok('winner revision increases once',winner.revision===2);

        const abort=await api.saveBundle(a,api.expectedState(2,winner.note,winner.chat),
          note('시뮬레이션 중단'),chat('시뮬레이션 중단'),true);
        const afterAbort=await api.read(b);
        ok('forced abort returns non-saved',abort.status==='aborted');
        ok('abort rolls back BOTH note and chat',afterAbort.revision===2&&
          afterAbort.note===winner.note&&afterAbort.chat===winner.chat);

        let badChat=false,badNote=false;
        try{await api.saveBundle(a,api.expectedState(2,winner.note,winner.chat),note('정상'),'{"bad":"chat"}');}
        catch(_){badChat=true;}
        try{await api.saveBundle(a,api.expectedState(2,winner.note,winner.chat),'{"broken":',chat('정상'));}
        catch(_){badNote=true;}
        ok('invalid chat rejects entire bundle',badChat);
        ok('invalid note rejects entire bundle',badNote);
        ok('invalid inputs leave both fields unchanged',
          (await api.read(a)).note===winner.note&&(await api.read(a)).chat===winner.chat);

        const x=await open(nB),y=await open(nB);
        const pa=port.make(x,vault),pb=port.make(y,vault);
        await pa.initialize();await pb.initialize();
        const stored=await pa.saveBundle(note('가상 새 화면'),chat('새 대화'));
        ok('async port acknowledges bundle save',stored.status==='saved'&&stored.revision===1);
        const stale=await pb.saveBundle(note('가상 오래된 화면'),chat('오래된 대화'));
        ok('stale async port fails closed',stale.status==='blocked-review-required'&&stale.held);
        ok('stale port captures BOTH attempted source strings',vault.count()===2&&
          vault.exportText().includes('가상 오래된 화면')&&vault.exportText().includes('오래된 대화'));
        ok('stale port pauses further writes',pb.view().paused&&
          (await pb.saveBundle(note('재시도'),chat('재시도'))).status==='blocked-review-required');
        const afterStale=await api.read(x);
        ok('stale bundle leaves winner note/chat intact',afterStale.note===stored.note&&afterStale.chat===stored.chat);
        ok('production activation and Drive writes always disabled',
          pa.view().readyForProduction===false&&pa.view().backupUploadAllowed===false&&
          pb.view().backupPruneAllowed===false);
      }catch(err){ok('script error: '+err.message,false);}
      finally {
        opened.forEach(db=>{try{db.close();}catch(_){}});
        const cleanup=await Promise.all(names.map(erase));
        ok('both synthetic IndexedDB databases removed',cleanup.length===2&&cleanup.every(Boolean));
      }
      return checks;
    }""")
    for i,item in enumerate(result,1):
        print(f"{'PASS' if item['ok'] else 'FAIL'} {i:02d}: {item['name']}",flush=True)
    assert not errors,errors
    assert len(result)==20,f"Expected 20 tests, got {len(result)}"
    assert all(x["ok"] for x in result),result
    print("RESULT 20/20 PASS — atomic note/chat bundle, race, abort, draft and cleanup",flush=True)
    ctx.close()
    browser.close()
finally:
 server.shutdown()
 server.server_close()
