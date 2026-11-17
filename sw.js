// C and P are written by editorial/img/driver-view/build-app.cjs: cache name (changes with the picture set) and the driver-view pictures to keep offline.
const C='pdd-1a63f4f573',P=["img/dv/q65.jpg?v=0f0930f671","img/dv/q68.jpg?v=e626407c44","img/dv/q92.jpg?v=4d42a6ee3f","img/dv/q213.jpg?v=dd85cdb335","img/dv/q294.jpg?v=47959d2159","img/dv/q669.jpg?v=7a256de6d5","img/dv/q671.jpg?v=d433f58eb7","img/dv/q673.jpg?v=1ca24fbd85","img/dv/q675.jpg?v=26b332a45c","img/dv/q677.jpg?v=4f0715557f","img/dv/q679.jpg?v=eb1c22fa8d","img/dv/q682.jpg?v=874955fcfa","img/dv/q684.jpg?v=1ed51a6e74","img/dv/q686.jpg?v=4937a66893","img/dv/q687.jpg?v=f74209b0bc","img/dv/q689.jpg?v=41ae09c21d","img/dv/q692.jpg?v=b0a9f89a25","img/dv/q695.jpg?v=4e7f5f07a0"];/*PRE*/
// Download every picture not yet in the cache; one failed file does not stop the rest (the page asks again on each open).
const pre=()=>caches.open(C).then(c=>Promise.all(P.map(u=>c.match(u).then(m=>m||fetch(u,{cache:'no-cache'}).then(r=>{if(r.ok)return c.put(u,r)})).catch(()=>{}))));
// The app shell must be in the new cache before old caches are removed; pictures are best-effort. Only own (pdd-) caches are removed: other apps may share the github.io origin.
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.add(new Request('./',{cache:'no-cache'}))).then(pre))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('pdd-')&&x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data==='pre')e.waitUntil(pre())});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
// Pictures have a version in the URL (?v=...), so a cached copy is always the right one: cache first.
if(/\/img\/dv\//.test(new URL(e.request.url).pathname)){e.respondWith(caches.match(e.request).then(m=>m||fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c))}return r})));return}
e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match('./'))))});
