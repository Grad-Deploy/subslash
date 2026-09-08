/**
 * Minimal service worker.
 *
 * This exists to make the app installable, not to speed anything up: Android
 * only offers a PWA in its share sheet once the app is installed, and Chrome
 * only offers to install an app that still renders something offline. That is
 * what makes the `share_target` in manifest.json reachable.
 *
 * It deliberately caches nothing but the offline fallback. Subscription data
 * lives in localStorage, the pages are a few kilobytes, and a cached app shell
 * would mostly buy the chance of serving a stale build after a deploy.
 */

const CACHE = "subslash-offline-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // `cache: "reload"` so a reinstall never precaches an HTTP-cached copy of
      // the previous build's offline page.
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  // Only page navigations get a fallback. Everything else goes straight to the
  // network, so a deploy is never masked by a stale asset we held on to.
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE);
      const offline = await cache.match(OFFLINE_URL);
      return offline ?? Response.error();
    }),
  );
});
