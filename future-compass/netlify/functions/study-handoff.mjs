import { getStore } from '@netlify/blobs';
import { makeHandler, STORE } from '../lib/study-handoff-core.mjs';
export default makeHandler(() => getStore({ name: STORE, consistency: 'strong' }));
export const config = { rateLimit: { action: 'rate_limit', aggregateBy: ['ip', 'domain'], windowSize: 60, windowLimit: 120 } };
