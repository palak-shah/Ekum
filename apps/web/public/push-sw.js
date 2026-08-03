/* eslint-disable no-undef */
// Imported into the generated Workbox service worker (see vite.config.ts).
// Renders web-push payloads and focuses/opens the app on click.

self.addEventListener('push', (event) => {
  let payload = { title: 'Ekum', body: '', type: '' };
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
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((client) => 'focus' in client);
      if (existing) {
        return existing.focus();
      }
      return clients.openWindow('/');
    }),
  );
});
