import {spawnSync} from 'node:child_process';import path from 'node:path';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const r=spawnSync(process.execPath,['--test','tests/csat-papers.test.mjs'],{cwd:root,encoding:'utf8',timeout:60000});if(r.status!==0)throw Error(r.stdout+r.stderr);
console.log('PASS: question-first archive, all 41 courses and 10 academic years, paired answers, CP949/UTF-8 ZIP decoding, CRC/decompression, source allowlist, streamed PDF, size/method/redirect/HTML guards.');
