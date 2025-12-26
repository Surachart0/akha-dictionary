const CACHE_NAME = 'akha-heritage-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700;800&display=swap',
  'https://cdn.tailwindcss.com'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch Event (Network First for Sheets, Cache First for Assets)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // ถ้าเป็นข้อมูลจาก Google Sheets ให้พยายามโหลดใหม่เสมอ แต่ถ้าล้มเหลวให้ใช้ Cache
  if (url.host === 'docs.google.com') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clonedResponse));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // สำหรับไฟล์อื่นๆ (Assets) ใช้ Cache First
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});