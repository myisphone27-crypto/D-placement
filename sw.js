/* Service Worker — نظام تتبع الشحنات */
const CACHE_NAME = 'shipment-tracker-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&family=Tajawal:wght@400;500;700&display=swap'
];

/* التثبيت: تخزين ملفات التطبيق */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(ASSETS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

/* التفعيل: حذف النسخ القديمة من الكاش */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* جلب الملفات: الكاش أولاً ثم الشبكة (مع تخزين أي ملف جديد) */
self.addEventListener('fetch', (e) => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if(cached) return cached;
      return fetch(e.request).then((res) => {
        if(res && res.ok && (e.request.url.startsWith(self.location.origin) ||
           e.request.url.includes('cdnjs.cloudflare.com') ||
           e.request.url.includes('fonts.'))){
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});