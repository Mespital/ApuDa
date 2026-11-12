/* ApuDa V3 unsaved draft vault — in-memory only, no server or browser storage.
 * Development proposal. All files are unencrypted; never auto-restore a draft.
 */
(function(global){
  'use strict';
  var FORMAT='apuda.note.unsaved-review',MAX_ITEMS=8,MAX_TOTAL_BYTES=32*1024*1024;
  var items=[],total=0;
  function size(s){return new TextEncoder().encode(s).length;}
  function capture(kind,raw,errorCode){
    if(kind!=='note'&&kind!=='chat')throw new Error('invalid-draft-kind');
    if(typeof raw!=='string')throw new Error('raw-string-required');
    var last=items[items.length-1];
    if(last&&last.kind===kind&&last.raw===raw)return true;
    var bytes=size(raw);
    if(bytes>16*1024*1024||items.length>=MAX_ITEMS||total+bytes>MAX_TOTAL_BYTES)return false;
    var reason=errorCode==='records-changed'?'conflict':
      errorCode==='not-saved'?'write-not-confirmed':'write-failed';
    items.push(Object.freeze({kind:kind,raw:raw,bytes:bytes,reason:reason,at:new Date().toISOString()}));
    total+=bytes;
    return true;
  }
  function count(){return items.length;}
  function exportText(){
    if(!items.length)throw new Error('no-unsaved-draft');
    // Intentionally incompatible with normal ApuDa backup import: review required.
    return JSON.stringify({format:FORMAT,schemaVersion:1,reviewOnly:true,
      warning:'UNENCRYPTED. Not an automatic ApuDa restore file.',
      items:items.map(function(i){return {kind:i.kind,raw:i.raw,reason:i.reason,at:i.at,bytes:i.bytes};})},null,2);
  }
  global.ApuDaNoteUnsavedDraft=Object.freeze({capture:capture,count:count,exportText:exportText});
})(window);
