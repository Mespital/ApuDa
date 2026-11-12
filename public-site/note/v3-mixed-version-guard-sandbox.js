/* DEV-ONLY pure comparison of synthetic legacy/new notebook branches.
 * NO browser storage access, no uploads, no deletion and NO production wiring.
 * This guard cannot stop previously opened legacy tabs from writing.
 */
(function(global){
  'use strict';
  var KEY='synthetic-only';
  function raw(v){if(v!==null&&typeof v!=='string')throw new Error('raw-string-or-null-required');return v;}
  function make(baselineLegacy,baselineNew){
    return Object.freeze({kind:'apuda-v3-mixed-synthetic',key:KEY,
      baselineLegacy:raw(baselineLegacy),baselineNew:raw(baselineNew)});
  }
  function inspect(session,observedLegacy,observedNew){
    if(!session||session.kind!=='apuda-v3-mixed-synthetic'||session.key!==KEY)
      throw new Error('synthetic-session-required');
    raw(observedLegacy);raw(observedNew);
    var legacyChanged=observedLegacy!==session.baselineLegacy;
    var newChanged=observedNew!==session.baselineNew;
    var reason=legacyChanged&&newChanged?'both-branches-changed':
      legacyChanged?'legacy-branch-changed':newChanged?'new-branch-changed':'no-drift-observed';
    // Snapshot copies are intentionally returned unchanged, including invalid
    // older text: investigators must be able to export both before deciding.
    var branches=Object.freeze({legacy:observedLegacy,newer:observedNew});
    return Object.freeze({status:legacyChanged||newChanged?'manual-review':'snapshot-stable',
      reason:reason,legacyChanged:legacyChanged,newChanged:newChanged,
      allowAutomaticMigration:false,allowAutomaticBackupUpload:false,
      allowAutomaticDrivePrune:false,requireLegacyTabExit:true,branches:branches});
  }
  global.ApuDaV3MixedVersionGuardSandbox=Object.freeze({make:make,inspect:inspect,key:KEY});
})(typeof window!=='undefined'?window:globalThis);
