"""Development-only Chromium browser test for V3 async UI transition port.
Only localhost + synthetic IndexedDB; no personal browser, Drive or server.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright

SITE=Path(__file__).resolve().parents[2]/"public-site"
assert (SITE/"note"/"v3-async-port-lab.html").is_file()
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(SITE),**kwargs)
    def log_message(self,*_args): pass
server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
origin=f"http://127.0.0.1:{server.server_address[1]}"
Thread(target=server.serve_forever,daemon=True).start()
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
        ctx=browser.new_context(service_workers="block",locale="ko-KR")
        ctx.route("**/*",lambda route: route.continue_() if route.request.url.startswith(origin+"/") else route.abort())
        page=ctx.new_page();errors=[]
        page.on("pageerror",lambda e: errors.append(str(e)))
        resp=page.goto(origin+"/note/v3-async-port-lab.html",wait_until="load",timeout=30000)
        assert resp and resp.status==200,"page not served"
        page.locator("#run").click()
        page.wait_for_function("() => ['pass','fail'].includes(document.getElementById('summary').dataset.result)",timeout=45000)
        cases=page.locator("#results li").all_text_contents()
        result=page.locator("#summary").inner_text()
        assert not errors,errors
        assert page.locator("#summary").get_attribute("data-result")=="pass",(result,cases)
        assert len(cases)==21 and all(x.startswith("통과 · ") for x in cases),(result,cases)
        print("RESULT 21/21 PASS — Chromium synthetic V3 async UI port, IndexedDB transaction, cleaned",flush=True)
        for n,c in enumerate(cases,1): print(f"PASS {n:02d} {c}",flush=True)
        ctx.close();browser.close()
finally:
    server.shutdown();server.server_close()
