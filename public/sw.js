const CACHE_NAME = 'trip-manager-v2';
const API_CACHE = 'trip-manager-api-v1';
const OFFLINE_CACHE = 'trip-manager-offline-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => 
            name.startsWith('trip-manager-') && 
            name !== CACHE_NAME && 
            name !== API_CACHE &&
            name !== OFFLINE_CACHE
          )
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (but handle them for offline queue)
  if (request.method !== 'GET') {
    // Queue non-GET requests if offline
    if (!navigator.onLine) {
      event.respondWith(queueOfflineRequest(request));
    }
    return;
  }

  // Handle API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle page navigations - network first
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Handle static assets - cache first
  event.respondWith(handleStaticAsset(request));
});

// API request handler - stale-while-revalidate
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving API from cache:', request.url);
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Navigation handler
async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving page from cache:', request.url);
      return cachedResponse;
    }
    return caches.match(OFFLINE_URL);
  }
}

// Static asset handler - cache first
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Asset not available offline:', request.url);
    return new Response('', { status: 404 });
  }
}

// Queue offline requests for background sync
async function queueOfflineRequest(request) {
  const cache = await caches.open(OFFLINE_CACHE);
  const body = await request.clone().text();
  
  const offlineData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: body,
    timestamp: Date.now()
  };

  // Store with unique key
  const key = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  await cache.put(
    new Request(key),
    new Response(JSON.stringify(offlineData))
  );

  // Register for background sync
  if ('sync' in self.registration) {
    await self.registration.sync.register('sync-offline-actions');
  }

  return new Response(JSON.stringify({ 
    queued: true, 
    message: 'Request queued for sync when online' 
  }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Background sync handler
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-offline-actions') {
    event.waitUntil(syncOfflineActions());
  }
});

async function syncOfflineActions() {
  const cache = await caches.open(OFFLINE_CACHE);
  const requests = await cache.keys();
  
  console.log('[SW] Syncing', requests.length, 'offline actions');

  for (const request of requests) {
    try {
      const response = await cache.match(request);
      const data = await response.json();
      
      const fetchResponse = await fetch(data.url, {
        method: data.method,
        headers: data.headers,
        body: data.body || undefined
      });

      if (fetchResponse.ok) {
        await cache.delete(request);
        console.log('[SW] Synced:', data.url);
        
        // Notify all clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SYNC_COMPLETE',
            url: data.url
          });
        });
      }
    } catch (error) {
      console.error('[SW] Sync failed for:', request.url, error);
    }
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = { title: 'Trip Manager', body: 'You have a new notification' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1
    },
    actions: data.actions || [
      { action: 'view', title: 'View', icon: '/icons/check.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/x.png' }
    ],
    tag: data.tag || 'trip-notification',
    renotify: true,
    requireInteraction: data.requireInteraction || false
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if none found
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CACHE_TRIP') {
    const tripId = event.data.tripId;
    event.waitUntil(cacheTripData(tripId));
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
});

// Cache trip data for offline access
async function cacheTripData(tripId) {
  const urls = [
    `/api/trips/${tripId}`,
    `/trips/${tripId}`,
  ];

  const cache = await caches.open(API_CACHE);
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('[SW] Cached trip data:', url);
      }
    } catch (error) {
      console.error('[SW] Failed to cache:', url);
    }
  }

  // Notify client
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'TRIP_CACHED',
      tripId: tripId
    });
  });
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

// Periodic sync for trip updates (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-trips') {
    event.waitUntil(updateTripsInBackground());
  }
});

async function updateTripsInBackground() {
  try {
    const response = await fetch('/api/trips');
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      await cache.put('/api/trips', response);
      console.log('[SW] Trips updated in background');
    }
  } catch (error) {
    console.error('[SW] Background update failed:', error);
  }
}
