const CACHE_NAME = 'pizza-site-v1';
const urlsToCache = [
	'/pizza website/index.html',
	'/pizza website/menu pizza website take 1.html',
	'/pizza website/checkout.html',
	'/pizza website/allergens.html',
	'/pizza website/css menu pizza website take 1.css',
	'/pizza website/pizza website/new better image 5.png',
	// Add other assets as needed
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
