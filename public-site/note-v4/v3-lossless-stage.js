/* ApuDa V3 archival stage for an eventual V4 migration.
 * Pure, explicit-input API. Never reads or writes local/session storage.
 * No upload, auto-import, UI integration, or V3 key replacement.
 */
(function (global) {
  'use strict';
  var FORMAT = 'apuda.note.v3.archival-stage', VERSION = 1;

  function services() {
    var v = global.ApuDaNoteStorage, audit = global.ApuDaV3Compatibility;
    if (!v || !v.unpack || !Number.isInteger(v.MAX_BYTES) || !audit || !audit.inspect)
      throw new Error('v3-validation-services-required');
    if (!global.crypto || !global.crypto.subtle || typeof TextEncoder === 'undefined')
      throw new Error('secure-sha256-required');
    return {validator:v, audit:audit};
  }

  function encoded(raw) { return new TextEncoder().encode(raw); }
  function hex(bytes) {
    return Array.from(new Uint8Array(bytes)).map(function (n) {
      return n.toString(16).padStart(2,'0');
    }).join('');
  }
  async function fingerprint(bytes) {
    return hex(await global.crypto.subtle.digest('SHA-256',bytes));
  }
  function equalCounts(a,b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  async function stage(input) {
    var svc = services();
    var raw = typeof input === 'string' ? input : JSON.stringify(input);
    if (typeof raw !== 'string') throw new Error('invalid-v3-json');
    var bytes = encoded(raw);
    if (bytes.byteLength > svc.validator.MAX_BYTES) throw new Error('backup-too-large');
    var audit = svc.audit.inspect(raw); // validates V3 and clones the input
    var checksum = await fingerprint(bytes);
    return {
      format:FORMAT,
      schemaVersion:VERSION,
      status:'archived-not-migrated',
      original:{raw:raw,sha256:checksum,bytes:bytes.byteLength},
      audit:{counts:audit.counts,issueCodes:audit.issues.map(function (x) { return x.code; }),
        outsideBackupScope:audit.outsideBackupScope},
      // A V4 reader must NEVER interpret this envelope as a V4 patient record.
      readyForV4:false
    };
  }

  async function verify(archive) {
    var svc=services();
    if (!archive || archive.format!==FORMAT || archive.schemaVersion!==VERSION ||
        archive.status!=='archived-not-migrated' || archive.readyForV4!==false ||
        !archive.original || typeof archive.original.raw!=='string' ||
        typeof archive.original.sha256!=='string' || typeof archive.original.bytes!=='number')
      throw new Error('invalid-archival-stage');
    var bytes=encoded(archive.original.raw);
    if (bytes.byteLength>svc.validator.MAX_BYTES || bytes.byteLength!==archive.original.bytes)
      throw new Error('archive-size-mismatch');
    if (await fingerprint(bytes)!==archive.original.sha256) throw new Error('archive-hash-mismatch');
    var audit=svc.audit.inspect(archive.original.raw);
    if (!archive.audit || !equalCounts(archive.audit.counts,audit.counts) ||
        !equalCounts(archive.audit.issueCodes,audit.issues.map(function (x) { return x.code; })) ||
        !equalCounts(archive.audit.outsideBackupScope,audit.outsideBackupScope))
      throw new Error('archive-audit-mismatch');
    return {valid:true,byteLength:bytes.byteLength,sha256:archive.original.sha256,
      status:'archived-not-migrated',readyForV4:false};
  }

  async function originalJSON(archive) {
    await verify(archive);
    return archive.original.raw; // exact original UTF-8 text, if input was text
  }

  global.ApuDaV3LosslessStage=Object.freeze({stage:stage,verify:verify,originalJSON:originalJSON});
})(typeof window!=='undefined' ? window : globalThis);
