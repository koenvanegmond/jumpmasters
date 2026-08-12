/* Service worker voor Jump Masters.
   Vangt binnenkomende meldingen op en opent de juiste pagina bij een tik. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { titel: 'Jump Masters', tekst: event.data ? event.data.text() : '' };
  }

  const titel = data.titel || 'Jump Masters';
  const opties = {
    body: data.tekst || '',
    icon: '/logo-full.png',
    badge: '/logo-full.png',
    data: { pad: data.pad || '/' },
    // Meldingen over dezelfde sessie vervangen elkaar in plaats van te stapelen.
    tag: data.pad || 'jumpmasters',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(titel, opties));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const pad = event.notification.data?.pad || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((vensters) => {
      // Staat de app al open? Breng hem dan naar voren op de juiste pagina.
      for (const venster of vensters) {
        if ('focus' in venster) {
          venster.navigate?.(pad);
          return venster.focus();
        }
      }
      return self.clients.openWindow(pad);
    })
  );
});
