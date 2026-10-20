// 🎙️ 1분 녹음 자동 처리 (VPS): 받아쓰기(Whisper) → 정리(흰둥이 AI) → Google Drive 저장(rclone)
//  각 단계는 따로 실패할 수 있고, 실패해도 다음 단계는 가능한 만큼 진행한다. 결과는 FC_DATA_DIR/voice/<id>.json (48시간)
//  기기 쪽 원본 녹음은 그대로 남는다. 서버에 올라온 녹음은 처리 후 지운다(결과 JSON에는 소리 데이터 없음).
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const MAX = 6 * 1024 * 1024, KEEP = 48 * 3600000;
const hash = (b, kind = 'sha256') => createHash(kind).update(b).digest('hex');
const driveId = v => /^[\w-]{10,200}$/.test(String(v || ''));
const safe = (v, n) => String(v || '').normalize('NFC').replace(/[\x00-\x1f\\/:*?"<>|]/g, ' ').trim().replace(/\s+/g, '-').slice(0, n);
export const kstStamp = (ms) => new Date(ms + 9 * 3600000).toISOString().slice(0, 23).replace('T', '_').replace(/:/g, '-') + '_KST';
export function baseName(subject, topic, at) { return safe(subject, 24) + '_' + safe(topic, 60) + '_' + kstStamp(at); }
export function folderOf(subject) { return ['승준 공부방', '1분 복습 녹음', safe(subject, 24) || '기타'].join('/'); }
const extOf = (mime) => /mp4|m4a|aac/i.test(mime) ? 'm4a' : /ogg/i.test(mime) ? 'ogg' : /wav/i.test(mime) ? 'wav' : /mpeg|mp3/i.test(mime) ? 'mp3' : 'webm';

export function validVoice(b, now = Date.now()) {
  if (!b || typeof b !== 'object') return 'bad';
  if (!/^[a-f0-9]{32}$/.test(String(b.id || ''))) return 'bad_id';
  if (typeof b.subject !== 'string' || !b.subject.trim() || b.subject.length > 40) return 'bad_subject';
  if (typeof b.topic !== 'string' || b.topic.length > 80) return 'bad_topic';
  const at = Date.parse(b.at); if (!Number.isFinite(at) || at > now + 60000 || at < now - 7 * 86400000) return 'bad_at';
  if (!/^audio\/[a-z0-9.+-]+(;.*)?$/i.test(String(b.mime || ''))) return 'bad_mime';
  if (typeof b.audio !== 'string' || !b.audio.length || b.audio.length > Math.ceil(MAX * 4 / 3) + 8) return 'bad_audio';
  if (b.text != null && (typeof b.text !== 'string' || b.text.length > 1500)) return 'bad_text';
  if (b.retry != null && typeof b.retry !== 'boolean') return 'bad_retry';
  return '';
}

// No audio is persisted here. After restart an unfinished job becomes interrupted;
// the originating device can resend its retained Blob with the same id/fingerprint.
export function createVoice(deps, dir = path.join(process.env.FC_DATA_DIR || '/data', 'voice'), clock = Date.now) {
  const jobs = new Map();
  const file = (id) => path.join(dir, id + '.json');
  const saveJob = (j) => { try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(file(j.id) + '.tmp', JSON.stringify(j)); fs.renameSync(file(j.id) + '.tmp', file(j.id)); } catch (e) { console.error('voice save failed', e.message); } };
  const expires = j => Number.isFinite(j.createdAt) && clock() >= j.createdAt + KEEP;
  function remove(id) { jobs.delete(id); for (const suffix of ['', '.tmp']) { try { fs.unlinkSync(file(id) + suffix); } catch {} } }
  const load = (id) => {
    let j = jobs.get(id);
    if (!j) {
      try { j = JSON.parse(fs.readFileSync(file(id), 'utf8')); } catch { return null; }
      if (j.id !== id || !Number.isFinite(j.createdAt)) { remove(id); return null; }
      if (j.state === 'queued' || j.state === 'working') { j.state = 'interrupted'; j.step = ''; j.errors = [...new Set([...(j.errors || []), 'interrupted'])]; saveJob(j); }
      jobs.set(id, j);
    }
    if (expires(j)) { remove(id); return null; }
    return j;
  };
  function sweep() {
    for (const [id, j] of jobs) if (expires(j)) remove(id);
    try { for (const f of fs.readdirSync(dir)) {
      if (/^[a-f0-9]{32}\.json$/.test(f)) load(f.slice(0, 32));
      else if (/^[a-f0-9]{32}\.json\.tmp$/.test(f) && clock() - fs.statSync(path.join(dir, f)).mtimeMs >= KEEP) fs.unlinkSync(path.join(dir, f));
    } } catch {}
  }
  sweep();
  const cleaner = setInterval(sweep, 60000); cleaner.unref();
  let running = Promise.resolve();   // 한 번에 하나씩 (CPU 2개짜리 VPS)
  function view(j) { return { ok: true, id: j.id, state: j.state, outcome: j.outcome || '', step: j.step, errors: j.errors, expiresAt: j.createdAt + KEEP, result: j.state === 'done' ? j.result : null }; }

  async function run(j, bytes, b) {
    const set = (step) => { if (expires(j)) throw Error('expired'); j.step = step; saveJob(j); };
    const work = j.work || (j.work = {});
    let transcript = work.transcript || '';
    if (!transcript && deps.stt) { set('stt'); try { transcript = String(await deps.stt(bytes, b.mime, b.subject) || '').trim().slice(0, 3000); } catch (e) { j.errors.push('stt'); } }
    if (!transcript && b.text) transcript = b.text.trim();
    work.transcript = transcript; saveJob(j);
    let sum = work.summary || '';
    if (!sum && transcript.length >= 15 && deps.hasAI) { set('summary'); try { sum = String(await deps.organize(b.subject, transcript) || '').trim().slice(0, 2000); } catch (e) { j.errors.push('summary'); } }
    else if (transcript.length < 15) j.errors.push('short');
    work.summary = sum; saveJob(j);
    const files = [], drive = typeof deps.drive === 'function' ? deps.drive() : deps.drive;
    if (drive) {
      set('drive');
      const base = baseName(b.subject, b.topic || '수업 복습', Date.parse(b.at)), folder = folderOf(b.subject);
      const items = [['audio', (b.name && /^[^/\\]{1,200}$/.test(b.name) ? b.name : base + '.' + extOf(b.mime)), bytes, b.mime.split(';')[0]]];
      if (transcript) items.push(['note', base + '_받아쓰기.md', Buffer.from('# ' + b.subject + ' · ' + (b.topic || '수업 복습') + '\n\n녹음 시각: ' + kstStamp(Date.parse(b.at)).replace(/_KST$/, ' (KST)') + '\n\n## 받아쓰기\n\n' + transcript + '\n'), 'text/markdown']);
      if (sum) items.push(['review', base + '_복습정리.md', Buffer.from('# ' + b.subject + ' · ' + (b.topic || '수업 복습') + ' 복습 정리\n\n' + sum + '\n'), 'text/markdown']);
      for (const [role, name, data, mime] of items) {
        set('drive');
        try {
          const f = await drive.upload(folder, name, data, mime);
          if (!f || !driveId(f.id) || !driveId(f.parentId) || f.name !== name || f.size !== data.length || f.md5 !== hash(data, 'md5')) throw Error('readback');
          files.push({ role, id: f.id, parentId: f.parentId, url: 'https://drive.google.com/file/d/' + f.id + '/view', name: f.name, size: f.size, sha256: hash(data), remoteMD5: f.md5, via: 'vps' });
          work.files = files; saveJob(j);
        }
        catch (e) { j.errors.push('drive_' + role); }
      }
    }
    if (!drive) j.errors.push('drive_unavailable');
    if (!transcript && !j.errors.includes('stt')) j.errors.push('stt');
    if (!sum && transcript.length >= 15 && !j.errors.includes('summary')) j.errors.push(deps.hasAI ? 'summary' : 'summary_unavailable');
    if (expires(j)) { remove(j.id); return; }
    j.result = { verified: true, transcript, summary: sum, files, at: clock() };
    j.outcome = !transcript && !sum && !files.length ? 'failed' : !j.errors.length && transcript && sum && files.length === 3 ? 'succeeded' : 'partial';
    j.state = 'done'; j.step = ''; saveJob(j);
  }

  return {
    start(b) {
      sweep();
      const bytes = Buffer.from(b.audio, 'base64'); if (!bytes.length || bytes.length > MAX) return { error: 'bad_audio' };
      const meta = { subject: b.subject.trim(), topic: (b.topic || '').trim(), at: b.at, mime: b.mime, text: b.text || '', name: b.name || '' };
      const fingerprint = hash(JSON.stringify(meta) + ':' + hash(bytes)), old = load(b.id);
      if (old && (old.fingerprint && old.fingerprint !== fingerprint || old.subject !== meta.subject || old.topic !== meta.topic)) return { error: 'conflict' };
      if (old && (!b.retry || old.state === 'queued' || old.state === 'working' || old.outcome === 'succeeded')) return view(old);
      const j = old || { id: b.id, createdAt: clock(), subject: meta.subject, topic: meta.topic };
      if (!j.work && j.result) j.work = { transcript: j.result.transcript || '', summary: j.result.summary || '' };
      Object.assign(j, { state: 'queued', step: 'queued', errors: [], outcome: '', fingerprint });
      jobs.set(j.id, j); saveJob(j);
      running = running.then(() => { if (expires(j)) { remove(j.id); return; } j.state = 'working'; return run(j, bytes, meta); }).catch((e) => { if (expires(j)) { remove(j.id); return; } j.state = 'done'; j.outcome = 'failed'; j.errors.push('failed'); j.result = { verified: true, transcript: meta.text, summary: '', files: [], at: clock() }; saveJob(j); console.error('voice failed', e && e.message); });
      return view(j);
    },
    status(id) { const j = /^[a-f0-9]{32}$/.test(String(id || '')) ? load(id) : null; return j ? view(j) : null; },
    pending() { sweep(); let n = 0; for (const j of jobs.values()) if (j.state === 'queued' || j.state === 'working') n++; return n; },
    cleanup: sweep,
    close() { clearInterval(cleaner); }
  };
}

// 공부방이 만든 폴더(승준 공부방/1분 복습 녹음/과목) 안의, ID까지 맞는 파일만 지운다
export async function trashFiles(drive, subject, files) {
  if (!drive || !drive.trash) return { error: 'no_drive' };
  if (typeof subject !== 'string' || !subject.trim() || subject.length > 40 || !Array.isArray(files) || !files.length || files.length > 6) return { error: 'bad' };
  const dir = folderOf(subject.trim()), out = {};
  for (const f of files) {
    if (!f || !/^[\w-]{10,200}$/.test(String(f.id || '')) || typeof f.name !== 'string' || !/^[^/\\]{1,240}$/.test(f.name)) { out[String(f && f.id)] = 'bad'; continue; }
    try { out[f.id] = await drive.trash(dir, f.name, f.id); } catch { out[f.id] = 'failed'; }
  }
  return { ok: true, result: out };
}

/* ---------- 실제 연결: Whisper 서버 · rclone rc ---------- */
export function sttClient(base) {
  if (!base) return null;
  return async (bytes, mime, hint) => {
    const u = new URL(base.replace(/\/$/, '') + '/asr'); u.searchParams.set('lang', 'ko'); if (hint) u.searchParams.set('hint', String(hint).slice(0, 40));
    const r = await fetch(u, { method: 'POST', headers: { 'content-type': mime }, body: bytes, signal: AbortSignal.timeout(600000) });
    const j = await r.json(); if (!r.ok || typeof j.text !== 'string') throw new Error('stt ' + r.status); return j.text;
  };
}
export function rcloneClient(base, remote = 'gdrive:') {
  if (!base) return null;
  const rc = async (op, q, init = {}) => { const u = new URL(base.replace(/\/$/, '') + '/' + op); for (const [k, v] of Object.entries(q || {})) u.searchParams.set(k, v); const r = await fetch(u, { method: 'POST', signal: AbortSignal.timeout(180000), ...init }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(op + ' ' + r.status + ' ' + (j.error || '')); return j; };
  const json = b => ({ headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });
  const stat = async p => (await rc('operations/stat', null, json({ fs: remote, remote: p, opt: { showHash: true, hashTypes: ['MD5'] } }))).item || null;
  const receipt = (item, name, data, parent) => {
    const hashes = item && item.Hashes || {}, md5 = hashes[Object.keys(hashes).find(k => k.toLowerCase() === 'md5')];
    if (!item || item.IsDir || !driveId(item.ID) || item.Name !== name || item.Size !== data.length || md5 !== hash(data, 'md5') || !parent || !parent.IsDir || !driveId(parent.ID)) throw Error('drive_readback');
    return { id: item.ID, name: item.Name, size: item.Size, parentId: parent.ID, md5 };
  };
  return {
    async upload(dir, name, data, mime) {
      await rc('operations/mkdir', null, json({ fs: remote, remote: dir }));
      const parent = await stat(dir), existing = await stat(dir + '/' + name);
      if (existing) return receipt(existing, name, data, parent); // Same verified bytes: no duplicate write; mismatch: do not overwrite.
      const fd = new FormData(); fd.append('file0', new Blob([data], { type: mime }), name);
      await rc('operations/uploadfile', { fs: remote, remote: dir }, { body: fd });
      return receipt(await stat(dir + '/' + name), name, data, parent);
    },
    async ok() { try { await rc('operations/about', { fs: remote }); return true; } catch { return false; } },
    // ID가 맞는 파일만 휴지통으로 (rclone --drive-use-trash). 없으면 'missing'
    async trash(dir, name, id) {
      const st = await rc('operations/stat', null, { headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fs: remote, remote: dir + '/' + name, opt: {} }) });
      if (!st || !st.item) return 'missing';
      if (st.item.ID !== id) return 'mismatch';
      await rc('operations/deletefile', null, { headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fs: remote, remote: dir + '/' + name }) });
      return 'trashed';
    }
  };
}
