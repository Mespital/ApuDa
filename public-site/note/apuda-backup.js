/* =========================================================================
 * ApuDa 암 치료 동행 — 구글 드라이브 백업 (v2.0)
 * -------------------------------------------------------------------------
 *  · localStorage['apuda_cancer_care_v1'] 가 진실의 원천. 여기선 사본만 다룬다.
 *  · 아프다 서버 없음. 사용자 기기 ↔ 사용자 본인 구글 드라이브뿐.
 *  · 저장 위치는 appDataFolder(앱 전용 영역), 권한 범위는 drive.appdata 하나.
 *  · 로그인은 선택. 미로그인이어도 앱 기능은 전부 그대로 동작한다.
 * ========================================================================= */
(function () {
  'use strict';

  const CLIENT_ID   = '1063564162160-pahbcbb7dchc5namn15cif6h5rpb6o3j.apps.googleusercontent.com';
  const SCOPE       = 'https://www.googleapis.com/auth/drive.appdata';
  const KEY         = 'apuda_cancer_care_v1';
  const META_KEY    = 'apuda_backup_meta';
  const BANNER_KEY  = 'apuda_backup_banner_hidden';
  const APP_VERSION = '2.0.0';
  const KEEP        = 7;
  const DEBOUNCE_MS = 60 * 1000;
  const MIN_GAP_MS  = 24 * 3600e3;

  let tokenClient = null, accessToken = null, tokenExpiry = 0;
  let debounceTimer = null, pendingOffline = false, busy = false;

  const meta = {
    get() { try { return JSON.parse(localStorage.getItem(META_KEY) || '{}'); } catch { return {}; } },
    set(patch) {
      localStorage.setItem(META_KEY, JSON.stringify(Object.assign(this.get(), patch)));
      render();
    }
  };

  function fmtTime(ts) {
    if (!ts) return '없음';
    const d = new Date(ts), p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}. ${p(d.getMonth() + 1)}. ${p(d.getDate())}. ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function toast(msg, kind) {
    let el = document.getElementById('ab-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'ab-toast';
      el.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:96px;z-index:9999;' +
        'max-width:88vw;padding:13px 18px;border-radius:12px;font-size:15px;line-height:1.5;color:#fff;' +
        'box-shadow:0 8px 28px rgba(0,0,0,.28);transition:opacity .3s;opacity:0;pointer-events:none';
      document.body.appendChild(el);
    }
    el.style.background = kind === 'error' ? '#b3261e' : '#1f2a37';
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = '0'; }, 3400);
  }

  /* ------------------------------------------------ 스냅샷 / 검증 ------ */
  function currentState() {
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
  }

  function hasRecords(s) {
    if (!s || typeof s !== 'object') return false;
    const arrs = ['roadmap', 'meds', 'logs', 'labs', 'questions', 'supports', 'distress'];
    if (arrs.some((k) => Array.isArray(s[k]) && s[k].length)) return true;
    if (s.profile && Object.values(s.profile).some((v) => String(v || '').trim())) return true;
    return false;
  }

  function isValidState(s) {
    return !!window.ApuDaNoteStorage && window.ApuDaNoteStorage.validState(s);
  }
  function makeEnvelope(s) { return window.ApuDaNoteStorage.envelope(s); }
  function unwrap(obj) { return window.ApuDaNoteStorage.unpack(obj); }

  /* ------------------------------------------------------- 인증 ------- */
  function ensureClient() {
    if (tokenClient) return true;
    if (!window.google || !google.accounts || !google.accounts.oauth2) return false;
    tokenClient = google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: SCOPE, callback: () => {} });
    return true;
  }

  function getToken(interactive) {
    return new Promise((resolve, reject) => {
      if (accessToken && Date.now() < tokenExpiry - 60000) return resolve(accessToken);
      if (!ensureClient()) return reject(new Error('gis-not-ready'));
      tokenClient.callback = (res) => {
        if (res && res.access_token) {
          accessToken = res.access_token;
          tokenExpiry = Date.now() + Number(res.expires_in || 3600) * 1000;
          meta.set({ connected: true, needsReauth: false });
          resolve(accessToken);
        } else reject(new Error((res && res.error) || 'no-token'));
      };
      tokenClient.error_callback = (e) => reject(new Error((e && e.type) || 'token-error'));
      try { tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : '' }); }
      catch (e) { reject(e); }
    });
  }

  function signOut() {
    if (accessToken && window.google && google.accounts.oauth2) {
      try { google.accounts.oauth2.revoke(accessToken); } catch {}
    }
    accessToken = null; tokenExpiry = 0;
    meta.set({ connected: false });
    toast('구글 연결만 해제했습니다. 기기 기록과 기존 드라이브 사본은 그대로 남습니다.');
  }

  /* --------------------------------------------------- Drive API ------ */
  async function api(path, opts = {}) {
    const token = await getToken(false);
    const res = await fetch('https://www.googleapis.com/' + path, Object.assign({}, opts, {
      headers: Object.assign({ Authorization: 'Bearer ' + token }, opts.headers || {})
    }));
    if (res.status === 401) { accessToken = null; throw new Error('unauthorized'); }
    if (!res.ok) throw new Error('drive-' + res.status);
    return res.status === 204 ? null : res.json();
  }

  async function listBackups() {
    // Drive 목록은 여러 페이지일 수 있다. 다른 appData 파일은 건드리지 않는다.
    const files = [], seenTokens = new Set();
    let pageToken = '';
    do {
      const query = new URLSearchParams({
        spaces: 'appDataFolder', orderBy: 'createdTime desc',
        pageSize: '100', fields: 'nextPageToken,files(id,name,createdTime)'
      });
      if (pageToken) query.set('pageToken', pageToken);
      const out = await api('drive/v3/files?' + query.toString());
      for (const file of (out.files || [])) {
        if (file && typeof file.id === 'string' &&
            typeof file.name === 'string' &&
            /^apuda-backup-.*\.json$/.test(file.name)) files.push(file);
      }
      pageToken = String(out.nextPageToken || '');
      if (pageToken && seenTokens.has(pageToken)) throw new Error('drive-pagination-loop');
      if (pageToken) seenTokens.add(pageToken);
    } while (pageToken);
    return files;
  }

  async function uploadBackup() {
    const s = currentState();
    if (!isValidState(s) || !hasRecords(s)) return null;   // 빈 상태·손상 상태는 올리지 않는다

    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    const name = `apuda-backup-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`;
    const boundary = 'apuda' + Math.random().toString(36).slice(2);
    const body =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify({ name, parents: ['appDataFolder'] }) +
      `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(makeEnvelope(s)) +
      `\r\n--${boundary}--`;

    const created = await api('upload/drive/v3/files?uploadType=multipart&fields=id,name,createdTime', {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/related; boundary=' + boundary },
      body
    });
    if (!created || !created.id) throw new Error('backup-not-confirmed');
    meta.set({ lastBackupAt: Date.now(), lastError: null });
    prune();
    return created;
  }

  async function prune() {
    try {
      const files = await listBackups();
      for (const f of files.slice(KEEP)) await api('drive/v3/files/' + f.id, { method: 'DELETE' });
    } catch {}
  }

  let restoring = false;
  async function restore(fileId) {
    if (restoring) throw new Error('restore-in-progress');
    if (!window.ApuDaNoteStorage || typeof window.confirmNoteRestore !== 'function') throw new Error('storage-not-ready');
    restoring = true;
    const before = localStorage.getItem(KEY);
    try {
      const token = await getToken(false);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (!res.ok) throw new Error('download-failed');
      const text = await res.text();
      if (new TextEncoder().encode(text).byteLength > window.ApuDaNoteStorage.MAX_BYTES) throw new Error('too-large');
      const s = unwrap(JSON.parse(text));
      if (!isValidState(s)) throw new Error('invalid-backup');
      if (localStorage.getItem(KEY) !== before) throw new Error('records-changed');
      if (!window.confirmNoteRestore(s, '선택한 드라이브 백업')) return false;
      // A failed safety upload must abort; it must never be silently ignored.
      if (hasRecords(currentState())) {
        const copy = await uploadBackup();
        if (!copy || !copy.id) throw new Error('safety-backup-failed');
      }
      if (localStorage.getItem(KEY) !== before) throw new Error('records-changed');
      await window.ApuDaNoteStorage.replace(localStorage, KEY, s, 'drive');
      toast('복원했습니다. 설정에서 복원 직전 기록으로 되돌릴 수 있습니다.');
      setTimeout(() => location.reload(), 900);
      return true;
    } finally { restoring = false; }
  }

  async function deleteAll() {
    for (const f of await listBackups()) await api('drive/v3/files/' + f.id, { method: 'DELETE' });
    meta.set({ lastBackupAt: null });
    toast('드라이브의 백업을 모두 삭제했습니다.');
  }

  /* --------------------------------------------------- 트리거 -------- */
  async function runBackup(reason) {
    if (busy || !meta.get().connected) return;
    if (!navigator.onLine) { pendingOffline = true; return; }
    busy = true;
    try {
      const r = await uploadBackup();
      if (reason === 'manual') toast(r ? '백업했습니다.' : '아직 저장할 기록이 없습니다.');
    } catch (e) {
      const m = String(e.message);
      if (m === 'unauthorized' || m === 'no-token' || m === 'gis-not-ready') meta.set({ needsReauth: true });
      else if (reason === 'manual') toast('백업하지 못했습니다. 잠시 후 다시 시도해 주세요.', 'error');
      meta.set({ lastError: m });
    } finally { busy = false; }
  }

  function schedule() { clearTimeout(debounceTimer); debounceTimer = setTimeout(() => runBackup('auto'), DEBOUNCE_MS); }

  /* 앱 코드를 고치지 않고 저장 시점을 감지한다 */
  (function hook() {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      const r = set.apply(this, arguments);
      if (this === localStorage && k === KEY) schedule();
      return r;
    };
  })();

  addEventListener('online', () => { if (pendingOffline) { pendingOffline = false; runBackup('auto'); } });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { clearTimeout(debounceTimer); runBackup('auto'); }
  });

  /* ------------------------------------------------------- UI -------- */
  const CSS = `
  .ab-card{border:1px solid rgba(20,40,80,.12);border-radius:16px;padding:16px;margin:12px 0;background:#fff}
  .ab-h{font-weight:800;font-size:16px;margin:0 0 4px}
  .ab-sub{opacity:.7;font-size:13px;margin:0}
  .ab-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
  .ab-btn{flex:1 1 auto;min-height:46px;padding:11px 14px;border-radius:12px;font-size:15px;cursor:pointer;
          border:1px solid rgba(20,40,80,.18);background:#fff;color:#16263f}
  .ab-btn.primary{background:#c9a227;border-color:#c9a227;color:#1a1a1a;font-weight:800}
  .ab-btn.danger{color:#b3261e;border-color:rgba(179,38,30,.4)}
  .ab-note{font-size:13px;opacity:.72;margin-top:10px;line-height:1.6}
  .ab-mask{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:10000;display:flex;align-items:center;
           justify-content:center;padding:20px}
  .ab-modal{background:#fff;color:#16263f;max-width:430px;width:100%;max-height:78vh;overflow:auto;
            border-radius:18px;padding:22px;font-size:15px;line-height:1.65}
  .ab-item{width:100%;text-align:left;padding:14px;margin:8px 0;border-radius:12px;font-size:15px;cursor:pointer;
           border:1px solid rgba(20,40,80,.18);background:#fff;color:#16263f}
  .ab-banner{border:1px solid rgba(201,162,39,.55);background:rgba(201,162,39,.08);border-radius:16px;
             padding:14px 16px;margin:14px 0;font-size:14px;line-height:1.6}`;

  function css() {
    if (document.getElementById('ab-css')) return;
    const s = document.createElement('style'); s.id = 'ab-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function modal(html) {
    const m = document.createElement('div');
    m.className = 'ab-mask';
    m.innerHTML = `<div class="ab-modal">${html}</div>`;
    m.addEventListener('click', (e) => { if (e.target === m) m.remove(); });
    document.body.appendChild(m);
    return m;
  }

  function render() {
    const host = document.getElementById('apuda-backup-panel');
    if (!host) return;
    css();
    const m = meta.get();
    host.innerHTML = `<div class="ab-card">
      <p class="ab-h">구글 드라이브 백업</p>
      <p class="ab-sub">${m.connected ? '연결됨' : '연결 안 됨'} · 마지막 백업 ${fmtTime(m.lastBackupAt)}</p>
      <div class="ab-row">${m.connected
        ? `<button class="ab-btn primary" data-ab="backup">지금 백업</button>
           <button class="ab-btn" data-ab="list">백업 목록 · 복원</button>`
        : `<button class="ab-btn primary" data-ab="connect">구글 계정 연결</button>`}</div>
      ${m.connected ? `<div class="ab-row">
        <button class="ab-btn" data-ab="disconnect">연결 해제</button>
        <button class="ab-btn danger" data-ab="wipe">드라이브 백업 전체 삭제</button></div>` : ''}
      <p class="ab-note">구글 연결은 선택 사항입니다. 연결하면 현재 기록을 바로 백업하고,
      이후 기록 변경 시에도 본인 Google Drive의 앱 전용 저장 영역에 자동 백업합니다.
      <strong>백업에는 이름·암종·약·증상 등 건강정보가 추가 암호화 없이 JSON 형태로 저장됩니다.</strong>
      이 백업 기능은 기록을 아프다 서버로 보내지 않습니다. 연결 해제나 기기 기록 삭제만으로 드라이브 사본은 삭제되지 않으며,
      드라이브 사본은 별도로 삭제해야 합니다.</p></div>`;
  }

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-ab]'); if (!b) return;
    const act = b.dataset.ab;
    if (act === 'connect' || act === 'banner-go') {
      const consent = window.confirm(
        'Google Drive 건강정보 백업에 동의하시겠습니까?\n\n' +
        '이름·암종·치료·약·증상 등 기록이 본인 Google Drive의 앱 전용 영역에 JSON 파일로 저장됩니다. ' +
        '앱 자체의 추가 암호화는 적용되지 않습니다.\n\n' +
        '연결하면 즉시 백업하고 이후 기록 변경 시에도 자동으로 백업합니다. ' +
        '연결 해제나 기기 기록 삭제만으로 Drive 사본이 삭제되지는 않습니다.\n\n' +
        '계속하려면 확인을 누르세요.'
      );
      if (!consent) return;
      try {
        await getToken(true);
        const banner = document.getElementById('ab-banner'); if (banner) banner.remove();
        await runBackup('manual'); await offerRestore();
      } catch { toast('연결하지 못했습니다.', 'error'); }
    }
    if (act === 'backup') await runBackup('manual');
    if (act === 'disconnect') signOut();
    if (act === 'list') await showList();
    if (act === 'banner-close') {
      localStorage.setItem(BANNER_KEY, String(Date.now()));
      const banner = document.getElementById('ab-banner'); if (banner) banner.remove();
    }
    if (act === 'wipe') {
      const mk = modal(`<p class="ab-h">드라이브 백업을 모두 삭제할까요?</p>
        <p style="margin:6px 0 16px">기기에 있는 기록은 지워지지 않습니다. 드라이브의 백업 사본만 삭제됩니다.</p>
        <button class="ab-btn danger" data-ab="wipe-yes">삭제</button>
        <button class="ab-btn" data-ab="close">취소</button>`);
      mk.addEventListener('click', async (ev) => {
        const a = ev.target.dataset.ab;
        if (a === 'wipe-yes') { mk.remove(); try { await deleteAll(); } catch { toast('삭제하지 못했습니다.', 'error'); } }
        if (a === 'close') mk.remove();
      });
    }
  });

  async function showList() {
    let files = [];
    try { files = await listBackups(); } catch { toast('목록을 불러오지 못했습니다.', 'error'); return; }
    if (!files.length) { toast('저장된 백업이 없습니다.'); return; }
    const items = files.map((f) => `<button class="ab-item" data-restore="${f.id.replace(/[^A-Za-z0-9_-]/g, '')}">${fmtTime(new Date(f.createdTime).getTime())}</button>`).join('');
    const mk = modal(`<p class="ab-h">복원할 시점을 고르세요</p>
      <p style="margin:6px 0 14px;opacity:.75">복원하면 이 기기의 기록이 선택한 시점으로 바뀝니다.
      내용을 한 번 더 확인한 뒤 바꿉니다. 직전 기록의 안전 사본을 저장하지 못하면 복원을 중단합니다.</p>${items}
      <button class="ab-btn" data-ab="close-list" style="margin-top:10px">닫기</button>`);
    mk.addEventListener('click', async (ev) => {
      const t = ev.target.closest('[data-restore]');
      if (t) { mk.remove(); try { await restore(t.dataset.restore); } catch { toast('백업 확인 또는 안전 사본 저장에 실패해 복원하지 않았습니다. 현재 기록을 확인해 주세요.', 'error'); } }
      if (ev.target.dataset.ab === 'close-list') mk.remove();
    });
  }

  async function offerRestore() {
    if (hasRecords(currentState())) return;
    let files = [];
    try { files = await listBackups(); } catch { return; }
    if (!files.length) return;
    const n = files[0];
    const mk = modal(`<p class="ab-h">이전 기록을 찾았습니다</p>
      <p style="margin:6px 0 16px">${fmtTime(new Date(n.createdTime).getTime())}에 저장된 백업이 있습니다. 복원할까요?</p>
      <button class="ab-btn primary" data-ab="do-restore">복원하기</button>
      <button class="ab-btn" data-ab="skip">나중에</button>`);
    mk.addEventListener('click', async (ev) => {
      const a = ev.target.dataset.ab;
      if (a === 'do-restore') { mk.remove(); try { await restore(n.id); } catch { toast('안전하게 복원하지 못했습니다. 현재 기록을 확인해 주세요.', 'error'); } }
      if (a === 'skip') mk.remove();
    });
  }

  function maybeBanner() {
    const slot = document.getElementById('apuda-backup-banner-slot');
    if (!slot || meta.get().connected) return;
    const hidden = Number(localStorage.getItem(BANNER_KEY) || 0);
    if (hidden && Date.now() - hidden < 30 * 24 * 3600e3) return;
    if (!hasRecords(currentState())) return;
    css();
    slot.innerHTML = `<div class="ab-banner" id="ab-banner">
      <b>폰을 바꿔도 기록을 지키세요</b><br>
      내 구글 드라이브에 백업하면 새 기기에서 복원할 수 있어요. 건강정보는 추가 암호화 없이 저장되며 연결 후 자동 백업됩니다.
      <div class="ab-row">
        <button class="ab-btn primary" data-ab="banner-go">구글 드라이브에 백업</button>
        <button class="ab-btn" data-ab="banner-close">나중에</button>
      </div></div>`;
  }

  function boot() {
    css(); render(); maybeBanner();
    const m = meta.get();
    if (m.connected) {
      getToken(false)
        .then(() => { if (!m.lastBackupAt || Date.now() - m.lastBackupAt > MIN_GAP_MS) runBackup('auto'); })
        .catch(() => meta.set({ needsReauth: true }));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.ApudaBackup = { runBackup, listBackups, restore, deleteAll, render, maybeBanner };
})();
