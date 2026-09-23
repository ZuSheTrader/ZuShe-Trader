// ZuShé Trader service worker.
// Required for navigator.serviceWorker.register('/sw.js') to succeed, and
// for the Push API subscription (reg.pushManager.subscribe(...)) to have
// somewhere to deliver messages to. Must be served from the site root
// (same folder as the app's index.html) — a service worker can only
// control the scope it is served from, so if it isn't reachable at
// /sw.js on your deployed origin, registration will keep failing even
// once the app is on real hosting.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// push-send (the edge function) sends: {title, body, url, category}
self.addEventListener('push', (event) => {
  let data = { title: 'ZuShé Trader', body: '', url: '/', category: '' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (_e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: undefined,
    badge: undefined,
    data: { url: data.url || '/' },
    tag: data.category || undefined,
    renotify: !!data.category
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Tapping the notification focuses an already-open tab if there is one,
// otherwise opens a new one at the URL the push payload pointed to.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const raw = (event.notification.data && event.notification.data.url) || '';
  // Resolve against this SW's own scope (e.g. https://user.github.io/repo/)
  // rather than the domain root, so it still lands on the app under a
  // GitHub Pages project subpath instead of 404ing or opening the wrong site.
  const targetUrl = new URL(raw && raw !== '/' ? raw : '.', self.registration.scope).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
