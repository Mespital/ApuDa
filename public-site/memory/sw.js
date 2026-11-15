// ApuDa 기억돌봄 — 오프라인에서도 앱 화면이 열리도록 캐시
// 경로는 모두 이 파일 위치 기준(상대 경로)이라 memory.apuda.app 과 apuda.app/memory/ 어디서든 동작한다.
const CACHE = 'memorycare-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './favicon.png', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return; // 폰트 등 외부 요청은 브라우저에 맡김
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); return r; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
