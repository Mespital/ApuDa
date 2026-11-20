import archive from '../../dist/gichul/data/archive.json' with { type:'json' };
import { makePaperHandler } from '../lib/csat-papers-core.mjs';
export default makePaperHandler(archive.resources);
export const config={rateLimit:{action:'rate_limit',aggregateBy:['ip','domain'],windowSize:60,windowLimit:120}};
