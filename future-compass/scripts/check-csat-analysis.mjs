import {spawnSync} from 'node:child_process';import path from 'node:path';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..'),r=spawnSync(process.execPath,['--test','tests/csat-analysis.test.mjs'],{cwd:root,encoding:'utf8',timeout:60000});if(r.status!==0)throw Error(r.stdout+r.stderr);
console.log('PASS: 450 official English classifications, source/page positions, type changes, correct denominators/year matrix, 10-question math sample, all 41 course taxonomies, latest unassisted original deduplication, parent-safe read-only analytics and empty/failure states.');
