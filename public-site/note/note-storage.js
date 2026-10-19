/* ApuDa Note backup format and non-destructive restore. No network access. */
(function (global) {
  'use strict';
  var FORMAT = 'apuda.note.backup', VERSION = 2, MAX_BYTES = 16 * 1024 * 1024;
  var lists = ['roadmap','meds','logs','labs','questions','supports','distress'];
  function plain(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
  function safeTree(x, depth) {
    if (depth > 24) return false;
    if (x === null || typeof x === 'string' || typeof x === 'boolean') return true;
    if (typeof x === 'number') return isFinite(x);
    if (Array.isArray(x)) return x.length <= 50000 && x.every(function (v) { return safeTree(v, depth + 1); });
    if (!plain(x)) return false;
    return Object.keys(x).every(function (k) { return k !== '__proto__' && k !== 'constructor' && k !== 'prototype' && safeTree(x[k], depth + 1); });
  }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var d = new Date(value + 'T12:00:00Z');
    return isFinite(d.getTime()) && d.toISOString().slice(0,10) === value;
  }
  function validState(s) {
    if (!plain(s) || !plain(s.profile) || !Array.isArray(s.logs)) return false;
    // Older ApuDa exports may omit newer arrays, but must have a recognizable
    // care-note structure rather than accepting an arbitrary JSON object.
    if (!['roadmap','meds','questions','supports','distress'].some(function (k) { return Array.isArray(s[k]); })) return false;
    if (!safeTree(s, 0)) return false;
    if (['checks','meta','triage'].some(function (k) { return k in s && !plain(s[k]); })) return false;
    if (s.triage && (!Array.isArray(s.triage.items) || s.triage.items.some(function (x) { return typeof x !== 'string'; }))) return false;
    if (['devices','rxCombo','rxPlan'].some(function (k) { return k in s.profile && (!Array.isArray(s.profile[k]) || s.profile[k].some(function (v) { return typeof v !== 'string'; })); })) return false;
    var profileText = ['name','cancer','stage','treatment','goal','cycle','hospital','dayPhone','nightPhone','biomarkers','rxSince','regimen'];
    if (profileText.some(function (k) { return k in s.profile && s.profile[k] !== null && typeof s.profile[k] !== 'string'; })) return false;
    return lists.every(function (k) {
      if (!(k in s)) return true;
      return Array.isArray(s[k]) && s[k].every(function (row) {
        if(k==='supports'&&typeof row==='string')return row.length>0&&row.length<4096;
        if (!plain(row)) return false;
        if(['logs','labs','roadmap','distress'].indexOf(k)>=0&&!validDate(row.date))return false;
        if(k==='roadmap'&&typeof row.title!=='string')return false;
        if(k==='questions'&&typeof row.question!=='string')return false;
        if(k==='meds'&&typeof row.name!=='string')return false;
        if ('date' in row && !validDate(row.date)) return false;
        if ('id' in row && typeof row.id !== 'string' && typeof row.id !== 'number') return false;
        var text = ['title','name','text','note','memo','time','status'];
        if (text.some(function (field) { return field in row && row[field] !== null && typeof row[field] !== 'string'; })) return false;
        if (row.tempReadings && (!Array.isArray(row.tempReadings) || row.tempReadings.some(function (r) { return !plain(r) || !isFinite(Number(r.value)); }))) return false;
        return true;
      });
    });
  }
  function unpack(input) {
    var x = typeof input === 'string' ? JSON.parse(input) : input;
    if (!plain(x)) throw new Error('invalid-backup');
    var s = x;
    if ('state' in x) {
      var modern = x.format === FORMAT && x.schemaVersion === VERSION;
      var legacyDrive = !('format' in x) && x.schemaVersion === 1 && typeof x.appVersion === 'string';
      if (!modern && !legacyDrive) throw new Error('unsupported-backup-version');
      s = x.state;
    } else if ('format' in x || 'schemaVersion' in x) throw new Error('unsupported-backup-version');
    if (!validState(s)) throw new Error('invalid-backup');
    return JSON.parse(JSON.stringify(s));
  }
  function envelope(s) {
    if (!validState(s)) throw new Error('invalid-backup');
    return {format:FORMAT,schemaVersion:VERSION,appVersion:'3.1.0',exportedAt:new Date().toISOString(),state:JSON.parse(JSON.stringify(s))};
  }
  function summary(s) {
    var counts = {}, dates = [], total = 0;
    lists.forEach(function (k) { counts[k] = Array.isArray(s[k]) ? s[k].length : 0; total += counts[k]; (s[k] || []).forEach(function (r) { if (r.date) dates.push(r.date); }); });
    dates.sort();
    return {name:s.profile.name || '이름 미입력',cancer:s.profile.cancer || '암종 미입력',counts:counts,total:total,from:dates[0] || '',to:dates[dates.length-1] || '',empty:!total && !Object.keys(s.profile).some(function (k) { return !Array.isArray(s.profile[k]) && !!s.profile[k]; })};
  }
  function fingerprint(raw) {
    if (!global.crypto || !global.crypto.subtle) return Promise.reject(new Error('secure-context-required'));
    return global.crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)).then(function (buf) { return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2,'0'); }).join(''); });
  }
  function recoveryKey(key) { return key + '_before_restore_v2'; }
  async function replace(storage, key, s, reason) {
    if (!validState(s)) throw new Error('invalid-backup');
    var next = JSON.stringify(s), before = storage.getItem(key), afterHash = await fingerprint(next);
    if (storage.getItem(key) !== before) throw new Error('records-changed');
    // Never overwrite the current note unless the exact previous bytes have
    // been preserved and verified. Quota failures abort before the main write.
    var checkpoint = {format:'apuda.note.checkpoint',schemaVersion:1,savedAt:new Date().toISOString(),reason:reason || 'restore',before:before,afterHash:afterHash};
    var encoded = JSON.stringify(checkpoint);
    storage.setItem(recoveryKey(key),encoded);
    if (storage.getItem(recoveryKey(key)) !== encoded) throw new Error('checkpoint-not-saved');
    try {
      if (storage.getItem(key) !== before) throw new Error('records-changed');
      storage.setItem(key,next);
      if (storage.getItem(key) !== next) throw new Error('restore-not-saved');
    } catch (e) {
      if (storage.getItem(key) === next) { if (before === null) storage.removeItem(key); else storage.setItem(key,before); }
      throw e;
    }
    return summary(s);
  }
  function checkpoint(storage,key) {
    try { var c=JSON.parse(storage.getItem(recoveryKey(key))); return c && c.format==='apuda.note.checkpoint' && c.schemaVersion===1 && (c.before===null || typeof c.before==='string') && typeof c.afterHash==='string' ? c : null; } catch (e) { return null; }
  }
  async function recover(storage,key) {
    var c=checkpoint(storage,key); if (!c) throw new Error('no-checkpoint');
    var current=storage.getItem(key);
    if (await fingerprint(current || '') !== c.afterHash || storage.getItem(key)!==current) throw new Error('records-changed');
    if (c.before === null) storage.removeItem(key); else storage.setItem(key,c.before);
    storage.removeItem(recoveryKey(key));
    return true;
  }
  function createUndo() {
    var pending=null, sequence=0;
    return Object.freeze({
      invalidate:function(){pending=null;},
      arm:function(before,after){pending={before:before,after:after,token:String(++sequence)};return pending.token;},
      take:function(token,current,persisted){
        if(!pending||token!==pending.token||current!==pending.after||persisted!==pending.after)return null;
        var before=pending.before;pending=null;return before;
      }
    });
  }
  global.ApuDaNoteStorage=Object.freeze({MAX_BYTES:MAX_BYTES,validState:validState,unpack:unpack,envelope:envelope,summary:summary,replace:replace,checkpoint:checkpoint,recover:recover,recoveryKey:recoveryKey,createUndo:createUndo});
})(window);
