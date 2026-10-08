// Service Worker for InnBite Background & Lock Screen Notifications

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Handle Background Push Events
self.addEventListener('push', (event) => {
    let data = { title: '🚨 New Food Order Received!', body: 'Check kitchen/admin orders for details.', url: '/kitchen' };
    if (event.data) {
        try {
            data = { ...data, ...event.data.json() };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/logo.svg',
        badge: '/logo.svg',
        vibrate: [200, 100, 200, 100, 300],
        tag: data.tag || 'new-order-notification',
        renotify: true,
        requireInteraction: true,
        data: { url: data.url || '/kitchen' }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Handle Notification Clicks (Focuses or Opens order page on tap)
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification.data?.url || '/kitchen';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    client.focus();
                    return client.navigate(targetUrl);
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
            }
        })
    );
});
