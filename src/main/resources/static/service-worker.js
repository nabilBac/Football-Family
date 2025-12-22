
self.importScripts();


const CACHE_NAME = "goalclips-v1";

const urlsToCache = [
    "/",
    "/index.html",
    "/manifest.json",
    "/css/style.css",
    "/css/auth.css",
    "/css/navbar-common.css",
    "/app/js/router.js",
    "/app/js/auth.js",
    "/service-worker-register.js"
];

// INSTALL
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            cache.addAll(urlsToCache).catch(err => {
                console.warn("Erreur cache :", err);
            })
        )
    );
    self.skipWaiting();
});

// FETCH
self.addEventListener("fetch", event => {
    const req = event.request;

    // Ne pas intercepter l'API ni les POST
    if (req.method !== "GET" || req.url.includes("/api/")) return;

    event.respondWith(
        caches.match(req).then(cached => {
            return cached || fetch(req).catch(() => {
                if (req.mode === "navigate") {
                    return caches.match("/index.html");
                }
            });
        })
    );
});

// ACTIVATE
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null))
            )
        )
    );

    self.clients.claim();
});
