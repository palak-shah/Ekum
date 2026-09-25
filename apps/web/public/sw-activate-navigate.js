/* eslint-disable no-undef */
// After a new worker activates, reload open Safari / Home Screen clients.
// Prompt-mode waiting kept the old worker in charge of every refresh.

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(function () {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    }).then(function (windows) {
      return Promise.all(
        windows.map(function (client) {
          if (client && typeof client.navigate === 'function') {
            return client.navigate(client.url);
          }
          return undefined;
        }),
      );
    }),
  );
});
