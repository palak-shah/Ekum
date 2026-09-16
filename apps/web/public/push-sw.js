/* eslint-disable no-undef */
// Imported into the generated Workbox service worker (see vite.config.ts).
// Renders web-push payloads and focuses/opens the app on click.

self.addEventListener('push', (event) => {
  let payload = { title: 'Ekum', body: '', type: '', url: '/' };
  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    payload.body = event.data ? event.data.text() : '';
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Ekum', {
      body: payload.body || undefined,
      tag: payload.type || undefined,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: { url: payload.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          if ('navigate' in client && typeof client.navigate === 'function') {
            return client.navigate(targetUrl).then((navigated) => (navigated || client).focus());
          }
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    }),
  );
});
