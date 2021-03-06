var cacheName = `v1`;
const staticAssets = [
    './',
    './script.js',
    './style.css'
  ];
  
  self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
      caches.open(cacheName)
        .then(res => {
          console.log('wait.........!')
          return res.addAll(staticAssets);
        })
    );
    console.log('installed');
    // var cache = caches.open('v1');
    // cache.addAll(staticAssets);
  });
  
  self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(keyList.map(function(key) {
                if (key !== cacheName) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    // return self.clients.claim();  
  });
  
  self.addEventListener('fetch', (ev) => {
    const req = ev.request;
    const url = new URL(req.url);
    if (url.origin === location.origin) {
      ev.respondWith(cacheFirst(req));
    }
    return ev.respondWith(networkFirst(req));
  });
  
  async function cacheFirst(req) {
    let cacheRes = await caches.match(req);
    return cacheRes || fetch(req);
  }
  
  async function networkFirst(req) {
    const dynamicCache = await caches.open(cacheName+'-dynamic');
    try {
      const networkResponse = await fetch(req);
      dynamicCache.put(req, networkResponse.clone());
      return networkResponse;
    } catch (err) {
      const cacheResponse = await caches.match(req);
      return cacheResponse;
    }
  }
  