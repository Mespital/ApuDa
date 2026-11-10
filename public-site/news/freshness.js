// Static, dependency-free date check. A report is complete at 09:00 KST;
// allow an additional hour for the daily 09:03 collection/publication cycle.
(function (root) {
  'use strict';
  function status(reportDate, nowMillis = Date.now()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(reportDate || ''))) {
      return { valid: false, stale: true, ageDays: null };
    }
    const completeMillis = Date.parse(reportDate + 'T09:00:00+09:00');
    const elapsed = Number(nowMillis) - completeMillis;
    if (!Number.isFinite(completeMillis) || !Number.isFinite(elapsed) || elapsed < -86400000) {
      return { valid: false, stale: true, ageDays: null };
    }
    return {
      valid: true,
      stale: elapsed > 25 * 3600000,
      ageDays: Math.max(0, Math.floor(elapsed / 86400000))
    };
  }
  root.ApuDaNewsFreshness = { status };
  if (typeof module !== 'undefined' && module.exports) module.exports = { status };
})(typeof window !== 'undefined' ? window : globalThis);
