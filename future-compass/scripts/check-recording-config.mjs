import assert from 'node:assert/strict';
import config from '../netlify/functions/recording-config.mjs';
const keys = ['GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_API_KEY', 'GOOGLE_DRIVE_PROJECT_NUMBER', 'GOOGLE_DRIVE_CLIENT_SECRET', 'GOOGLE_DRIVE_REFRESH_TOKEN'];
const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
try {
  keys.forEach(key => delete process.env[key]);
  assert.equal((await (await config()).json()).configured, false);
  Object.assign(process.env, { GOOGLE_DRIVE_CLIENT_ID: 'public-client', GOOGLE_DRIVE_API_KEY: 'public-key', GOOGLE_DRIVE_PROJECT_NUMBER: '123456', GOOGLE_DRIVE_CLIENT_SECRET: 'DO_NOT_EXPOSE_SECRET', GOOGLE_DRIVE_REFRESH_TOKEN: 'DO_NOT_EXPOSE_TOKEN' });
  const response = await config(), text = await response.text(), body = JSON.parse(text);
  assert.equal(body.configured, true);
  assert.deepEqual(Object.keys(body).sort(), ['apiKey', 'appId', 'clientId', 'configured']);
  assert.ok(!text.includes('DO_NOT_EXPOSE'));
  assert.equal(response.headers.get('cache-control'), 'no-store');
  console.log('PASS: unconfigured state, public credentials only, no secret/refresh-token exposure, and no-store response');
} finally {
  keys.forEach(key => { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; });
}
