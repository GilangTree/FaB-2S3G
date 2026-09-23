'use strict';
var CACHE_NAME = 'fab2s3g-v1';
var URLS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install — cache file utama
self.addEventListener('install', function(e){
  console.log('[SW] Install');
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(URLS).catch(function(err){
        console.log('[SW] Cache error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — hapus cache lama
self.addEventListener('activate', function(e){
  console.log('[SW] Activate');
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — cache first, fallback network
self.addEventListener('fetch', function(e){
  // Skip cross-origin (CDN tesseract dll)
  if(!e.request.url.startsWith(self.location.origin)){
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(response){
        // Cache response baru
        if(response&&response.status===200&&response.type==='basic'){
          var clone=response.clone();
          caches.open(CACHE_NAME).then(function(cache){
            cache.put(e.request,clone);
          });
        }
        return response;
      }).catch(function(){
        // Offline fallback
        return caches.match('./index.html');
      });
    })
  );
});