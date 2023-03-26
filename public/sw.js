const CACHE_NAME = "my-cache";

self.addEventListener("install", (event) => {
    console.log("%cinstalling service worker!", "color:orange;");
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.add("/").then(() => self.skipWaiting());
        })
    );
});

self.addEventListener("activate", (event) => {
    console.log("%cactivating service worker", "color:orange;");
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
    if (navigator.onLine) {
        const fetchRequest = event.request.clone();
        return fetch(fetchRequest).then((res) => {
            // skip caching if res is not ok
            if (
                !res ||
                res.status !== 200 ||
                res.type !== "basic" ||
                res.url.includes("chrome-extension")
            )
                return res;

            // cache response
            var responseToCache = res.clone();
            caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseToCache));

            return res;
        });
    } else {
        event.respondWith(
            caches.match(event.request).then((res) => {
                if (res) return res;
            })
        );
    }
});
