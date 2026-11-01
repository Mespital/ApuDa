import assert from 'node:assert/strict';
import { lessons } from '../lib/lessons.ts';
import { newNotebook, notebookSchema, personalScenario, weekStats, newEntry, charCount } from '../lib/notebook.ts';
assert.equal(lessons.length,12);
assert.equal(new Set(lessons.map(l=>l.id)).size,12);
for(const lesson of lessons){
  assert(lesson.min<=lesson.max);
  assert.equal(lesson.outline.length,3);
  assert.equal(lesson.hints.length,3);
  for(const concept of lesson.concepts)assert(lesson.passages.find(p=>p.label===concept.passage)?.text.includes(concept.quote),`${lesson.id}: source quote mismatch`);
  assert(charCount(lesson.example)>=lesson.min&&charCount(lesson.example)<=lesson.max,`${lesson.id}: example length ${charCount(lesson.example)} outside ${lesson.min}-${lesson.max}`);
}
const data=newNotebook();assert(notebookSchema.safeParse(data).success);
assert.equal(data.profile.name,'학습자');assert.equal(data.profile.major,'');
assert.equal(personalScenario(data.exam).status,'missing');
data.exam.grades.국어='2';data.exam.grades.영어='2';
assert.equal(personalScenario(data.exam).status,'met');
data.exam.grades.영어='3';assert.equal(personalScenario(data.exam).status,'unmet');
data.exam.subjects=['국어','국어'];assert.equal(personalScenario(data.exam).status,'missing');
data.exam.subjects=['영어','통합사회'];data.exam.grades.통합사회='1';assert.equal(personalScenario(data.exam).sum,4);
assert.equal(charCount('가 나\n다'),4);
assert.equal(notebookSchema.safeParse({...data,entries:{l99:newEntry()}}).success,false);
const boundary=newNotebook();boundary.entries.l01={...newEntry(),history:[{answer:'이전 주 답안',kind:'initial',at:'2026-11-01T14:59:59.000Z'}]};boundary.entries.l02={...newEntry(),history:[{answer:'새로운 주 답안',kind:'initial',at:'2026-11-01T15:00:00.000Z'}]};
assert.equal(weekStats(boundary,new Date('2026-11-01T15:00:00.000Z')).sessions,1);
console.log('PASS: 12 lesson references, example lengths, notebook validation, scenario edge cases, Korean week boundary.');
