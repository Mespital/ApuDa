// 🎙️ VPS 녹음 자동 처리(live/voice.mjs) 검사 — 받아쓰기·정리·Drive 단계와 실패 시 이어가기
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createVoice, validVoice, baseName, folderOf, trashFiles } from '../live/voice.mjs';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'voice-'));
const now = Date.parse('2026-10-20T06:00:00Z');
const audio = Buffer.from('fake-opus-bytes').toString('base64');
const job = (id, extra = {}) => ({ id: id.padEnd(32, '0'), subject: '통합사회2', topic: '4교시 수업', at: '2026-10-20T05:59:00Z', mime: 'audio/webm;codecs=opus', audio, text: '', name: '통합사회2_4교시-수업_2026-10-20_14-59-00.000_KST.webm', ...extra });
const wait = async (v, id) => { for (let i = 0; i < 100; i++) { const s = v.status(id); if (s && s.state === 'done') return s; await new Promise((r) => setTimeout(r, 10)); } throw new Error('timeout'); };

// 입력 검사
assert.equal(validVoice(job('a1'), now), '');
assert.equal(validVoice(job('zz'), now), 'bad_id');
assert.equal(validVoice(job('a2', { mime: 'text/plain' }), now), 'bad_mime');
assert.equal(validVoice(job('a3', { at: '2027-01-01T00:00:00Z' }), now), 'bad_at');
assert.equal(validVoice(job('a4', { subject: '' }), now), 'bad_subject');
assert.equal(baseName('통합사회2', '4교시 수업', Date.parse('2026-10-20T05:59:00Z')), '통합사회2_4교시-수업_2026-10-20_14-59-00.000_KST');
assert.equal(folderOf('통합/사회'), '승준 공부방/1분 복습 녹음/통합-사회');

// 1) 전부 성공: 받아쓰기 → 정리 → Drive 3개 파일
const uploads = [];
const ok = createVoice({
  stt: async (bytes, mime, hint) => { assert.equal(bytes.toString(), 'fake-opus-bytes'); assert.equal(hint, '통합사회2'); return '오늘은 인권의 의미와 기본권 종류를 배웠다. 자유권 평등권 참정권.'; },
  hasAI: true, organize: async (s, t) => { assert.match(t, /인권/); return '📌 핵심 정리\n- 인권은 사람이라면 누구나 누리는 권리'; },
  drive: () => ({ upload: async (folder, name, data, mime) => { uploads.push({ folder, name, mime, size: data.length }); return { id: 'drv' + uploads.length + 'abcdefghij', name, size: data.length }; } })
}, path.join(dir, 'ok'), () => now);
const s1 = ok.start(job('b1'));
assert.equal(s1.ok, true);
const r1 = await wait(ok, job('b1').id);
assert.deepEqual(r1.errors, []);
assert.match(r1.result.transcript, /기본권/);
assert.match(r1.result.summary, /핵심 정리/);
assert.deepEqual(r1.result.files.map((f) => f.role), ['audio', 'note', 'review']);
assert.ok(r1.result.files.every((f) => f.url === 'https://drive.google.com/file/d/' + f.id + '/view'));
assert.deepEqual(uploads.map((u) => u.folder), Array(3).fill('승준 공부방/1분 복습 녹음/통합사회2'));
assert.deepEqual(uploads.map((u) => u.name), ['통합사회2_4교시-수업_2026-10-20_14-59-00.000_KST.webm', '통합사회2_4교시-수업_2026-10-20_14-59-00.000_KST_받아쓰기.md', '통합사회2_4교시-수업_2026-10-20_14-59-00.000_KST_복습정리.md']);
assert.equal(uploads[0].mime, 'audio/webm');
// 같은 id 다시 보내도 새로 처리하지 않음
assert.equal(ok.start(job('b1')).state, 'done'); assert.equal(uploads.length, 3);
// 결과 파일이 남아 있어 서버를 다시 켜도 확인 가능 (소리 데이터는 저장 안 함)
const saved = fs.readFileSync(path.join(dir, 'ok', job('b1').id + '.json'), 'utf8');
assert.ok(!saved.includes(audio));
const reopened = createVoice({}, path.join(dir, 'ok'), () => now);
assert.equal(reopened.status(job('b1').id).state, 'done');

// 2) 받아쓰기 실패 → 브라우저 받아쓰기로 정리, Drive 없음
const fb = createVoice({ stt: async () => { throw new Error('down'); }, hasAI: true, organize: async () => '정리됨', drive: () => null }, path.join(dir, 'fb'), () => now);
fb.start(job('c1', { text: '브라우저가 받아쓴 내용입니다. 광합성은 빛에너지를 이용한다.' }));
const r2 = await wait(fb, job('c1').id);
assert.deepEqual(r2.errors, ['stt']); assert.match(r2.result.transcript, /브라우저/); assert.equal(r2.result.summary, '정리됨'); assert.deepEqual(r2.result.files, []);

// 3) AI 없음 + Drive 일부 실패 → 받아쓰기만, 녹음은 저장
let n = 0;
const part = createVoice({ stt: async () => '짧지 않은 받아쓰기 내용이 여기 있습니다.', hasAI: false, drive: () => ({ upload: async (f, name) => { n++; if (/받아쓰기/.test(name)) throw new Error('quota'); return { id: 'okid' + n + 'xxxxxxxx' }; } }) }, path.join(dir, 'part'), () => now);
part.start(job('d1'));
const r3 = await wait(part, job('d1').id);
assert.equal(r3.result.summary, ''); assert.deepEqual(r3.errors, ['drive_note']); assert.deepEqual(r3.result.files.map((f) => f.role), ['audio']);

// 4) 너무 짧으면 정리 건너뜀
const short = createVoice({ stt: async () => '음', hasAI: true, organize: async () => { throw new Error('should not run'); } }, path.join(dir, 'short'), () => now);
short.start(job('e1'));
const r4 = await wait(short, job('e1').id);
assert.deepEqual(r4.errors, ['short']);

// 5) 잘못된 id 조회
assert.equal(ok.status('../etc/passwd'), null);
// 6) Drive 지우기: 공부방 폴더 안 + ID 일치만
const calls = [];
const drv = { trash: async (d, name, id) => { calls.push([d, name, id]); return id === 'idmismatch00' ? 'mismatch' : 'trashed'; } };
const t1 = await trashFiles(drv, '통합사회2', [{ id: 'abcdefghij12', name: 'a.webm' }, { id: 'idmismatch00', name: 'b.md' }, { id: 'zzzzzzzzzzzz', name: '../x' }]);
assert.deepEqual(t1.result, { abcdefghij12: 'trashed', idmismatch00: 'mismatch', zzzzzzzzzzzz: 'bad' });
assert.deepEqual(calls.map((c) => c[0]), ['승준 공부방/1분 복습 녹음/통합사회2', '승준 공부방/1분 복습 녹음/통합사회2']);
assert.equal((await trashFiles(null, 'x', [{}])).error, 'no_drive');
assert.equal((await trashFiles(drv, '', [{ id: 'abcdefghij12', name: 'a' }])).error, 'bad');
fs.rmSync(dir, { recursive: true, force: true });
console.log('PASS: voice pipeline — stt→summary→Drive(3 files, KST names, subject folder), idempotent retry, restart recovery without audio, stt fallback to browser text, no-AI/partial Drive, short skip, id validation, Drive trash only inside study folder with matching id');
