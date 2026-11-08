// cache só do app (os dados vêm sempre ao vivo do Firebase)
const C='led-v3';const F=['./','index.html','app.js','config.js','manifest.webmanifest','icon-192.png','logo-branco.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin)return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));});
