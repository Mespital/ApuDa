// Short-lived, per-request capabilities. No Google credentials are stored here.
import { createHash, timingSafeEqual } from 'node:crypto';

export const STORE = 'study-chat-handoff-v1', TTL = 24 * 3600000, MAX = 3 * 1024 * 1024;
const hash = value => createHash('sha256').update(value).digest('hex');
const secret = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const idOK = value => typeof value === 'string' && /^[a-f0-9]{32}$/.test(value);
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const safe = (value, n) => String(value || '').normalize('NFC').replace(/[\x00-\x1f\\/:*?"<>|]/g, ' ').trim().replace(/\s+/g, '-').slice(0, n);
const headers = { 'cache-control': 'private, no-store', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff', 'x-robots-tag': 'noindex, nofollow, noarchive' };
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...headers, 'content-type': 'application/json; charset=utf-8' } });
const fail = (code, status = 400) => { throw Object.assign(Error(code), { status }); };
const text = (v, n, required = false) => { if (typeof v !== 'string' || v.length > n || required && !v.trim()) fail('invalid'); return v; };
const dateOK = value => { try { return typeof value === 'string' && /^\d{4}-\d\d-\d\d$/.test(value) && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value; } catch { return false; } };
const keyFor = (owner, mode) => hash(owner + ':' + mode);
const auth = req => (req.headers.get('authorization') || '').replace(/^Bearer /, '');
const driveId = value => typeof value === 'string' && /^[\w-]{10,200}$/.test(value);
export function driveURL(value, id) {
  try { const u = new URL(value); return u.protocol === 'https:' && u.hostname === 'drive.google.com' && !u.username && !u.password && !u.port && u.pathname === '/file/d/' + id + '/view'; } catch { return false; }
}
function sourceOf(v, now) {
  if (!v || typeof v !== 'object' || !['note', 'backup'].includes(v.kind)) fail('invalid');
  const s = v.source;
  if (!s || typeof s !== 'object') fail('invalid');
  const at = text(s.at, 40, true);
  if (!Number.isFinite(Date.parse(at)) || Date.parse(at) > now + 60000) fail('invalid');
  const source = { noteId: text(s.noteId || '', 80), at, subject: text(s.subject, 40, true), topic: text(s.topic, 80, true), text: text(s.text || '', 1500), sum: text(s.sum || '', 2000), review: text(s.review || '', 80), reviewDates: [] };
  if (!Array.isArray(s.reviewDates) || s.reviewDates.length > 7 || !s.reviewDates.every(dateOK)) fail('invalid');
  source.reviewDates = s.reviewDates;
  if (s.photoText != null) source.photoText = text(s.photoText, 1500);
  if (s.lesson != null) {
    const l = s.lesson;
    if (!l || typeof l !== 'object' || !dateOK(l.date) || l.date > new Date(now + 9 * 3600000).toISOString().slice(0, 10) || !['last', 'important'].includes(l.purpose) || l.page != null && (!Number.isInteger(l.page) || l.page < 1 || l.page > 5000)) fail('invalid');
    source.lesson = { version: 1, date: l.date, purpose: l.purpose, page: l.page == null ? null : l.page };
  }
  if (v.kind === 'note' && !source.noteId) fail('invalid');
  return source;
}
function baseName(source) {
  return safe(source.subject, 24) + '_' + safe(source.topic, 60) + '_' + new Date(Date.parse(source.at) + 9 * 3600000).toISOString().slice(0, 23).replace('T', '_').replace(/:/g, '-') + '_KST';
}
function file(role, name, mime, bytes) {
  return { role, name, mime, size: bytes.length, sha256: hash(bytes), data: bytes.toString('base64') };
}
function receiptOf(v, job) {
  if (!v || v.verified !== true || !Array.isArray(v.files) || v.files.length !== job.files.length + (job.kind === 'note' ? 1 : 0)) fail('receipt_invalid');
  const summary = text(v.summary || '', 2000);
  if (job.kind === 'note' && summary.trim().length < 5) fail('summary_missing');
  const files = [], seen = new Set();
  for (const f of v.files) {
    if (!f || seen.has(f.role) || !driveId(f.id) || !driveURL(f.url, f.id) || !driveId(f.parentId)) fail('receipt_invalid');
    const original = job.files.find(x => x.role === f.role);
    if (!original && (job.kind !== 'note' || f.role !== 'review')) fail('receipt_invalid');
    if (!original && (f.name !== baseName(job.source) + '_복습정리.md' || f.size !== Buffer.byteLength(summary) || f.sha256 !== hash(Buffer.from(summary)))) fail('receipt_mismatch');
    text(f.name, 240, true);
    if (!Number.isSafeInteger(f.size) || f.size <= 0 || f.size > MAX) fail('receipt_invalid');
    if (original && (f.name !== original.name || f.size !== original.size || f.sha256 !== original.sha256)) fail('receipt_mismatch');
    files.push({ role: f.role, id: f.id, url: f.url, name: f.name, size: f.size, sha256: original ? original.sha256 : hash(Buffer.from(summary)), parentId: f.parentId }); seen.add(f.role);
  }
  if (!job.files.every(f => seen.has(f.role)) || job.kind === 'note' && !seen.has('review')) fail('receipt_missing');
  files.sort((a, b) => [...job.files.map(f => f.role), 'review'].indexOf(a.role) - [...job.files.map(f => f.role), 'review'].indexOf(b.role));
  return { verified: true, files, summary };
}
function link(req, id, key, mode = '') {
  const u = new URL(req.url); u.search = ''; u.searchParams.set('id', id); u.searchParams.set('key', key); if (mode) u.searchParams.set('mode', mode); return u;
}
function publicJob(req, job, readKey) {
  const receipt = link(req, job.id, '', 'result'); receipt.searchParams.delete('key');
  return {
    app: 'future-compass-chat-drive', version: 1, id: job.id, kind: job.kind, createdAt: job.createdAt, expiresAt: job.expiresAt, source: job.source,
    reviewFile: job.kind === 'note' ? { role: 'review', name: baseName(job.source) + '_복습정리.md', mime: 'text/markdown', content: 'UTF-8로 인코딩한 summary와 정확히 같은 본문' } : null,
    destination: { folders: ['승준 공부방', '1분 복습 녹음', job.source.subject] },
    files: job.files.map(({ data, ...f }) => { const u = link(req, job.id, readKey, 'file'); u.searchParams.set('file', f.role); return { ...f, url: u.href }; }),
    receipt: { url: receipt.href, bearer: job.reportKey, method: 'POST', body: { verified: true, summary: '복습 정리 (최대 2,000자)', files: job.files.map(f => ({ role: f.role, name: f.name, size: f.size, sha256: f.sha256, id: '실제 Drive 파일 ID', parentId: '실제 부모 폴더 ID', url: '커넥터 조회로 확인한 https://drive.google.com/file/d/ID/view 주소' })) } }
  };
}

export function makeHandler(openStore, clock = Date.now) {
  return async req => {
    try {
      const u = new URL(req.url), mode = u.searchParams.get('mode') || 'manifest', now = clock();
      if (!['GET', 'POST', 'DELETE'].includes(req.method)) return json({ error: 'method' }, 405);
      if (req.headers.get('origin') && req.headers.get('origin') !== u.origin) return json({ error: 'origin' }, 403);
      const store = openStore();
      if (req.method === 'POST' && mode === 'create') {
        if (req.headers.get('origin') !== u.origin) fail('origin', 403);
        if (Number(req.headers.get('content-length')) > MAX + 65536) fail('too_large', 413);
        const bytes = new Uint8Array(await req.arrayBuffer());
        if (bytes.byteLength > MAX + 65536) fail('too_large', 413);
        const form = await new Request(req.url, { method: 'POST', headers: { 'content-type': req.headers.get('content-type') || '' }, body: bytes }).formData();
        const raw = form.get('packet'); if (typeof raw !== 'string' || raw.length > 12000) fail('invalid');
        const v = JSON.parse(raw); if (v.version !== 1 || !idOK(v.id) || !secret(v.ownerKey)) fail('invalid');
        const source = sourceOf(v, now), base = baseName(source), files = [];
        if (v.kind === 'note') {
          const lesson = source.lesson ? '\n\n## 수업 범위\n\n수업일: ' + source.lesson.date + '\n용도: ' + (source.lesson.purpose === 'last' ? '오늘 여기까지 · 수업 마지막 쪽' : '중요한 부분 · 복습 자료') + '\n확인한 쪽: ' + (source.lesson.page || '미입력') : '';
          const md = '# ' + source.subject + ' · ' + source.topic + '\n\n작성 시각: ' + source.at + lesson + '\n\n## 원문\n\n' + source.text + (source.photoText ? '\n\n## 사진에서 읽은 글·메모\n\n' + source.photoText : '') + '\n\n## 작성한 정리\n\n' + source.sum + '\n\n## 다시 보기\n\n' + source.reviewDates.join('\n') + '\n';
          files.push(file('note', base + '.md', 'text/markdown', Buffer.from(md)));
          files.push(file('source', base + '.json', 'application/json', Buffer.from(JSON.stringify({ app: 'future-compass-note', version: 1, ...source }, null, 2))));
        }
        const types = { audio: /^audio\/(webm|mp4|ogg|wav|x-wav|mpeg|flac|aac)(;.*)?$/i, photo: /^image\/jpeg$/i, backup: /^application\/json$/i };
        const ext = mime => /mp4/i.test(mime) ? 'm4a' : /ogg/i.test(mime) ? 'ogg' : /wav/i.test(mime) ? 'wav' : /mpeg/i.test(mime) ? 'mp3' : /flac/i.test(mime) ? 'flac' : /aac/i.test(mime) ? 'aac' : 'webm';
        let size = files.reduce((n, f) => n + f.size, 0);
        for (const role of ['audio', 'photo', 'backup']) {
          const f = form.get(role); if (!f) continue;
          if (typeof f === 'string' || !types[role].test(f.type) || !f.size || v.kind === 'backup' && role !== 'backup' || v.kind === 'note' && role === 'backup') fail('file_invalid');
          if ((size += f.size) > MAX) fail('too_large', 413);
          const data = Buffer.from(await f.arrayBuffer());
          if (role === 'backup') { const b = JSON.parse(data.toString()); if (b.app !== 'future-compass-study' || b.version !== 1 || !b.core || !b.extra || !b.side || Object.keys(b.side).some(k => !['fc_planner_v1', 'fc_notes_v1', 'fc_offdays_v1', 'fc_preview_v1', 'fc_school_class'].includes(k))) fail('backup_invalid'); }
          files.push(file(role, base + '.' + (role === 'backup' ? 'json' : role === 'photo' ? 'jpg' : ext(f.type)), f.type.split(';')[0], data));
        }
        if (v.kind === 'backup' && !files.some(f => f.role === 'backup')) fail('backup_missing');
        if (new Set([...form.keys()]).size !== [...form.keys()].length || [...form.keys()].some(k => !['packet', 'audio', 'photo', 'backup'].includes(k))) fail('invalid');
        const fingerprint = hash(JSON.stringify({ kind: v.kind, source, files: files.map(({ data, ...f }) => f) }));
        const readKey = keyFor(v.ownerKey, 'read'), job = { id: v.id, kind: v.kind, source, files, fingerprint, ownerHash: hash(v.ownerKey), readHash: hash(readKey), reportKey: keyFor(v.ownerKey, 'report'), createdAt: now, expiresAt: now + TTL };
        const result = await store.setJSON('job-' + job.id, job, { onlyIfNew: true, metadata: { expiresAt: job.expiresAt } });
        if (!result.modified) {
          const old = await store.get('job-' + job.id, { type: 'json' });
          if (!old || !same(old.ownerHash, job.ownerHash) || old.fingerprint !== fingerprint) fail('conflict', 409);
          if (old.expiresAt <= now) fail('expired', 410);
          job.expiresAt = old.expiresAt;
        }
        return json({ ok: true, id: job.id, expiresAt: job.expiresAt, url: link(req, job.id, readKey).href });
      }
      const id = u.searchParams.get('id'); if (!idOK(id)) fail('not_found', 404);
      const job = await store.get('job-' + id, { type: 'json' }); if (!job) fail('not_found', 404);
      const key = auth(req) || u.searchParams.get('key') || '';
      const owner = secret(key) && same(hash(key), job.ownerHash), reader = secret(key) && same(hash(key), job.readHash), reporter = secret(key) && same(key, job.reportKey);
      if (!(mode === 'status' || req.method === 'DELETE' ? owner : mode === 'result' ? reporter : reader)) fail('unauthorized', 403);
      if (job.expiresAt <= now) { await store.delete('job-' + id); await store.delete('result-' + id); fail('expired', 410); }
      if (req.method === 'DELETE') { await store.delete('job-' + id); await store.delete('result-' + id); return json({ ok: true }); }
      if (req.method === 'GET' && mode === 'status') return json({ ok: true, id, expiresAt: job.expiresAt, result: await store.get('result-' + id, { type: 'json' }) });
      if (req.method === 'GET' && mode === 'manifest') return json(publicJob(req, job, key));
      if (req.method === 'GET' && mode === 'file') {
        const f = job.files.find(x => x.role === u.searchParams.get('file')); if (!f) fail('not_found', 404);
        return new Response(Buffer.from(f.data, 'base64'), { headers: { ...headers, 'content-type': f.mime, 'content-disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(f.name) } });
      }
      if (req.method === 'POST' && mode === 'result') {
        if (!/application\/json/i.test(req.headers.get('content-type') || '')) fail('invalid');
        const raw = await req.text(); if (Buffer.byteLength(raw) > 24000) fail('too_large', 413);
        const result = receiptOf(JSON.parse(raw), job), before = await store.get('result-' + id, { type: 'json' });
        if (before) { if (JSON.stringify(before.value) !== JSON.stringify(result)) fail('receipt_conflict', 409); return json({ ok: true, duplicate: true }); }
        const saved = await store.setJSON('result-' + id, { at: now, value: result }, { onlyIfNew: true, metadata: { expiresAt: job.expiresAt } });
        if (!saved.modified) { const other = await store.get('result-' + id, { type: 'json' }); if (JSON.stringify(other?.value) !== JSON.stringify(result)) fail('receipt_conflict', 409); }
        return json({ ok: true });
      }
      return json({ error: 'method' }, 405);
    } catch (e) { return json({ error: e.status ? e.message : e instanceof SyntaxError ? 'invalid' : 'unavailable' }, e.status || (e instanceof SyntaxError ? 400 : 503)); }
  };
}

export async function cleanup(store, now = Date.now()) {
  let checked = 0, removed = 0;
  for (const prefix of ['job-', 'result-']) for await (const page of store.list({ prefix, paginate: true })) {
    for (const { key } of page.blobs) {
      if (++checked > 500) return { checked: checked - 1, removed, partial: true };
      if (!/^(job|result)-[a-f0-9]{32}$/.test(key)) continue;
      const value = await store.getMetadata(key);
      if (Number.isFinite(value?.metadata?.expiresAt) && value.metadata.expiresAt <= now) { await store.delete(key); if (prefix === 'job-') await store.delete('result-' + key.slice(4)); removed++; }
    }
  }
  return { checked, removed, partial: false };
}
