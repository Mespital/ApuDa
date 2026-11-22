"""ApuDa V3/V4 synthetic atomic shadow handoff browser regression (draft only).
Opens localhost ONLY, blocks external URLs, no user's browser or patient data.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import json

SITE=Path(__file__).resolve().parents[2]/"public-site"
PAGE=SITE/"note-v4"/"v3-v4-handoff-lab.html"
assert PAGE.is_file()
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs):
        super().__init__(*args,directory=str(SITE),**kwargs)
    def log_message(self,*_args):pass

server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
origin=f"http://127.0.0.1:{server.server_address[1]}"
Thread(target=server.serve_forever,daemon=True).start()

try:
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
        context=browser.new_context(service_workers="block",locale="ko-KR")
        context.route("**/*",lambda route: route.continue_() if route.request.url.startswith(origin+"/") else route.abort())
        page=context.new_page()
        errors=[]
        page.on("pageerror",lambda error: errors.append(str(error)))
        response=page.goto(origin+"/note-v4/v3-v4-handoff-lab.html",wait_until="load",timeout=30000)
        assert response and response.status==200,"lab not accessible"
        page.locator("#run").click()
        page.wait_for_function(
            """() => ['pass','fail'].includes(document.querySelector('#summary').dataset.result)""",
            timeout=45000)
        result=page.locator("#summary").inner_text()
        cases=page.locator("#results li").all_text_contents()
        assert not errors, f"Browser JS errors: {errors[:4]}"
        assert page.locator("#summary").get_attribute("data-result")=="pass",f"FAIL {result}: {cases}"
        assert len(cases)==15 and all(c.startswith("통과 · ") for c in cases),(result,cases)
        assert "15/15" in result and "삭제 확인" in result,result
        print("RESULT 15/15 PASS — Chromium localhost, synthetic V3+chat + IDB transaction + cleanup",flush=True)
        for n,case in enumerate(cases,1):
            print(f"PASS {n:02d} {case}",flush=True)
        context.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()
