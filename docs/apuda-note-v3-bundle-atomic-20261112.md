# V3 synthetic atomic bundle (note + chat), 2026-11-12

Integration branch only: `integration/apuda-note-v3-v4-20261112`, Draft PR #304.

`v3-unified-contract-sandbox.js` now exposes `saveBundle(db, expected, nextNote, nextChat, injectAbort)`. Both exact raw V3 JSON strings must validate **before** opening one IndexedDB readwrite transaction. One shared revision is checked against the expected note and chat snapshot, and a single row is written with both fields. Committing either field alone in a bundle is not supported. Any invalid raw content fails before the transaction; injected abort rolls back both; stale revision returns conflict.

`v3-synthetic-async-port.js` now exposes `saveBundle(noteRaw,chatRaw,config)`. On conflict, write failure or post-write confirmation mismatch it freezes additional writes and captures **both attempted raw strings** in memory as review-only data, rather than retaining only one side. Export is not normal ApuDa backup and is unencrypted if manually downloaded.

## CI
New local-only Chromium test `tools/tests/apuda-note-v3-bundle-browser.py` verifies 20 scenarios:
- initial two-field commit, exact source bytes, shared revision, unmapped fields
- two simultaneous IndexedDB transactions: one winner/one conflict, never mixed fields
- transaction abort rolls back both note and chat
- malformed note or chat rejects whole bundle
- stale second client retains both attempted original strings, freezes additional writes and preserves winner
- production/Drive flags remain false, and all synthetic test databases are deleted

The existing 220 V3 browser assertions and the 30 V4/integration assertions are still run separately.

**BLOCKED FOR PRODUCTION**: the module accepts only a synthetic IndexedDB database name, is not called by the actual V3 `note-app.js`, cannot constrain old V3 localStorage tabs, and does not migrate real patient records or call Drive. P0 remains OPEN; main merge and production deploy require a separate release gate, full mobile+Drive tests, verified independent backup and user-reviewed cutover.
