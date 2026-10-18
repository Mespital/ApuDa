// 임시 탐색: 공식 출처 원본을 받아 artifact로 저장 (수집기 설계용, 머지 전 삭제)
import fs from 'node:fs/promises';
import path from 'node:path';
import iconv from 'iconv-lite';
const OUT = process.argv[2] || 'probe-out';
await fs.mkdir(OUT, { recursive: true });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const BASE = 'https://www.schoolinfo.go.kr';
async function save(name, buf) { await fs.writeFile(path.join(OUT, name), buf); console.log('saved', name, buf.length); }
async function get(url, opt = {}) { const r = await fetch(url, { ...opt, headers: { 'User-Agent': UA, ...(opt.headers || {}) }, signal: AbortSignal.timeout(25000) }); return { r, buf: Buffer.from(await r.arrayBuffer()) }; }
const log = [];
try {
  const { buf } = await get(BASE + '/ei/ss/pneiss_a04_s0/getSchoolList.do', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', Referer: BASE + '/ei/ss/pneiss_a03_s0.do' }, body: new URLSearchParams({ SEARCH_WORD: '서초고등학교' }) });
  await save('si-search.json', buf);
  const list = JSON.parse(buf.toString('utf-8'));
  const hit = list.find(x => x.SHL_NM === '서초고등학교' && /서울/.test(JSON.stringify(x))) || list[0];
  log.push('hit ' + JSON.stringify(hit).slice(0, 400));
  const codes = { GS_HANGMOK_CD: '43', GS_HANGMOK_NO: '4-가', GS_HANGMOK_NM: '교과별(학년별) 교수ㆍ학습 및 평가계획에 관한 사항', GS_BURYU_CD: 'JG110', JG_BURYU_CD: 'JG040', JG_HANGMOK_CD: '14', JG_GUBUN: '1' };
  const body = new URLSearchParams({ ...codes, HG_NM: hit.SHL_NM, SHL_IDF_CD: hit.SHL_IDF_CD, GS_TYPE: 'Y', JG_YEAR: '2026', SORT: 'BR', CHOSEN_JG_YEAR: '2026', PRE_JG_YEAR: '2026', LOAD_TYPE: 'single' });
  const { buf: lb } = await get(BASE + '/ei/pp/Pneipp_b43_s0p.do', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded', Referer: BASE + '/ei/ss/Pneiss_b01_s0.do' }, body });
  const html = iconv.decode(lb, 'euc-kr'); await save('si-b43.html', Buffer.from(html));
  const files = [...html.matchAll(/getEiFile\d*\(\s*['"]?(\d+)['"]?\s*\)[^>]*>\s*([^<]*?\.(?:hwpx|hwp|pdf))/gi)].map(m => ({ seq: m[1], name: m[2].trim() }));
  log.push('files ' + JSON.stringify(files));
  const fi = html.indexOf('eiFileDownForm'), seg = html.slice(fi, html.indexOf('</form>', fi));
  const params = {}; for (const m of seg.matchAll(/name="([A-Za-z_]\w*)"[^>]*?value="([^"]*)"/g)) if (!(m[1] in params)) params[m[1]] = m[2];
  Object.assign(params, { SHL_IDF_CD: params.SHL_IDF_CD || hit.SHL_IDF_CD });
  log.push('params ' + JSON.stringify(params));
  let n = 0;
  for (const f of files) {
    if (n++ >= 12) break;
    const qs = new URLSearchParams({ ...params, FILE_SEQ: f.seq });
    const { r, buf: fb } = await get(BASE + '/servlets/EiFileDownLoad.do?' + qs, { headers: { Referer: BASE + '/ei/pp/Pneipp_b43_s0p.do' } });
    log.push('dl ' + f.seq + ' ' + r.status + ' ' + fb.length + ' ' + (r.headers.get('content-disposition') || ''));
    const ext = (f.name.match(/\.(hwpx|hwp|pdf)$/i) || ['', 'bin'])[1];
    await save('si-file-' + f.seq + '.' + ext, fb);
  }
} catch (e) { log.push('schoolinfo error ' + e.stack); }
for (const [name, url] of [
  ['seochoedu-home.html', 'https://www.seochoedu.or.kr/index.do'],
  ['seochoedu-prgrm-yangjae.html', 'https://seochoedu.or.kr/user/prgrm/yangjae/BD_selectPrgrmList.do'],
  ['school-home.html', 'https://seocho.sen.hs.kr/'],
  ['gnsc-home.html', 'https://gnscedu.sen.go.kr/'],
  ['sen-online.html', 'https://enews.sen.go.kr/news/view.do?bbsSn=188344&step1=3&step2=1'],
]) {
  try { const { r, buf } = await get(url); log.push(name + ' ' + r.status + ' ' + r.url); await save(name, buf); } catch (e) { log.push(name + ' error ' + e.message); }
}
await save('log.txt', Buffer.from(log.join('\n')));
console.log(log.join('\n'));
