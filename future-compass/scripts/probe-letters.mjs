import fs from 'node:fs/promises'; import path from 'node:path';
import { parse as kordoc } from 'kordoc';
const OUT = process.argv[2]; await fs.mkdir(OUT, { recursive: true });
const H = 'https://seocho.sen.hs.kr', UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';
const log = []; let jar = '';
async function get(url, opt = {}) {
  const r = await fetch(url, { ...opt, redirect: 'follow', headers: { 'User-Agent': UA, Referer: H + '/75977/subMenu.do', ...(jar ? { cookie: jar } : {}), ...(opt.headers || {}) } });
  const sc = r.headers.getSetCookie ? r.headers.getSetCookie() : []; if (sc.length) jar = [...new Set([...(jar ? jar.split('; ') : []), ...sc.map(c => c.split(';')[0])])].join('; ');
  const b = Buffer.from(await r.arrayBuffer()); log.push(r.status + ' ' + url + ' ' + b.length + ' ' + (r.headers.get('content-type') || '') + ' ' + (r.headers.get('content-disposition') || '')); return { r, b };
}
const form = (o) => new URLSearchParams(o).toString(), PH = { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' };
try {
await get(H + '/75977/subMenu.do');
const bbsId = 'BBSMSTR_000000011310';
const L = await get(H + '/dggb/module/board/selectBoardListAjax.do', { method: 'POST', headers: PH, body: form({ bbsId, bbsTyCode: 'dliv', customRecordCountPerPage: '10', pageIndex: '1', searchCondition: '', searchKeyword: '', checkNttId: '', mvmnReturnUrl: '' }) });
await fs.writeFile(path.join(OUT, 'letters-list2.html'), L.b);
log.push('list ids ' + [...new Set([...L.b.toString().matchAll(/fnView\('[^']*',\s*'(\d+)'/g)].map(m => m[1]))].join(','));
for (const id of ['27502687', '27502703']) {
  const D = await get(H + '/dggb/module/board/selectBoardDetailAjax.do', { method: 'POST', headers: PH, body: form({ bbsId, bbsTyCode: 'dliv', customRecordCountPerPage: '10', pageIndex: '1', nttId: id, cmntSe: 'N' }) });
  await fs.writeFile(path.join(OUT, 'd-' + id + '.html'), D.b);
  const s = D.b.toString();
  const files = [...s.matchAll(/serverFileObj\["name"\] = "([^"]+)";[\s\S]*?serverFileObj\["atchFileId"\] = "([^"]+)";\s*serverFileObj\["fileSn"\] = "(\d+)"/g)];
  log.push('detail ' + id + ' files: ' + files.map(f => f[1] + ' ' + f[2] + ':' + f[3]).join(' | '));
  for (const f of files) {
    const F = await get(H + '/dggb/board/boardFile/downFile.do?atchFileId=' + f[2] + '&fileSn=' + f[3]);
    const fn = 'f-' + id + '-' + f[3]; await fs.writeFile(path.join(OUT, fn + '.bin'), F.b.subarray(0, 3000000));
    try { const r = await kordoc(F.b.buffer.slice(F.b.byteOffset, F.b.byteOffset + F.b.byteLength)); await fs.writeFile(path.join(OUT, fn + '.md'), (r && r.markdown) || JSON.stringify(r).slice(0, 2000)); } catch (e) { log.push(' kordoc ' + e.message); }
  }
}
} catch (e) { log.push('ERR ' + e.stack); }
await fs.writeFile(path.join(OUT, 'log.txt'), log.join('\n'));
