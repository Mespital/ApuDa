"""공식 시험지의 형식과 묶음 안 PDF 목록을 확인합니다. 원문 PDF는 저장하지 않습니다."""
import json,io,zipfile,urllib.request,concurrent.futures,sys,datetime
from pathlib import Path
root=Path(__file__).resolve().parents[1]
a=json.loads((root/'dist/gichul/data/archive.json').read_text())
years=sorted(a['coverage']['years'])[-10:]
rows=[r for r in a['resources'] if r['year'] in years and r['type'] in ('question','bundle')]
def inspect(r):
 result={k:r[k] for k in ['id','year','domain','name','url']}
 try:
  with urllib.request.urlopen(r['url'],timeout=35) as response: b=response.read(64*1024*1024+1)
  if len(b)>64*1024*1024:raise ValueError('자료 크기 제한 초과')
  result['bytes']=len(b)
  if b.startswith(b'%PDF-'):result.update(format='pdf',pdfCount=1)
  elif b.startswith(b'PK'):
   names=[]
   with zipfile.ZipFile(io.BytesIO(b)) as z:
    for f in z.infolist():
     name=f.filename
     if not f.flag_bits&2048:
      try:name=name.encode('cp437').decode('cp949')
      except (UnicodeError,LookupError):pass
     leaf=name.replace('\\','/').split('/')[-1]
     if leaf.lower().endswith('.pdf') and not any(x in leaf.lower() for x in ['정답','해설','음성','대본','듣기','answer','script']):
      with z.open(f) as p:
       if p.read(5)!=b'%PDF-':raise ValueError('묶음 PDF 서명 불일치')
      names.append(leaf)
   if not names:raise ValueError('시험문제 PDF 없음')
   result.update(format='zip',pdfCount=len(names),papers=names)
  else:raise ValueError('PDF/ZIP 대신 다른 응답')
  result['ok']=True
 except Exception as e:result.update(ok=False,error=str(e)[:240])
 return result
report_path=root/'docs/reviews/csat-papers-audit-20261120.json'
old=json.loads(report_path.read_text()) if '--resume' in sys.argv and report_path.exists() else {}
previous={x['id']:x for x in old.get('resources',[]) if x.get('ok')}
out=[previous[r['id']] for r in rows if r['id'] in previous and previous[r['id']]['url']==r['url']]
pending=[r for r in rows if not any(x['id']==r['id'] for x in out)]
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
 for i,x in enumerate(pool.map(inspect,pending),len(out)+1):
  out.append(x)
  if i%20==0 or not x['ok']:print(json.dumps({'checked':i,'total':len(rows),'latest':x['id'],'ok':x['ok']},ensure_ascii=False),flush=True)
report={'checkedAt':'2026-11-20','years':years,'resourceCount':len(rows),'successCount':sum(x['ok'] for x in out),'pdfCount':sum(x.get('pdfCount',0) for x in out),'resources':out}
p=root/'docs/reviews/csat-papers-audit-20261120.json';p.parent.mkdir(exist_ok=True);p.write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in report.items() if k!='resources'},ensure_ascii=False),flush=True)
sys.exit(0 if all(x['ok'] for x in out) else 1)
