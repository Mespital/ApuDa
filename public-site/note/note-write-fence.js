/* ApuDa V3 legacy write fence — a BEST-EFFORT stale-tab warning, NOT atomic.
 * The guard does not lock localStorage, does not migrate records, and does not
 * access networks or Drive. A legacy tab not using this helper can still write.
 */
(function(global){
  'use strict';
  function write(storage,key,expected,next){
    if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')
      throw new Error('storage-unavailable');
    if(typeof key!=='string'||!key)throw new Error('invalid-key');
    if(expected!==null&&typeof expected!=='string')throw new Error('invalid-expected');
    if(typeof next!=='string')throw new Error('invalid-next');
    // This check and the subsequent setItem cannot be atomic across browser tabs.
    if(storage.getItem(key)!==expected)throw new Error('records-changed');
    storage.setItem(key,next);
    if(storage.getItem(key)!==next)throw new Error('not-saved');
    return next;
  }
  global.ApuDaNoteV3WriteFence=Object.freeze({write:write});
})(window);
