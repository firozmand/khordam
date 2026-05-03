const CACHE_VERSION = "v3";
const CACHE_NAME = `cheghadr-khordam-${CACHE_VERSION}`;
const APP_SHELL = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./food-bank.js",
    "./profile-defaults.js",
    "./manifest.json",
    "./favicon.svg",
    "./icons/icon-192.svg",
    "./icons/icon-512.svg",
    "./fonts/Vazirmatn-Regular.ttf",
    "./fonts/Vazirmatn-Medium.ttf",
    "./fonts/Vazirmatn-Bold.ttf"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    const requestUrl = new URL(event.request.url);
    const isSameOrigin = requestUrl.origin === self.location.origin;

    if (!isSameOrigin) {
        return;
    }

    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
                    return response;
                })
                .catch(() => caches.match("./index.html"))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) {
                return cached;
            }
            return fetch(event.request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    return response;
                })
                .catch(() => caches.match("./index.html"));
        })
    );
});
