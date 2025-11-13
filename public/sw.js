const CACHE_NAME = 'story-app-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles/styles.css',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('[Service Worker] Skip waiting');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Claiming clients');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push notification received', event);

    let notificationData = {
        title: 'Story App',
        body: 'You have a new notification',
        icon: '/vite.svg',
        badge: '/vite.svg',
        data: {
            url: '/#/home'
        }
    };

    // Parse data from server if available
    if (event.data) {
        try {
            const data = event.data.json();
            console.log('[Service Worker] Push data:', data);

            // Format dari Dicoding Story Notification API:
            // { title: "...", options: { body: "..." } }
            if (data.title) {
                notificationData.title = data.title;
            }

            if (data.options) {
                if (data.options.body) notificationData.body = data.options.body;
                if (data.options.icon) notificationData.icon = data.options.icon;
                if (data.options.badge) notificationData.badge = data.options.badge;
                if (data.options.data) notificationData.data = { ...notificationData.data, ...data.options.data };
            }

            // Fallback untuk format lain
            if (data.body) notificationData.body = data.body;
            if (data.message) notificationData.body = data.message;
            if (data.icon) notificationData.icon = data.icon;
            if (data.badge) notificationData.badge = data.badge;
            if (data.url) notificationData.data.url = data.url;

            if (data.storyId) {
                notificationData.data.url = `/#/story/${data.storyId}`;
                notificationData.data.storyId = data.storyId;
            }

            // Add action buttons
            notificationData.actions = [
                {
                    action: 'view',
                    title: 'View Story'
                },
                {
                    action: 'close',
                    title: 'Close'
                }
            ];

        } catch (error) {
            console.error('[Service Worker] Error parsing push data:', error);
            // Use default notification data
        }
    }

    const promiseChain = self.registration.showNotification(
        notificationData.title,
        {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            data: notificationData.data,
            actions: notificationData.actions || [],
            vibrate: [200, 100, 200],
            tag: 'story-notification',
            requireInteraction: false,
        }
    );

    event.waitUntil(promiseChain);
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event);

    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    // Handle action button clicks
    if (event.action === 'close') {
        return;
    }

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((windowClients) => {
        // Check if there's already a window open
        for (let i = 0; i < windowClients.length; i++) {
            const client = windowClients[i];
            if (client.url === new URL(urlToOpen, self.location.origin).href && 'focus' in client) {
                return client.focus();
            }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});
