# ApuDa V3 + V4 integration validation

Date: 2026-11-12 KST. Branch: `integration/apuda-note-v3-v4-20261112`.
Merged-source development snapshot (NOT operational main):
- Production `main` at integration base: `58a7dc1590f02557680d90f599ea6c30e9eb1bdd`.
- PR #292 head: `48fb3abe283648a466e6e6453b6d0f841f52e971` (54 new V4 sandbox/test/docs files).
- PR #294 head: `2315c91c77389cad02870782c40e8d5d37eb22f7` (53 modified/added V3 safety/test/docs files).
- Two real merge commits on the integration branch, with both feature heads as explicit second parents. `main` untouched.
- Reconciled `public-site/note/index.html` preserving `main`'s **robots=noindex** and PR #294's record-protection/scripts.
- All unrelated `main` changes, including student/essay assets, preserved from the parent tree.

## New independent check
`tools/tests/apuda-note-v3-v4-integration-browser.py` loads actual V3 app in a fresh localhost-only Chromium profile with **synthetic note/chat records**, then runs V4 handoff lab under the SAME local origin, and finally reloads V3:
- V3 synthetic profile and chat original bytes must remain unchanged.
- V4 isolated lab must pass **15/15** and delete synthetic IndexedDB databases.
- V3 must remain loadable; both sections must be `noindex`.
- Block all non-localhost network requests and all service workers. Never use real Google Drive/production domain.
- Test has 15 independent assertions, run through `.github/workflows/apuda-v3-v4-handoff.yml` in Draft PR CI.
- Existing V3 220 browser assertions and V4 handoff 15 assertions also remain part of the same integrated branch.

## Release blocker
This is **shadow integration**, not live migration. Existing V3 still uses non-atomic localStorage; old cached tabs and Drive backups can bypass new guards, and note/chat/restore/delete are not committed in a shared transaction in production V3. The synthetic V4 contract's `readyForProduction=false` and `allowActivation=false` remain in effect.

**P0 OPEN — keep Draft, do not merge integrated PR into main or deploy production until release gates pass.** No patient/student/Drive data accessed or altered; clinical/patient human review not performed.
