// Service Worker - مطعم النخبة PWA
const CACHE_NAME = 'restaurant-pwa-v1';
const FILES_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './icon.svg'
];

// تثبيت Service Worker وتخزين الملفات
self.addEventListener('install', (event) => {
    console.log('✅ Service Worker: جاري التثبيت');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ Service Worker: جاري تخزين الملفات');
                return cache.addAll(FILES_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// تفعيل Service Worker وحذف الكاش القديم
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: جاري التفعيل');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: حذف كاش قديم', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// استراتيجية: الكاش الأول للملفات المحلية، الشبكة أول للصور الخارجية
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // للملفات المحلية (نفس الموقع)
    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    return response || fetch(event.request).then((response) => {
                        if (response.status === 200) {
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => cache.put(event.request, responseToCache));
                        }
                        return response;
                    });
                })
        );
    }
    // للصور الخارجية (Unsplash) - Cache First مع fallback للشبكة
    else if (event.request.destination === 'image') {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    return response || fetch(event.request).then((response) => {
                        if (response.status === 200) {
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => cache.put(event.request, responseToCache));
                        }
                        return response;
                    }).catch(() => {
                        // لو النت فاصل والصورة مش في الكاش، رجع placeholder
                        return new Response(
                            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="#1a1a1a" width="400" height="300"/><text x="200" y="150" fill="#666" font-size="20" text-anchor="middle" dy=".3em">🍽️</text></svg>',
                            { headers: { 'Content-Type': 'image/svg+xml' } }
                        );
                    });
                })
        );
    }
});
