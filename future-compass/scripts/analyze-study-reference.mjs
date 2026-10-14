// Inspect only the selected reference's public shipped JavaScript. No login,
// application execution, remote state changes or third-party script downloads.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const origin = 'https://web.mystudylife.com/';
const outputFlag = process.argv.indexOf('--output');
const output = outputFlag >= 0 && process.argv[outputFlag + 1] ? path.resolve(process.argv[outputFlag + 1]) : fs.mkdtempSync(path.join(os.tmpdir(), 'rea-reference-'));
fs.mkdirSync(output, { recursive: true });
const artifact = path.join(output, 'public-bundle');
fs.mkdirSync(artifact, { recursive: true });
const files = [];
async function capture(relative) {
  const url = new URL(relative, origin);
  if (url.origin !== new URL(origin).origin || !/^[a-zA-Z0-9_./-]+\.js$/.test(relative) || relative.split('/').includes('..')) throw Error('Reference origin/path is outside the selected scope');
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(25000) });
  if (!response.ok) throw Error('Public capture failed: ' + response.status + ' ' + relative);
  const limit = 20 * 1024 * 1024, parts = []; let bytes = 0;
  for await (const part of response.body) { bytes += part.length; if (bytes > limit) throw Error('Reference size limit exceeded'); parts.push(part); }
  const data = Buffer.concat(parts), file = path.join(artifact, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data);
  files.push({ file: relative, url: url.href, bytes, sha256: createHash('sha256').update(data).digest('hex') });
  return data.toString('utf8');
}
const summary = { reference: origin, rea_version: '6.4.0', captured_at: new Date().toISOString(), status: 'blocked', files, evidence_ids: [], observations: {}, limitations: ['Static analysis of public shipped files only; authenticated UI and server behavior are not observed.'] };
try {
  const bootstrap = await capture('flutter_bootstrap.js');
  const main = [...new Set([...bootstrap.matchAll(/mainJsPath[\s"']*:[\s"']*([^"',}\s]+)/g)].map(x => x[1]))];
  if (!main.length) throw Error('Published bootstrap did not declare a JavaScript entry');
  for (const name of main) await capture(name);
  await capture('app.js');
  const full = path.join(output, 'analysis-private.json'), fd = fs.openSync(full, 'w');
  const run = spawnSync('npx', ['--yes', 'rea-agents@6.4.0', 'analyze-javascript-application', artifact, '--max-heap-mb', '1024', '--analysis-timeout-ms', '60000', '--format', 'json', '--full-output'], { stdio: ['ignore', fd, 'inherit'], timeout: 220000 });
  fs.closeSync(fd); summary.exit_code = run.status;
  if (run.error) throw run.error;
  if (fs.statSync(full).size > 64 * 1024 * 1024) throw Error('Full result exceeds summary-reader size limit');
  const envelope = JSON.parse(fs.readFileSync(full, 'utf8')), data = envelope.data || envelope;
  const failed = !!data.error || run.status !== 0;
  summary.status = failed ? data.details?.partial_observation ? 'partial' : 'blocked' : 'completed';
  if (failed) { summary.error_code = data.code || ''; summary.error_message = data.message || data.error || 'Analysis did not complete'; }
  const ids = new Set();
  function walk(value, prefix = '', depth = 0) {
    if (!value || typeof value !== 'object' || depth > 16) return;
    for (const [key, item] of Object.entries(value)) {
      const at = prefix ? prefix + '.' + key : key;
      if (typeof item === 'string' && /^ev_[a-f0-9]{64}$/.test(item)) ids.add(item);
      if (['modules', 'sources', 'files', 'nodes', 'edges', 'unknowns', 'limitations', 'findings'].includes(key) && Array.isArray(item)) summary.observations[at + '_count'] = item.length;
      if (key === 'coverage' && item && typeof item === 'object') {
        const fields = Object.fromEntries(Object.entries(item).filter(([, v]) => typeof v === 'boolean' || typeof v === 'number' || typeof v === 'string' && v.length <= 100));
        if (Object.keys(fields).length) summary.observations[at] = fields;
      }
      if (key === 'status' && typeof item === 'string' && item.length < 80) summary.observations[at] = item;
      if (!Array.isArray(item)) walk(item, at, depth + 1);
    }
  }
  walk(data); summary.evidence_ids = [...ids];
} catch (error) { summary.error_message = String(error.message || error).slice(0, 2000); }
fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
if (summary.status === 'blocked') process.exitCode = 1;
