import fs from 'node:fs/promises'; import path from 'node:path';
const OUT = process.argv[2]; await fs.mkdir(OUT, { recursive: true });
const H = 'https://seocho.sen.hs.kr', UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';
const log = [];
async function get(url, opt = {}) { const r = await fetch(url, { ...opt, headers: { 'User-Agent': UA, ...(opt.headers || {}) } }); const b = Buffer.from(await r.arrayBuffer()); log.push(r.status + ' ' + url + ' ' + b.length + ' ' + (r.headers.get('content-type') || '') + ' ' + (r.headers.get('content-disposition') || '')); return { r, b }; }
// 1) 가정통신문 목록 (ajax)
const form = (o) => new URLSearchParams(o).toString();
for (const [nm, bbs, menu] of [['letters', 'BBSMSTR_000000011310', '75977'], ['notice', '', '75976']]) {
  let bbsId = bbs;
  if (!bbsId) { const p = await get(H + '/' + menu + '/subMenu.do'); bbsId = (/id="bbsId"[^>]*value="([^"]+)"/.exec(p.b.toString()) || [])[1]; log.push(nm + ' bbsId ' + bbsId); }
  const L = await get(H + '/dggb/module/board/selectBoardListAjax.do', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form({ bbsId, bbsTyCode: 'dliv', customRecordCountPerPage: '20', pageIndex: '1' }) });
  await fs.writeFile(path.join(OUT, nm + '-list.html'), L.b);
  const ids = [...new Set([...L.b.toString().matchAll(/(?:nttId|fnView|selectBoardDetail)[^0-9]{0,20}(\d{6,})/g)].map(m => m[1]))].slice(0, 6);
  log.push(nm + ' ids ' + ids.join(','));
  for (const id of ids.slice(0, 4)) {
    const D = await get(H + '/dggb/module/board/selectBoardDetailAjax.do?nttId=' + id, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form({ bbsId, bbsTyCode: 'dliv', nttId: id }) });
    await fs.writeFile(path.join(OUT, nm + '-d-' + id + '.html'), D.b);
    const links = [...D.b.toString().matchAll(/(?:href|onclick)="([^"]*(?:[Ff]ile|down|Down)[^"]*)"/g)].map(m => m[1]);
    log.push(' detail ' + id + ' links: ' + links.slice(0, 6).join(' | '));
  }
}
await fs.writeFile(path.join(OUT, 'log.txt'), log.join('\n'));
