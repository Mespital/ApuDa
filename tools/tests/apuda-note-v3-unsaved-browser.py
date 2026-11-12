"""ApuDa synthetic browser regression. Never reads live data or connects network.
Requires: python -m pip install playwright; playwright chromium browser.
Run: python tools/tests/apuda-note-v3-unsaved-browser.py
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[2]/'public-site'/'note'
html=(root/'v3-unsaved-browser-lab.html').read_text(encoding='utf-8')
for name in ['note-write-fence.js','note-unsaved-draft.js','v3-unsaved-browser-lab.js']:
    html=html.replace('<script src="./'+name+'"></script>',
                      '<script>'+(root/name).read_text(encoding='utf-8')+'</script>')
checks=[]
def check(name, predicate):
    assert predicate, name
    checks.append(name)
    print('PASS',len(checks),name)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    context=browser.new_context(accept_downloads=True)
    def page():
        tab=context.new_page()
        tab.set_content(html,wait_until='load')
        return tab
    tab=page()
    check('isolated test page',tab.title()=='ApuDa V3 가상 저장 실패 브라우저 시험')
    check('empty draft',tab.evaluate('window.__labState().drafts')==0)
    tab.click('#conflict')
    state=tab.evaluate('window.__labState()')
    check('conflict warning',state['warning'] and state['paused'])
    check('newer saved note preserved',json.loads(state['persistedNote'])['profile']['name']=='다른 탭')
    check('unsaved note captured',state['drafts']==1)
    with tab.expect_download() as pending:
        tab.click('#export')
    download=pending.value
    check('download triggered',download.suggested_filename.endswith('.json'))
    temp=Path(__import__('tempfile').mkstemp(suffix='.json')[1])
    try:
        download.save_as(str(temp))
        data=json.loads(temp.read_text(encoding='utf-8'))
        check('review-only export',data['format']=='apuda.note.unsaved-review' and data['reviewOnly'] is True)
        check('exact unsaved text',json.loads(data['items'][0]['raw'])['profile']['name']=='가상환자 수정본')
    finally:
        temp.unlink(missing_ok=True)
    check('export leaves draft in memory',tab.evaluate('window.__labState().drafts')==1)
    chat=page();chat.click('#chat-conflict');other=chat.evaluate('window.__labState()')
    check('chat conflict warned',other['warning'] and other['paused'] and other['drafts']==1)
    check('newer chat preserved',json.loads(other['persistedChat'])[0]['h']=='다른 탭의 최신 대화')
    quota=page();quota.click('#quota');q=quota.evaluate('window.__labState()')
    check('quota error captured',q['warning'] and q['paused'] and q['drafts']==1)
    check('quota leaves saved note intact',json.loads(q['persistedNote'])['profile']['name']=='가상환자')
    context.close()
    browser.close()
print('RESULT',len(checks),'/',len(checks),'PASS')
