const CACHE_NAME = "peter-dons-pizza-v5";
const APP_SHELL = ["./", "index.html", "styles.css?v=5", "script.js?v=5", "manifest.json", "assets/peter-dons-logo.png", "assets/peter-dons-pizza-menu.jpeg", "images/pizza_PNG43991.png", "images/pngtree-pizza-isolated-on-transparent-background-png-image_14844508.png", "images/pizza-png-15.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)); return response; }).catch(() => caches.match("index.html"))));
});
