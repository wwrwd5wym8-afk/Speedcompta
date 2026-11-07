/* SpeedCompta : fonctionnement hors connexion et mises à jour automatiques (version 20261107092557) */
const C = "sc-20261107092557";
self.addEventListener("install", e => { e.waitUntil(caches.open(C).then(c => c.addAll(["./", "index.html", "styles.css?v=20261107092557", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"]).catch(() => {})).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => { const r = e.request; if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r, { cache: "no-cache" }).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); } return res; }).catch(() => caches.match(r).then(m => m || caches.match("index.html")))); });
