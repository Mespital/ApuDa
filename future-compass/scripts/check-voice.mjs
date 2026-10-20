// 🎙️ VPS 녹음 자동 처리(live/voice.mjs) 검사 — 받아쓰기·정리·Drive 단계와 실패 시 이어가기
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { createVoice, validVoice, baseName, folderOf, trashFiles, rcloneClient } from '../live/voice.mjs';
const md5 = b => createHash('md5').update(b).digest('hex');
const sha256 = b => createHash('sha256').update(b).digest('hex');
const receipt = (name, data, id = 'fixturedrive123456') => ({ id, parentId: 'fixturefolder12345', name, size: data.length, md5: md5(data) });

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
  drive: () => ({ upload: async (folder, name, data, mime) => { uploads.push({ folder, name, mime, size: data.length }); return receipt(name, data, 'drv' + uploads.length + 'abcdefghij'); } })
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
assert.equal(r1.outcome, 'succeeded');
assert.equal(r1.result.files[0].sha256, sha256(Buffer.from('fake-opus-bytes')));
assert.equal(r1.result.files[0].parentId, 'fixturefolder12345');
assert.equal(ok.start(job('b1', { text: 'different source' })).error, 'conflict');
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
assert.deepEqual(r2.errors, ['stt', 'drive_unavailable']); assert.match(r2.result.transcript, /브라우저/); assert.equal(r2.result.summary, '정리됨'); assert.deepEqual(r2.result.files, []); assert.equal(r2.outcome, 'partial');

// 3) AI 없음 + Drive 일부 실패 → 받아쓰기만, 녹음은 저장
let n = 0;
const part = createVoice({ stt: async () => '짧지 않은 받아쓰기 내용이 여기 있습니다.', hasAI: false, drive: () => ({ upload: async (f, name, data) => { n++; if (/받아쓰기/.test(name)) throw new Error('quota'); return receipt(name, data, 'okid' + n + 'xxxxxxxx'); } }) }, path.join(dir, 'part'), () => now);
part.start(job('d1'));
const r3 = await wait(part, job('d1').id);
assert.equal(r3.result.summary, ''); assert.deepEqual(r3.errors, ['drive_note', 'summary_unavailable']); assert.deepEqual(r3.result.files.map((f) => f.role), ['audio']);

// 4) 너무 짧으면 정리 건너뜀
const short = createVoice({ stt: async () => '음', hasAI: true, organize: async () => { throw new Error('should not run'); } }, path.join(dir, 'short'), () => now);
short.start(job('e1'));
const r4 = await wait(short, job('e1').id);
assert.deepEqual(r4.errors, ['short', 'drive_unavailable']);

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

// Failed pipeline must be distinguishable from successful termination.
const failed = createVoice({ stt: async () => { throw Error('offline'); }, hasAI: true, drive: { upload: async () => { throw Error('offline'); } } }, path.join(dir, 'failed'), () => now);
failed.start(job('f1')); const failure = await wait(failed, job('f1').id);
assert.equal(failure.outcome, 'failed'); assert.equal(failure.result.summary, ''); assert.deepEqual(failure.result.files, []);

// Metadata from Drive must match; a valid id alone proves nothing.
const mismatch = createVoice({ stt: async () => '확인할 수 있는 충분한 받아쓰기 내용입니다.', hasAI: true, organize: async () => '정리 내용', drive: { upload: async () => ({ id: 'validfile123456', parentId: 'validfolder12345', size: 1, name: 'wrong.txt', md5: '0'.repeat(32) }) } }, path.join(dir, 'mismatch'), () => now);
mismatch.start(job('f2')); const wrong = await wait(mismatch, job('f2').id);
assert.notEqual(wrong.outcome, 'succeeded'); assert.deepEqual(wrong.result.files, []); assert.ok(wrong.errors.includes('drive_audio'));

// A persisted unfinished task is interrupted after restart, and explicit resend resumes.
const restartDir = path.join(dir, 'restart'), engines = [];
const interrupted = createVoice({ stt: () => new Promise(() => {}), hasAI: false }, restartDir, () => now); engines.push(interrupted);
interrupted.start(job('f3')); await new Promise(r => setTimeout(r, 5));
assert.equal(JSON.parse(fs.readFileSync(path.join(restartDir, job('f3').id + '.json'))).state, 'working');
let resumed = 0;
const resume = createVoice({ stt: async () => { resumed++; return '다시 시작한 뒤 받아쓰기 결과를 돌려줍니다.'; }, hasAI: false }, restartDir, () => now); engines.push(resume);
assert.equal(resume.status(job('f3').id).state, 'interrupted'); assert.equal(resume.pending(), 0);
assert.equal(resume.start(job('f3')).state, 'interrupted');
resume.start(job('f3', { retry: true })); await wait(resume, job('f3').id); assert.equal(resumed, 1);
assert.ok(!fs.readFileSync(path.join(restartDir, job('f3').id + '.json'), 'utf8').includes(audio));

// Expiration is enforced on reads and cleanup, without a new upload.
let later = now;
const expiry = createVoice({ stt: async () => '만료 검사에 사용하는 합성 받아쓰기 내용입니다.', hasAI: false }, path.join(dir, 'expiry'), () => later); engines.push(expiry);
expiry.start(job('f4')); await wait(expiry, job('f4').id);
later = now + 48 * 3600000 - 1; assert.ok(expiry.status(job('f4').id));
later++; assert.equal(expiry.status(job('f4').id), null); assert.ok(!fs.existsSync(path.join(dir, 'expiry', job('f4').id + '.json')));
later = now; expiry.start(job('f5')); await wait(expiry, job('f5').id); later += 49 * 3600000; expiry.cleanup();
assert.ok(!fs.existsSync(path.join(dir, 'expiry', job('f5').id + '.json')));

// Exercise the actual rclone client against an isolated HTTP RC contract fixture.
const remote = new Map([['study', { ID: 'parentfolder123456', IsDir: true, Name: 'study' }]]);
let writes = 0, tamper = false;
const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://fixture'), chunks = []; for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks); let answer = {};
    if (u.pathname === '/operations/stat') {
      const b = JSON.parse(body); assert.equal(b.opt.showHash, true); assert.deepEqual(b.opt.hashTypes, ['MD5']); answer.item = remote.get(b.remote) || null;
    } else if (u.pathname === '/operations/uploadfile') {
      const form = await new Request('http://fixture', { method: 'POST', headers: req.headers, body }).formData(), f = form.get('file0'), bytes = Buffer.from(await f.arrayBuffer());
      writes++; remote.set(u.searchParams.get('remote') + '/' + f.name, { ID: 'remotefile' + writes + '123456', Name: f.name, Size: bytes.length, IsDir: false, Hashes: { MD5: tamper ? '0'.repeat(32) : md5(bytes) } });
    } else assert.equal(u.pathname, '/operations/mkdir');
    res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(answer));
  } catch (e) { res.writeHead(500, { 'content-type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
try {
  const client = rcloneClient('http://127.0.0.1:' + server.address().port), bytes = Buffer.from('actual upload body');
  const first = await client.upload('study', 'a.webm', bytes, 'audio/webm');
  assert.equal(first.size, bytes.length); assert.equal(first.md5, md5(bytes)); assert.equal(first.parentId, 'parentfolder123456');
  assert.equal((await client.upload('study', 'a.webm', bytes, 'audio/webm')).id, first.id); assert.equal(writes, 1);
  await assert.rejects(client.upload('study', 'a.webm', Buffer.from('changed'), 'audio/webm'), /drive_readback/); assert.equal(writes, 1);
  tamper = true; await assert.rejects(client.upload('study', 'b.webm', bytes, 'audio/webm'), /drive_readback/);
} finally { await new Promise(r => server.close(r)); }
for (const e of [ok, reopened, fb, part, short, failed, mismatch, ...engines]) e.close();
fs.rmSync(dir, { recursive: true, force: true });
console.log('PASS: voice pipeline and RC HTTP — success/partial/failure, verified name/size/MD5/folder + SHA256 receipt, duplicate-safe resend, restart interruption/resume, fingerprint conflict, 48h read/cleanup expiration, original audio absent from persisted jobs, scoped Drive trash.');
