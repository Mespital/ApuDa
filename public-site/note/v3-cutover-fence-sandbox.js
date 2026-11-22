/* ApuDa V3 cutover fence — SYNTHETIC TESTS ONLY.
 * Never reads/writes browser storage, a patient's data, or Google Drive.
 * This is not a lock: old tabs that do not cooperate can still write.
 */
(function (global) {
  'use strict';
  const TAG = 'apuda.synthetic.v3.cutover-fence.v1';
  const FIELDS = ['note', 'chat', 'checkpoint'];
  const hasOwn = (o,k) => Object.prototype.hasOwnProperty.call(o,k);

  function snapshot(values) {
    if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error('snapshot-required');
    const out = {};
    for (const key of FIELDS) {
      if (!hasOwn(values,key)) throw new Error('missing-'+key);
      const v=values[key];
      if (v!==null && typeof v!=='string') throw new Error('invalid-'+key);
      out[key] = v;
    }
    return Object.freeze(out);
  }
  function start(legacy,target) {
    return Object.freeze({tag:TAG, legacy:snapshot(legacy),target:snapshot(target)});
  }
  function classify(a,b) {
    const changed = FIELDS.filter(k=>a[k]!==b[k]);
    return Object.freeze({changed:changed.length>0, fields:Object.freeze(changed)});
  }
  function safeGate(v) {
    return v===true;
  }
  function assess(session, state) {
    if (!session || session.tag!==TAG) throw new Error('synthetic-session-required');
    if (!state || typeof state!=='object') throw new Error('state-required');
    const observedLegacy=snapshot(state.legacy);
    const observedTarget=snapshot(state.target);
    const l=classify(session.legacy,observedLegacy);
    const n=classify(session.target,observedTarget);
    const reasons=[];
    if (l.changed) reasons.push('legacy-drift');
    if (n.changed) reasons.push('target-drift');
    if (!safeGate(state.legacyTabsClosed)) reasons.push('legacy-tabs-unverified');
    if (!safeGate(state.serviceWorkerVersionVerified)) reasons.push('stale-cache-unverified');
    if (!safeGate(state.pendingDriveJobsCleared)) reasons.push('drive-queue-unverified');
    if (!safeGate(state.independentBackupVerified)) reasons.push('independent-backup-unverified');
    if (!safeGate(state.userReviewedBothBranches)) reasons.push('human-review-required');
    // Prototype does not control legacy runtime: never authorize production writes.
    const reason=reasons.length?reasons[0]:'prototype-not-integrated';
    return Object.freeze({
      status:'blocked', reason, blockers:Object.freeze(reasons),
      legacyDrift:l, targetDrift:n,
      allowAutomaticMigration:false, allowLegacyOverwrite:false,
      allowDriveUpload:false, allowDrivePrune:false,
      allowLegacyCleanup:false, allowProductionWrites:false,
      requireIndependentExport:true, requireManualResolution:true
    });
  }
  global.ApuDaV3CutoverFenceSandbox=Object.freeze({start,assess});
})(typeof window !== 'undefined' ? window : globalThis);
