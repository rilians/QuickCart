const CACHE_NAME = 'quickcart-v1';
const ICON_CACHE = 'icon-cache';

self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME),
            caches.open(ICON_CACHE)
        ])
    );
});

self.addEventListener('fetch', (event) => {
    // Handle icon requests
    if (event.request.url.includes('/assets/icons/')) {
        event.respondWith(
            caches.open(ICON_CACHE)
                .then(cache => cache.match(event.request))
                .then(response => response || fetch(event.request))
                .catch(() => {
                    // Return a default icon if needed
                    return new Response(
                        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
                        { headers: { 'Content-Type': 'image/png' } }
                    );
                })
        );
        return;
    }

    // Handle other requests
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
