// ⌚ 애플워치(단축어)로 1분 복습: 워치에서 받아쓰기 → POST /watch/note → 정리·Drive → 공부방이 가져감(/watch/inbox)
//  워치 단축어는 가족 티켓(24시간)을 못 쓰니 공부방에서 만든 '워치 키'를 쓴다. 서버에는 키의 해시만 저장.
//  과목은 공부방이 보내 둔 시간표로 '방금 끝난 수업'을 고른다(워치에서 과목을 말하면 그걸 우선).
import fs from 'node:fs';
import path from 'node:path';
import { createHash, timingSafeEqual, randomBytes } from 'node:crypto';

const hash = (v) => createHash('sha256').update(String(v)).digest('hex');
const SKIP = /체육|음악|미술|창체|자율|동아리|봉사/;
const toMin = (hm) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(hm || '')); return m ? +m[1] * 60 + +m[2] : NaN; };

export function createWatch(dir = process.env.FC_DATA_DIR || '/data', clock = Date.now) {
  const file = path.join(dir, 'watch.json');
  let S = {}; try { S = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  const save = () => { try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(file + '.tmp', JSON.stringify(S)); fs.renameSync(file + '.tmp', file); } catch (e) { console.error('watch save failed', e.message); } };
  const api = {
    setKey(key) { if (!/^[a-f0-9]{40}$/.test(String(key || ''))) return false; S.keyHash = hash(key); S.keyAt = clock(); save(); return true; },
    clearKey() { delete S.keyHash; save(); },
    hasKey() { return !!S.keyHash; },
    check(key) { if (!S.keyHash || !/^[a-f0-9]{40}$/.test(String(key || ''))) return false; const a = Buffer.from(hash(key)), b = Buffer.from(S.keyHash); return a.length === b.length && timingSafeEqual(a, b); },
    setTable(table, periods, len) {
      if (!Array.isArray(table) || table.length > 5 || !Array.isArray(periods) || periods.length > 12) return false;
      S.table = table.map((r) => (Array.isArray(r) ? r : []).slice(0, 12).map((x) => String(x || '').slice(0, 30)));
      S.periods = periods.map((p) => String(p || '').slice(0, 5)); S.len = Math.max(30, Math.min(90, Number(len) || 50)); save(); return true;
    },
    // 방금 끝난(70분 안) 수업 → 지금 수업 → 없으면 ''
    subjectAt(ms) {
      const k = new Date(ms + 9 * 3600000), w = k.getUTCDay(), now = k.getUTCHours() * 60 + k.getUTCMinutes();
      if (w < 1 || w > 5 || !S.table) return { sub: '', p: 0 };
      const row = S.table[w - 1] || [], len = S.len || 50; let best = null, cur = null;
      row.forEach((x, i) => { x = String(x || '').trim(); if (!x || SKIP.test(x)) return; const st = toMin((S.periods || [])[i]), end = st + len; if (isNaN(st)) return; if (now >= end && now - end <= 70) best = { sub: x, p: i + 1 }; else if (now >= st && now < end) cur = { sub: x, p: i + 1 }; });
      return best || cur || { sub: '', p: 0 };
    },
    subjects() { return [...new Set((S.table || []).flat().map((x) => String(x || '').trim()).filter((x) => x && !SKIP.test(x)))]; },
    acked(id) { return (S.acked || []).includes(id); },
    ack(ids) { S.acked = [...new Set([...(S.acked || []), ...ids.filter((x) => /^[a-f0-9]{32}$/.test(x))])].slice(-200); save(); },
    newId() { return randomBytes(16).toString('hex'); }
  };
  return api;
}

// 워치에서 온 말: "과목 … 내용" 처럼 맨 앞에 과목을 말하면 그 과목으로
export function splitSubject(text, subjects) {
  const t = String(text || '').trim();
  const list = (subjects || []).slice().sort((a, b) => b.length - a.length);
  for (const s of list) { const short = s.replace(/[0-9]+$/, ''), core = short.replace(/^(공통|통합)/, ''); for (const cand of [s, short, core]) if (cand && cand.length >= 2 && t.startsWith(cand)) return { subject: s, text: t.slice(cand.length).replace(/^[\s,.:·-]+/, '') || t }; }
  return { subject: '', text: t };
}
