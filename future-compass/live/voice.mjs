// 🎙️ 1분 녹음 자동 처리 (VPS): 받아쓰기(Whisper) → 정리(흰둥이 AI) → Google Drive 저장(rclone)
//  각 단계는 따로 실패할 수 있고, 실패해도 다음 단계는 가능한 만큼 진행한다. 결과는 FC_DATA_DIR/voice/<id>.json (48시간)
//  기기 쪽 원본 녹음은 그대로 남는다. 서버에 올라온 녹음은 처리 후 지운다(결과 JSON에는 소리 데이터 없음).
import fs from 'node:fs';
import path from 'node:path';

const MAX = 6 * 1024 * 1024, KEEP = 48 * 3600000;
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
  return '';
}

// deps: { stt(bytes, mime, hint) → text, organize(subject, text) → sum, drive: { upload(dir, name, bytes, mime) → {id,url,name,size} } | null, hasAI }
export function createVoice(deps, dir = path.join(process.env.FC_DATA_DIR || '/data', 'voice'), clock = Date.now) {
  const jobs = new Map();
  const file = (id) => path.join(dir, id + '.json');
  const saveJob = (j) => { try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(file(j.id) + '.tmp', JSON.stringify(j)); fs.renameSync(file(j.id) + '.tmp', file(j.id)); return true; } catch (e) { console.error('voice save failed', e.message); return false; } };
  const load = (id) => { if (jobs.has(id)) return jobs.get(id); try { const j = JSON.parse(fs.readFileSync(file(id), 'utf8')); jobs.set(id, j); return j; } catch { return null; } };
  function sweep() {
    const now = clock();
    for (const [id, j] of jobs) if (now - j.createdAt > KEEP) jobs.delete(id);
    try { for (const f of fs.readdirSync(dir)) { if (!/^[a-f0-9]{32}\.json$/.test(f)) continue; const p = path.join(dir, f); if (now - fs.statSync(p).mtimeMs > KEEP) fs.unlinkSync(p); } } catch {}
  }
  let running = Promise.resolve();   // 한 번에 하나씩 (CPU 2개짜리 VPS)
  function outcome(j) {
    if (j.state === 'interrupted') return 'interrupted';
    if (j.state !== 'done') return 'pending';
    return j.errors.length ? (j.result?.files?.length ? 'partial' : 'failed') : 'success';
  }
  function view(j) { return { ok: true, id: j.id, source: j.source || '', state: j.state, step: j.step, errors: j.errors, outcome: outcome(j), result: j.state === 'done' ? j.result : null }; }

  function enqueue(j, bytes, meta) {
    running = running.then(() => {
      j.state = 'working';
      if (!saveJob(j)) throw new Error('persist');
      return run(j, bytes, meta);
    }).catch((e) => {
      j.state = j.source === 'watch' ? 'interrupted' : 'done'; j.step = '';
      j.errors = [...new Set([...j.errors, j.source === 'watch' ? 'interrupted' : 'failed'])];
      j.result ||= { transcript: meta.text || '', summary: '', files: [], at: clock() };
      saveJob(j); console.error('voice interrupted', e && e.message);
    });
  }

  async function run(j, bytes, b) {
    const set = (step) => { j.step = step; if (!saveJob(j)) throw new Error('persist'); };
    let transcript = j.result?.transcript || '';
    if (!transcript && deps.stt && bytes) { set('stt'); try { transcript = String(await deps.stt(bytes, b.mime, b.subject) || '').trim().slice(0, 3000); } catch (e) { j.errors.push('stt'); } }
    if (!transcript && b.text) transcript = b.text.trim();
    let sum = j.result?.summary || '';
    if (!sum && transcript.length >= 15 && deps.hasAI) { set('summary'); try { sum = String(await deps.organize(b.subject, transcript) || '').trim().slice(0, 2000); if (!sum) j.errors.push('summary'); } catch (e) { j.errors.push('summary'); } }
    else if (transcript.length < 15) j.errors.push('short');
    else if (!sum && b.textOnly && !deps.hasAI) j.errors.push('summary');
    const files = (j.result?.files || []).slice(), drive = typeof deps.drive === 'function' ? deps.drive() : deps.drive;
    j.result = { transcript, summary: sum, files, at: clock() };
    if (!saveJob(j)) throw new Error('persist');
    if (drive) {
      set('drive');
      const base = baseName(b.subject, b.topic || '수업 복습', Date.parse(b.at)), folder = folderOf(b.subject);
      const items = bytes ? [['audio', (b.name && /^[^/\\]{1,200}$/.test(b.name) ? b.name : base + '.' + extOf(b.mime)), bytes, b.mime.split(';')[0]]] : [];
      if (transcript) items.push(['note', base + '_받아쓰기.md', Buffer.from('# ' + b.subject + ' · ' + (b.topic || '수업 복습') + '\n\n' + (bytes ? '녹음 시각: ' : '말한 시각(워치): ') + '' + kstStamp(Date.parse(b.at)).replace(/_KST$/, ' (KST)') + '\n\n## 받아쓰기\n\n' + transcript + '\n'), 'text/markdown']);
      if (sum) items.push(['review', base + '_복습정리.md', Buffer.from('# ' + b.subject + ' · ' + (b.topic || '수업 복습') + ' 복습 정리\n\n' + sum + '\n'), 'text/markdown']);
      for (const [role, name, data, mime] of items) {
        if (files.some((f) => f.role === role)) continue;
        try { const f = await drive.upload(folder, name, data, mime); if (f && /^[\w-]{10,200}$/.test(f.id)) files.push({ role, id: f.id, url: 'https://drive.google.com/file/d/' + f.id + '/view', name, size: data.length }); else j.errors.push('drive_' + role); }
        catch (e) { j.errors.push('drive_' + role); }
        if (!saveJob(j)) throw new Error('persist');
      }
    } else if (b.textOnly) j.errors.push('drive');
    j.result = { transcript, summary: sum, files, at: clock() };
    j.state = 'done'; j.step = ''; if (!saveJob(j)) throw new Error('persist');
  }

  // Only text submissions can be resumed without an audio original. Never journal audio bytes.
  try {
    for (const f of fs.readdirSync(dir)) {
      if (!/^[a-f0-9]{32}\.json$/.test(f)) continue;
      const j = load(f.slice(0, 32));
      if (!j || clock() - j.createdAt > KEEP || !['queued', 'working'].includes(j.state)) continue;
      if (j.source === 'watch' && j.input?.textOnly && typeof j.input.text === 'string' && j.input.text.trim().length >= 2) {
        j.state = 'queued'; j.step = 'queued'; j.errors = []; saveJob(j); enqueue(j, null, j.input);
      } else if (j.source === 'watch') {
        j.state = 'interrupted'; j.step = ''; j.errors = [...new Set([...j.errors, 'interrupted'])]; saveJob(j);
      }
    }
  } catch {}

  return {
    start(b) {
      sweep();
      const old = load(b.id); if (old) return view(old);
      const bytes = b.textOnly ? null : Buffer.from(b.audio, 'base64'); if (bytes && (!bytes.length || bytes.length > MAX)) return { error: 'bad_audio' };
      if (!bytes && !(typeof b.text === 'string' && b.text.trim().length >= 2)) return { error: 'bad_text' };
      const meta = { subject: b.subject.trim(), topic: (b.topic || '').trim(), at: b.at, mime: b.mime || '', text: b.text || '', name: b.name || '', textOnly: !!b.textOnly };
      const j = { id: b.id, state: 'queued', step: 'queued', errors: [], createdAt: clock(), subject: b.subject, topic: b.topic || '', source: b.source || '', at: b.at };
      if (b.textOnly && b.source === 'watch') j.input = meta;
      if (!saveJob(j)) return { error: 'persist' };
      jobs.set(j.id, j); enqueue(j, bytes, meta);
      return view(j);
    },
    retry(id, source) {
      const j = /^[a-f0-9]{32}$/.test(String(id || '')) ? load(id) : null;
      if (!j || j.source !== source || clock() - j.createdAt > KEEP) return { error: 'not_found' };
      if (!j.input?.textOnly || typeof j.input.text !== 'string') return { error: 'no_original' };
      if (['queued', 'working'].includes(j.state) || outcome(j) === 'success') return view(j);
      const before = JSON.parse(JSON.stringify(j));
      j.state = 'queued'; j.step = 'queued'; j.errors = [];
      if (!saveJob(j)) { Object.assign(j, before); return { error: 'persist' }; }
      enqueue(j, null, j.input); return view(j);
    },
    status(id) { const j = /^[a-f0-9]{32}$/.test(String(id || '')) ? load(id) : null; return j ? view(j) : null; },
    list(source) { sweep(); const out = []; try { for (const f of fs.readdirSync(dir)) if (/^[a-f0-9]{32}\.json$/.test(f)) { const j = load(f.slice(0, 32)); if (j && j.source === source) out.push(j); } } catch {} return out.sort((a, b) => a.createdAt - b.createdAt); },
    pending() { let n = 0; for (const j of jobs.values()) if (['queued', 'working'].includes(j.state)) n++; return n; }
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
  return {
    async upload(dir, name, data, mime) {
      const fd = new FormData(); fd.append('file0', new Blob([data], { type: mime }), name);
      await rc('operations/uploadfile', { fs: remote, remote: dir }, { body: fd });
      const st = await rc('operations/stat', null, { headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fs: remote, remote: dir + '/' + name, opt: {} }) });
      return st && st.item ? { id: st.item.ID, name: st.item.Name, size: st.item.Size } : null;
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
