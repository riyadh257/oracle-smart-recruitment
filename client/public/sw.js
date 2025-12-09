/**
 * Service Worker for Oracle Smart Recruitment System
 * Provides offline capabilities and caching for PWA functionality
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `oracle-recruit-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  '/api/trpc/feedback.getTemplates',
  '/api/trpc/interviews.list',
  '/api/trpc/candidate.getProfile',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Force the waiting service worker to become the active service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('oracle-recruit-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first strategy for API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Cache-first strategy for static assets
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script'
  ) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Network-first strategy for HTML pages
  if (request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirstStrategy(request));
});

/**
 * Cache-first strategy: Check cache first, fall back to network
 * Best for static assets that rarely change
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }

  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html') || new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }
    
    throw error;
  }
}

/**
 * Network-first strategy: Try network first, fall back to cache
 * Best for dynamic content and API calls
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    
    // Cache successful GET requests
    if (response.ok && request.method === 'GET') {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, checking cache:', request.url);
    
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('[SW] Serving from cache:', request.url);
      return cached;
    }
    
    // Return offline response for failed requests
    if (request.destination === 'document') {
      return caches.match('/offline.html') || new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }
    
    throw error;
  }
}

/**
 * Background sync for offline form submissions
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-feedback') {
    event.waitUntil(syncFeedback());
  }
  
  if (event.tag === 'sync-interview-response') {
    event.waitUntil(syncInterviewResponse());
  }
});

/**
 * Sync offline feedback submissions
 */
async function syncFeedback() {
  try {
    // Get pending feedback from IndexedDB
    const db = await openDB();
    const tx = db.transaction('pendingFeedback', 'readonly');
    const store = tx.objectStore('pendingFeedback');
    const pending = await store.getAll();
    
    console.log('[SW] Syncing', pending.length, 'feedback submissions');
    
    // Submit each pending feedback
    for (const item of pending) {
      try {
        const response = await fetch('/api/trpc/feedback.submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item.data),
        });
        
        if (response.ok) {
          // Remove from pending queue
          const deleteTx = db.transaction('pendingFeedback', 'readwrite');
          const deleteStore = deleteTx.objectStore('pendingFeedback');
          await deleteStore.delete(item.id);
          console.log('[SW] Synced feedback:', item.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync feedback:', item.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Feedback sync failed:', error);
  }
}

/**
 * Sync offline interview responses
 */
async function syncInterviewResponse() {
  try {
    const db = await openDB();
    const tx = db.transaction('pendingResponses', 'readonly');
    const store = tx.objectStore('pendingResponses');
    const pending = await store.getAll();
    
    console.log('[SW] Syncing', pending.length, 'interview responses');
    
    for (const item of pending) {
      try {
        const response = await fetch('/api/trpc/interviews.respond', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(item.data),
        });
        
        if (response.ok) {
          const deleteTx = db.transaction('pendingResponses', 'readwrite');
          const deleteStore = deleteTx.objectStore('pendingResponses');
          await deleteStore.delete(item.id);
          console.log('[SW] Synced response:', item.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync response:', item.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Response sync failed:', error);
  }
}

/**
 * Open IndexedDB for offline storage
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('OracleRecruitDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingFeedback')) {
        db.createObjectStore('pendingFeedback', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pendingResponses')) {
        db.createObjectStore('pendingResponses', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

/**
 * Push notification handler
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Oracle Recruitment';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.url || '/',
    actions: [
      {
        action: 'open',
        title: 'Open',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

/**
 * Message handler for communication with the app
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
