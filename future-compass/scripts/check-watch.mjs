// ⌚ 워치 연동(live/watch.mjs) 검사 — 키(해시만 저장), 방금 끝난 수업 고르기, 말머리 과목
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createWatch, splitSubject } from '../live/watch.mjs';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'watch-'));
let now = Date.parse('2026-10-21T06:20:00Z'); // 수 15:20 KST
const W = createWatch(dir, () => now);
const key = 'c'.repeat(40);
assert.equal(W.setKey('short'), false); assert.equal(W.setKey(key), true);
assert.ok(!fs.readFileSync(path.join(dir, 'watch.json'), 'utf8').includes(key), 'key not stored in plain text');
assert.equal(W.check(key), true); assert.equal(W.check('d'.repeat(40)), false); assert.equal(W.check(''), false);
const row = ['공통국어2', '통합사회2', '통합과학2', '공통영어2', '체육', '공통수학2'];
W.setTable(Array(5).fill(row), ['08:20', '09:20', '10:20', '11:20', '13:10', '14:10', '15:10'], 50);
assert.deepEqual(W.subjectAt(Date.parse('2026-10-21T06:20:00Z')), { sub: '공통수학2', p: 6 });   // 15:20 → 6교시(15:00 끝) 방금 끝남
assert.deepEqual(W.subjectAt(Date.parse('2026-10-21T01:35:00Z')), { sub: '통합사회2', p: 2 });   // 10:35 → 2교시 끝(10:10) 우선
assert.deepEqual(W.subjectAt(Date.parse('2026-10-21T04:20:00Z')), { sub: '공통영어2', p: 4 });   // 13:20 → 5교시 체육은 건너뜀
assert.deepEqual(W.subjectAt(Date.parse('2026-10-21T12:00:00Z')), { sub: '', p: 0 });           // 21:00
assert.deepEqual(W.subjectAt(Date.parse('2026-10-24T01:35:00Z')), { sub: '', p: 0 });           // 토요일
assert.ok(!W.subjects().includes('체육'));
assert.deepEqual(splitSubject('수학, 함수의 뜻', W.subjects()), { subject: '공통수학2', text: '함수의 뜻' });
assert.deepEqual(splitSubject('사회 인권', W.subjects()), { subject: '통합사회2', text: '인권' });
assert.equal(splitSubject('오늘은 그냥', W.subjects()).subject, '');
W.ack(['a'.repeat(32), 'bad']); assert.equal(W.acked('a'.repeat(32)), true); assert.equal(W.acked('bad'), false);
const again = createWatch(dir, () => now); assert.equal(again.check(key), true);
W.clearKey(); assert.equal(W.check(key), false);
fs.rmSync(dir, { recursive: true, force: true });
console.log('PASS: watch link — hashed key, just-ended lesson by KST timetable (skips PE, weekend/evening none), spoken subject prefix, ack, persistence');
