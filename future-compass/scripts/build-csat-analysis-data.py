"""영어 공식 발문에서 유형 메타데이터를 구성합니다. PDF 본문은 결과물에 저장하지 않습니다."""
import json,re,hashlib,urllib.request,io,zipfile,concurrent.futures,argparse,tempfile
from pathlib import Path
import fitz
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--cache-dir',default=str(Path(tempfile.gettempdir())/'csat-type-analysis'));args=parser.parse_args();cache=Path(args.cache_dir);cache.mkdir(parents=True,exist_ok=True)
a=json.loads((root/'dist/gichul/data/archive.json').read_text());years=a['coverage']['years'][-10:]
def resource(y):
 rows=[r for r in a['resources'] if r['year']==y and r['domain']=='영어' and r['type'] in ('question','bundle')]
 return sorted(rows,key=lambda r:('홀수' not in r['name'],'짝수' in r['name']))[0]
def load(y):
 r=resource(y);p=cache/f'{y}-english.pdf';meta=cache/f'{y}-english-source.json'
 if p.exists() and meta.exists() and '홀수형' in re.sub(r'\s+','',fitz.open(p)[0].get_text()):return y,r,p,json.loads(meta.read_text())
 b=urllib.request.urlopen(r['url'],timeout=40).read()
 if b.startswith(b'PK'):
  z=zipfile.ZipFile(io.BytesIO(b));files=[]
  for f in z.infolist():
   name=f.filename
   if not f.flag_bits&2048:
    try:name=name.encode('cp437').decode('cp949')
    except UnicodeError:pass
   if name.lower().endswith('.pdf') and not re.search('정답|해설|대본',name):files.append((f,name))
  f,name=sorted(files,key=lambda pair:('홀' not in pair[1],'짝' in pair[1],pair[1]))[0]
  data=z.read(f);fileid=hashlib.sha256(f'{name}|{f.CRC}|{f.file_size}'.encode()).hexdigest()[:24]
 else:data=b;name=r['name'];fileid='paper'
 if not data.startswith(b'%PDF-'):raise ValueError('Not a PDF '+str(y))
 p.write_bytes(data);m={'resourceId':r['id'],'fileId':fileid,'fileName':name,'sourceUrl':r['url'],'pdfSha256':hashlib.sha256(data).hexdigest()};meta.write_text(json.dumps(m,ensure_ascii=False,indent=2));return y,r,p,m
TYPE_INFO={
'listen-relationship':('화자 관계','듣기','역할과 대화 상황으로 관계 추론'),'listen-purpose':('발화 목적','듣기','발화 상황과 의도 파악'),'listen-opinion':('화자의 의견','듣기','핵심 주장과 바꿔 말하기 대조'),'listen-main':('듣기 요지','듣기','전체 발화의 핵심 생각 요약'),'listen-picture':('그림 정보 일치','듣기','시각 정보와 발화 내용 대조'),'listen-task':('할 일 파악','듣기','완료한 일과 앞으로 할 일 구별'),'listen-money':('금액 계산','듣기','수량·가격·할인 조건 계산'),'listen-reason':('이유 파악','듣기','행동과 원인의 연결 확인'),'listen-detail':('듣기 세부 정보','듣기','언급 여부와 조건 대조'),'listen-table':('도표·조건 선택','듣기','표의 조건을 순서대로 소거'),'listen-response':('대화 응답','듣기','마지막 발화의 의도와 응답 연결'),'listen-situation':('상황에 맞는 발화','듣기','역할·상황·대화 목적 연결'),'listen-topic':('듣기 주제','듣기','공통 화제와 중심 내용 파악'),
'read-purpose':('글의 목적','독해','필자의 의도와 독자에게 요구하는 행동 파악'),'read-emotion':('심경·분위기','독해','사건 전후 감정 변화와 단서 대조'),'read-claim':('필자의 주장','독해','핵심 요구와 근거 연결'),'read-implication':('함축 의미','독해','밑줄 표현을 문맥에 맞게 바꿔 말하기'),'read-main':('요지','독해','사례를 포괄하는 중심 생각 요약'),'read-topic':('주제','독해','글 전체의 공통 화제 파악'),'read-title':('제목','독해','범위와 핵심 관점을 함께 포괄'),'read-chart':('도표 정보','독해','수치·비율·증감 조건 대조'),'read-detail':('내용 일치','독해','본문 근거와 선택지 대조'),'read-notice':('안내문 조건','독해','일정·참가 조건·예외 확인'),'read-grammar':('어법','독해','문장 구조와 문법 관계 분석'),'read-vocabulary':('문맥상 어휘','독해','문맥의 논리 방향과 어휘 의미 대조'),'read-blank':('빈칸 추론','독해','앞뒤 논리와 핵심 개념으로 빈칸 추론'),'read-irrelevant':('무관한 문장','독해','문단의 공통 화제와 흐름 대조'),'read-order':('글의 순서','독해','지시어·연결어·사건 순서 연결'),'read-insertion':('문장 삽입','독해','앞뒤 지시 관계와 논리 연결'),'read-summary':('요약 완성','독해','핵심 관계를 한 문장으로 압축'),'read-reference':('지칭 대상','독해','대명사와 선행 표현 연결')}
def classify(n,prompt,sections):
 s=re.sub(r'\s+','',prompt)
 if n<=17:
  if '목적' in s:return 'listen-purpose'
  if '의견' in s:return 'listen-opinion'
  if '요지' in s:return 'listen-main'
  if '그림' in s:return 'listen-picture'
  if '할일' in s or '부탁한일' in s or '부탁한것' in s:return 'listen-task'
  if '관계' in s:return 'listen-relationship'
  if '금액' in s or '지불' in s:return 'listen-money'
  if '이유' in s:return 'listen-reason'
  if '표를' in s or '표에서' in s:return 'listen-table'
  if '상황' in s and '할말' in s:return 'listen-situation'
  if '응답' in s:return 'listen-response'
  if '주제' in s:return 'listen-topic'
  if '언급' in s or '일치' in s:return 'listen-detail'
  return None
 if '한문장으로요약' in s or '요약하고자' in s:return 'read-summary'
 if '가리키는대상' in s:return 'read-reference'
 if '함축' in s or '밑줄친' in s and ('의미하는바' in s or '의미로' in s):return 'read-implication'
 if '어법' in s:return 'read-grammar'
 if '낱말의쓰임' in s or '문맥상' in s and '적절' in s:return 'read-vocabulary'
 if '주어진문장' in s and '들어가' in s:return 'read-insertion'
 if '관계없는문장' in s or '흐름과관계' in s:return 'read-irrelevant'
 if '순서' in s or '순서에맞게배열' in s:return 'read-order'
 if '다음빈칸' in s or '빈칸에들어갈' in s:return 'read-blank'
 if '안내문' in s or 'notice' in s.lower():return 'read-notice'
 if '도표' in s or '다음표의' in s:return 'read-chart'
 if '심경' in s or '분위기' in s:return 'read-emotion'
 if '주장' in s:return 'read-claim'
 if '목적' in s:return 'read-purpose'
 if '요지' in s:return 'read-main'
 if '주제' in s:return 'read-topic'
 if '제목' in s:return 'read-title'
 if '내용' in s and ('일치' in s or '적절하지' in s):return 'read-detail'
 for lo,hi,text in sections:
  if lo<=n<=hi:
   t=re.sub(r'\s+','',text)
   if '다음빈칸' in t:return 'read-blank'
   if '순서' in t:return 'read-order'
   if '주어진문장' in t and '들어가' in t:return 'read-insertion'
 return None
results=[];audit=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 sources=list(pool.map(load,years))
for y,r,p,m in sources:
 doc=fitz.open(p);assert '홀수형' in re.sub(r'\s+','',doc[0].get_text()),str(y)+' form';m['pdfPageCount']=len(doc);m['pageSize']=[round(doc[0].rect.width,2),round(doc[0].rect.height,2)];alllines=[];sections=[]
 for pi,page in enumerate(doc):
  for b in page.get_text('dict')['blocks']:
   for line in b.get('lines',[]):
    s=''.join(x['text'] for x in line['spans']).strip()
    if s:alllines.append({'page':pi+1,'box':[round(v,2) for v in line['bbox']],'text':s})
 for j,line in enumerate(alllines):
  match=re.search(r'\[(\d{1,2})[～~∼〜-](\d{1,2})\]',line['text'])
  if match:sections.append((int(match[1]),int(match[2]),' '.join(x['text'] for x in alllines[j:j+2])))
 found={}
 for j,line in enumerate(alllines):
  match=re.match(r'^(\d{1,2})\s*\.\s*(.*)',line['text'])
  if not match:continue
  n=int(match[1]);
  if not 1<=n<=45 or n in found:continue
  # Only left edges of exam columns; this avoids numbered lists inside passages.
  if line['box'][0]>doc[line['page']-1].rect.width*.7:continue
  following=[]
  for x in alllines[j:j+4]:
   if x is not line and re.match(r'^\d{1,2}\s*\.',x['text']):break
   following.append(x['text'])
  prompt=re.split('[①②③④⑤]',' '.join(following))[0];ending=re.search(r'고르시오[.。]?|[?？]',prompt);prompt=prompt[:ending.end()] if ending else prompt;typ=classify(n,prompt,sections)
  if not typ:continue
  label,unit,method=TYPE_INFO[typ];row={'id':f'official-{y}-english-odd-{n:02d}','year':y,'courseId':'english','questionNumber':n,'unit':unit,'typeId':'en-'+typ,'form':'odd','resourceId':m['resourceId'],'fileId':m['fileId'],'page':line['page'],'box':line['box'],'basis':'발문·공통 발문 대조'};found[n]=row
  audit.append({'year':y,'n':n,'page':line['page'],'typeId':row['typeId'],'prompt':prompt[:240]})
  if len(found)==45:break
 print(json.dumps({'year':y,'file':m['fileName'],'classified':len(found),'missing':sorted(set(range(1,46))-set(found))},ensure_ascii=False),flush=True)
 results.extend(found[n] for n in sorted(found))
(cache/'prompt-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
meta={'schemaVersion':1,'updatedAt':'2026-11-20','classificationMethod':'영어 발문 및 공통 발문 패턴을 문항 번호와 대조한 학습용 분류','scope':{'courseId':'english','years':years,'questionsPerYear':45,'expectedCount':450,'classifiedCount':len(results),'form':'홀수형 1회만 집계; 합본·짝수형 중복 제외'},'types':{('en-'+k):{'label':v[0],'unit':v[1],'method':v[2]} for k,v in TYPE_INFO.items()},'papers':[{**m,'year':y} for y,r,p,m in sources],'records':results,'limitations':['유형은 학습을 위해 구성한 분류이며 평가원의 공식 유형별 통계가 아닙니다.','출제 비중은 과거 집계 비율이며 다음 시험 출제 확률을 뜻하지 않습니다.','영어 외 과목은 별도 분류 범위를 표시합니다.']}
(root/'dist/gichul/data/type-analysis.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
if len(results)!=450:raise SystemExit('Unclassified questions require review')
