const cacheName='cap-manager-v2';
const files=['./','./index.html','./styles.css','./app.js','./forms.js','./qr.js','./icon-192.png','./icon-512.png','./manifest.webmanifest'];
self.addEventListener('install', event=>{
  event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(files.map(path => new Request(path, {cache:'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key === 'cap-manager-v1').map(key => caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin) return;
  event.respondWith(fetch(event.request).catch(async()=>{
    const cache = await caches.open(cacheName);
    const cached=await cache.match(event.request);
    return cached || (event.request.mode==='navigate' ? cache.match('./index.html') : Response.error());
  }));
});
