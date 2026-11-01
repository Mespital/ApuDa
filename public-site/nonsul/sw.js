const CACHE='apuda-nonsul-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/nonsul/offline.html','/nonsul/app-icon.svg'])));self.skipWaiting();});
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('apuda-nonsul-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(u.origin!==self.location.origin||!u.pathname.startsWith('/nonsul/')||u.pathname.startsWith('/nonsul/api/')||event.request.method!=='GET')return;if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>caches.match('/nonsul/offline.html')));});
