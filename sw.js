/* Time Capsule — service worker
   Its only jobs: stay registered, show incoming pushes, and focus the app on tap. */

const APP_URL = './';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (err) {
    data = { title: 'Time Capsule', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Time Capsule';
  const options = {
    body: data.body || '',
    icon: data.icon || 'icon-192.png',
    badge: data.badge || 'icon-192.png',
    tag: data.tag || 'tc-message',       // same tag replaces, so no notification spam
    renotify: true,
    data: { url: data.url || APP_URL },
    vibrate: [90, 40, 90],
  };

  // Skip the banner if the app is already open and focused — the message is on screen.
  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const focused = clientList.some((c) => c.visibilityState === 'visible' && c.focused);
    if (focused) return;
    return self.registration.showNotification(title, options);
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || APP_URL;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // if the app is already open somewhere, just bring it forward
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
