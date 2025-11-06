// service-worker.js

const CACHE_NAME = 'vidsync-cache-v3';

// ⚠️ Liste des ressources statiques à mettre en cache
const urlsToCache = [
    '/', 
    '/profile',
    '/css/style.css',
    '/js/main.js',
    '/manifest.json',
    '/service-worker-register.js',
    '/assets/icons/icon-48.png',
    '/assets/icons/icon-72.png',
    '/assets/icons/icon-96.png',
    '/assets/icons/icon-144.png',
    '/assets/icons/icon-192.png',
    '/assets/icons/icon-512.png'
];

// Étape 1 : Installation
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Cache ouvert, ajout des ressources statiques...');
            return cache.addAll(urlsToCache);
        })
    );
});

// Étape 2 : Fetch
self.addEventListener('fetch', event => {
    const requestUrl = new URL(event.request.url);

    // Ne jamais mettre en cache les endpoints sensibles
    const sensitivePaths = ['/login', '/register', '/logout'];
    if (sensitivePaths.includes(requestUrl.pathname) 
        || requestUrl.pathname.startsWith('/api/') 
        || event.request.method !== 'GET') {
        return; // passe directement par le réseau
    }

    // Sinon, répondre depuis le cache si disponible
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

// Étape 3 : Activation
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => 
            Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            )
        )
    );
});
