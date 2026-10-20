import { getStore } from '@netlify/blobs';
import { cleanup, STORE } from '../lib/study-handoff-core.mjs';
export default async () => Response.json(await cleanup(getStore({ name: STORE, consistency: 'strong' })));
export const config = { schedule: '17 * * * *' };
