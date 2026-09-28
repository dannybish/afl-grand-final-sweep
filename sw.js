// Minimal service worker: caches the app shell so the installed PWA opens
// instantly and works offline for the shell itself. Firebase/Firestore
// network calls are always passed straight through (never cached), since
// the sweep is inherently a live, shared, multi-device experience.
var CACHE = "afl-sweep-shell-v3";
var SHELL = ["./", "./index.html", "./manifest.json", "./qrcode.js"];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var url = event.request.url;
  if (
    url.indexOf("firestore.googleapis.com") !== -1 ||
    url.indexOf("googleapis.com") !== -1 ||
    url.indexOf("gstatic.com") !== -1 ||
    url.indexOf("google.com") !== -1
  ) {
    return; // let these go straight to the network, untouched
  }
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request).catch(function () {
        return caches.match("./index.html");
      });
    })
  );
});
