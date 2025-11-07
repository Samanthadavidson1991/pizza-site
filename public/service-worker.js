const CACHE_NAME = 'pizza-site-v5-FORCE-CACHE-BUST';
const urlsToCache = [
	'/index.html',
	'/menu.html',
	'/checkout-enhanced.html',
	'/allergens.html',
	'/style.css',
	'/menu.css',
	'/pizza-icon-192.png',
	'/pizza-shop-logo.png',
	'/manifest.json'
	// Only include files that exist in your deployed site root
];

self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
	);
});

self.addEventListener('fetch', event => {
	event.respondWith(
		caches.match(event.request).then(response => response || fetch(event.request))
	);
});

self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(keys =>
			Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
		)
	);
});
