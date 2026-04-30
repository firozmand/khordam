const CACHE_NAME = "cheghadr-khordam-v1";

const ASSETS = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",
    "./icons/icon-192.svg",
    "./icons/icon-512.svg"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            }).catch(() => {
                if (event.request.mode === "navigate") {
                    return caches.match("./index.html");
                }
            });
        })
    );
});
