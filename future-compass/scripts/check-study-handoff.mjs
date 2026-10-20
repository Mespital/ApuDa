import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { makeHandler, cleanup, MAX, TTL } from '../netlify/lib/study-handoff-core.mjs';

export function memoryStore() {
  const rows = new Map();
  return {
    rows,
    async get(k) { return rows.has(k) ? structuredClone(rows.get(k).data) : null; },
    async getMetadata(k) { return rows.has(k) ? { metadata: rows.get(k).meta } : null; },
    async setJSON(k, data, options = {}) { if (options.onlyIfNew && rows.has(k)) return { modified: false }; rows.set(k, { data: structuredClone(data), meta: options.metadata || {} }); return { modified: true }; },
    async delete(k) { rows.delete(k); },
    async *list({ prefix }) { yield { blobs: [...rows.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }; }
  };
}
const sha = b => createHash('sha256').update(b).digest('hex');
let now = Date.parse('2026-10-20T02:30:00Z');
const store = memoryStore(), handler = makeHandler(() => store, () => now), origin = 'https://study.example', endpoint = origin + '/.netlify/functions/study-handoff';
const owner = randomBytes(32).toString('hex'), id = randomBytes(16).toString('hex');
const source = { noteId: 'note-1', at: '2026-10-20T02:00:00Z', subject: '수학', topic: '유리함수/점근선', text: '유리함수의 점근선을 설명한다. 모르는 것은 확인한다.', sum: '', review: 'review-1', reviewDates: ['2026-10-21', '2026-10-23', '2026-10-27'] };
function upload(v = {}, bytes = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x11, 0x22])) {
  const f = new FormData(); f.set('packet', JSON.stringify({ version: 1, kind: 'note', id, ownerKey: owner, source, ...v }));
  if (bytes) f.set('audio', new Blob([bytes], { type: 'audio/webm;codecs=opus' }), 'raw.webm');
  return new Request(endpoint + '?mode=create', { method: 'POST', headers: { origin }, body: f });
}
const created = await handler(upload()); assert.equal(created.status, 200); const c = await created.json();
assert.equal(c.expiresAt, now + TTL); assert.equal(store.rows.size, 1);
const retry = await (await handler(upload())).json(); assert.equal(retry.url, c.url); assert.equal(store.rows.size, 1);
assert.equal((await handler(upload({ source: { ...source, text: '변경된 원문' } }))).status, 409);
const manifestResponse = await handler(new Request(c.url)); assert.equal(manifestResponse.status, 200); assert.equal(manifestResponse.headers.get('cache-control'), 'private, no-store');
const m = await manifestResponse.json(); assert.equal(m.source.text, source.text); assert.equal(m.files.length, 3);
assert.ok(!JSON.stringify(m).includes(owner)); assert.ok(!JSON.stringify(m).includes('ownerHash'));
assert.ok(m.files[0].name.includes('2026-10-20_11-00-00.000_KST'));
assert.equal(m.files[2].mime, 'audio/webm');
for (const f of m.files) { const r = await handler(new Request(f.url)); assert.equal(r.status, 200); const b = Buffer.from(await r.arrayBuffer()); assert.equal(b.length, f.size); assert.equal(sha(b), f.sha256); }
const readKey = new URL(c.url).searchParams.get('key');
const request = (mode, key, method = 'GET', body) => new Request(endpoint + '?id=' + id + '&mode=' + mode, { method, headers: { authorization: 'Bearer ' + key, ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
assert.equal((await handler(request('manifest', owner))).status, 403);
assert.equal((await handler(request('status', readKey))).status, 403);
assert.equal((await handler(request('manifest', m.receipt.bearer))).status, 403);
assert.equal((await handler(request('status', owner))).status, 200);
const receipt = { verified: true, summary: '📌 핵심 정리\n분모가 0이 되는 점을 확인한다.\n❓ 스스로 확인 질문\n점근선의 뜻은?', files: m.files.map((f, i) => ({ role: f.role, name: f.name, size: f.size, sha256: f.sha256, id: 'test_Drive_ID_' + i, parentId: 'test_Drive_Parent', url: 'https://drive.google.com/file/d/test_Drive_ID_' + i + '/view' })) };
receipt.files.push({role:'review',name:m.reviewFile.name,size:Buffer.byteLength(receipt.summary),sha256:sha(Buffer.from(receipt.summary)),id:'test_Drive_Review',parentId:'test_Drive_Parent',url:'https://drive.google.com/file/d/test_Drive_Review/view'});
const post = v => handler(request('result', m.receipt.bearer, 'POST', v));
assert.equal((await handler(request('result', readKey, 'POST', receipt))).status, 403);
assert.equal((await post({ ...receipt, verified: false })).status, 400);
assert.equal((await post({ ...receipt, files: receipt.files.slice(1) })).status, 400);
assert.equal((await post({ ...receipt, summary: '' })).status, 400);
assert.equal((await post({ ...receipt, summary: 'x'.repeat(2001) })).status, 400);
for (const patch of [{ size: 1 }, { sha256: 'wrong' }, { url: 'javascript:alert(1)' }, { parentId: 'bad' }, { name: 'different.webm' }]) {
  const files = receipt.files.map((f, i) => i === 0 ? { ...f, ...patch } : f); assert.equal((await post({ ...receipt, files })).status, 400);
}
assert.equal((await post(receipt)).status, 200);
assert.equal((await post(receipt)).status, 200);
const changedSummary='다른 결과를 덮어쓰려고 한다.';
assert.equal((await post({ ...receipt, summary: changedSummary, files: receipt.files.map(f=>f.role==='review'?{...f,size:Buffer.byteLength(changedSummary),sha256:sha(Buffer.from(changedSummary))}:f) })).status, 409);
const status = await (await handler(request('status', owner))).json(); assert.deepEqual(status.result.value, receipt);
assert.equal((await handler(new Request(endpoint + '?mode=create', { method: 'POST', headers: { origin: 'https://other.example' }, body: 'x' }))).status, 403);
assert.equal((await handler(upload({}, Buffer.alloc(MAX + 1)))).status, 413);
assert.equal((await handler(upload({ source: { ...source, reviewDates: ['2026-99-99'] } }))).status, 400);
const bad = new FormData(); bad.set('packet', '{broken');
assert.equal((await handler(new Request(endpoint + '?mode=create', { method: 'POST', headers: { origin }, body: bad }))).status, 400);
now += TTL + 1;
assert.equal((await handler(new Request(c.url))).status, 410); assert.equal(store.rows.size, 0);
assert.equal((await handler(request('result', m.receipt.bearer, 'POST', receipt))).status, 404);
const stale = randomBytes(16).toString('hex'); await store.setJSON('result-' + stale, {}, { metadata: { expiresAt: now - 1 } });
await store.setJSON('job-' + id, {}, { metadata: { expiresAt: now + TTL } });
assert.equal((await cleanup(store, now)).removed, 1); assert.ok(store.rows.has('job-' + id));
assert.equal((await handler(request('manifest', readKey))).status, 403);
assert.equal((await makeHandler(() => { throw Error('no deployment binding'); })(new Request(c.url))).status, 503);
console.log('study handoff: source bytes/KST names, isolated capabilities, retries, receipt validation, expiry and cleanup passed');
