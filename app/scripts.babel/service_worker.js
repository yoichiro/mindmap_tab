"use strict";

const VERSION = 1;
const STATIC_CACHE_NAME = "static_" + VERSION;
const ORIGIN = location.protocol + "//" + location.hostname + (location.port ? ":" + location.port : "");
const STATIC_FILES = [
  ORIGIN + "/",
  ORIGIN + "/styles/newtab.css",
  ORIGIN + "/bower_components/bootstrap/dist/css/bootstrap.min.css",
  ORIGIN + "/bower_components/jquery/dist/jquery.min.js",
  ORIGIN + "/bower_components/jcanvas/jcanvas.js",
  ORIGIN + "/bower_components/bootstrap/dist/js/bootstrap.min.js",
  ORIGIN + "/bower_components/responsive-bootstrap-toolkit/dist/bootstrap-toolkit.min.js",
  ORIGIN + "/libs/ace/ace.js",
  ORIGIN + "/libs/firebase/firebase_5.0.4.js",
  ORIGIN + "/scripts/bundle.js"
];

self.addEventListener("install", event => {
  console.log("ServiceWorker.install()");
  if (!ORIGIN.startsWith("chrome-extension://")) {
    event.waitUntil(
      caches.open(STATIC_CACHE_NAME)
        .then(cache => {
          return cache.addAll(STATIC_FILES);
        })
    );
  }
});

self.addEventListener("fetch", event => {
  console.log("ServiceWorker.fetch()");
  event.respondWith(
    caches.match(event.request, {cacheName: STATIC_CACHE_NAME})
      .then(response => {
        if (response) {
          console.log(`Hit in the cache: ${event.request.url}`);
          return response;
        } else {
          console.log(`Not found in the cache: ${event.request.url}`);
          return fetch(event.request)
            .then(res => {
              return res;
            })
        }
      })
  );
});

self.addEventListener("activate", event => {
  console.log("ServiceWorker.activate()");
  event.waitUntil(
    caches.keys()
      .then(keys => {
        const promises = [];
        keys.forEach(cacheName => {
          if (cacheName !== STATIC_CACHE_NAME) {
            console.log(`Delete cache: ${cacheName}`);
            promises.push(caches.delete(cacheName));
          }
        });
        return Promise.all(promises);
      })
  );
});
