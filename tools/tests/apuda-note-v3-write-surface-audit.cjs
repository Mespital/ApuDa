/* Read-only V3 persistence-surface inventory. No browser/user storage access.
 * Run against a complete checkout (default), or --partial for a source subset.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../public-site');
const partial=process.argv.includes('--partial');
const modules=[
  {name:'note/note-app.js',checks:[
    ['health-state-write',/localStorage\.setItem\(KEY\s*,/g,1],
    ['chat-history-write',/localStorage\.setItem\(CHAT_KEY\s*,/g,1],
    ['font-preference-write',/localStorage\.setItem\(FONT_KEY\s*,/g,1],
    ['nudge-write',/localStorage\.setItem\('apuda_note_nudge'\s*,/g,1],
    ['health-record-delete',/localStorage\.removeItem\(KEY\)/g,1],
    ['chat-history-delete',/localStorage\.removeItem\(CHAT_KEY\)/g,1],
    ['recovery-checkpoint-delete',/localStorage\.removeItem\(NOTE_STORAGE\.recoveryKey\(KEY\)\)/g,1],
    ['corrupt-record-delete',/localStorage\.removeItem\(KEY\+'_corrupt'\)/g,1],
    ['external-record-event-only',/if\(e\.key===KEY\)/g,1],
    ['V3-file-restore',/NOTE_STORAGE\.replace\(localStorage\s*,\s*KEY\s*,/g,1],
    ['V3-recover',/NOTE_STORAGE\.recover\(localStorage\s*,\s*KEY\)/g,1]
  ]},
  {name:'note/note-storage.js',checks:[
    ['checkpoint-write',/storage\.setItem\(recovery\s*,/g,1],
    ['record-write',/storage\.setItem\(key\s*,/g,1],
    ['record-delete',/storage\.removeItem\(key\)/g,1],
    ['checkpoint-delete',/storage\.removeItem\(recovery\)/g,1]
  ]},
  {name:'note/apuda-backup.js',checks:[
    ['backup-metadata-write',/localStorage\.setItem\(META_KEY\s*,/g,1],
    ['banner-preference-write',/localStorage\.setItem\(BANNER_KEY\s*,/g,1],
    ['global-storage-write-hook',/Storage\.prototype\.setItem\s*=/g,1],
    ['Drive-restore-path',/ApuDaNoteStorage\.replace\(localStorage\s*,\s*KEY\s*,/g,1],
    ['Drive-backup-prune',/files\.slice\(KEEP\)/g,1],
    ['Drive-DELETE',/method:\s*'DELETE'/g,2]
  ]},
  {name:'assets/apuda-bot.js',checks:[
    ['handoff-session-write',/sessionStorage\.setItem\('apuda_note_handoff_v1'/g,1]
  ]},
  {name:'note/sw.js',checks:[
    ['service-worker-cache-version',/const CACHE=/g,1],
    ['service-worker-fallback',/caches\.match\(/g,1]
  ]}
];
const all=[],missing=[],fail=[];
for(const mod of modules){
  const target=path.join(root,mod.name);
  if(!fs.existsSync(target)){missing.push(mod.name);continue;}
  const src=fs.readFileSync(target,'utf8');
  for(const [id,re,minimum] of mod.checks){
    const lines=[];let m;
    while((m=re.exec(src))!==null){lines.push(src.slice(0,m.index).split('\n').length);if(!m[0].length)re.lastIndex++;}
    const result={file:mod.name,id,count:lines.length,lines};
    all.push(result);
    if(lines.length<minimum)fail.push(result);
  }
}
const app=fs.readFileSync(path.join(root,'note/note-app.js'),'utf8');
assert.match(app,/var KEY='apuda_cancer_care_v1'/,'expected V3 state key');
assert.match(app,/var chat=\[\]/,'expected chat-history variable');
assert.doesNotMatch(app,/ApuDaV3AtomicOpsSandbox/,'experimental IDB module must remain disconnected');
const report={status:fail.length?'FAIL':missing.length?'PARTIAL':'BASELINE_FOUND',
  inspected:modules.length-missing.length,totalModules:modules.length,
  surfaces:all,missing,failed:fail.map(x=>x.id),
  unresolved:[
    'P0 legacy localStorage record writes and backup restore have no atomic cross-tab arbitration',
    'chat history and other side keys do not share the health-record storage listener',
    'Google Drive hook and pruning must be frozen during any future staged cutover',
    'old service-worker cached tabs may keep running legacy JavaScript'
  ]};
console.log(JSON.stringify(report,null,2));
if(fail.length||(!partial&&missing.length))process.exitCode=1;
