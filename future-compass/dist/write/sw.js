// 써보다 서비스워커 — 오프라인에서도 앱 열기·쓰기 가능. API는 캐시하지 않는다.
const C = "ssuboda-v1.11.0";
const CORE = ["./", "index.html", "sets.js", "resources.js", "bg.js", "manifest.webmanifest", "icon.svg"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.pathname.includes("/api/")) return;
  if (u.origin === location.origin) {
    // 네트워크 우선 → 실패 시 캐시 (업데이트가 바로 반영되게)
    e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match("index.html"))));
  }
});
