// On-demand image cache; video byte-range requests pass through unchanged.
const CACHE='scy-portfolio-images-20261009-v2',LIMIT=120;
async function saveImage(cache,request,response){
 const headers=new Headers(response.headers);headers.set('x-scy-cached-at',String(Date.now()));
 await cache.put(request,new Response(response.body,{status:response.status,statusText:response.statusText,headers}));
 const keys=await cache.keys();await Promise.all(keys.slice(0,Math.max(0,keys.length-LIMIT)).map(key=>cache.delete(key)));
}
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const names=await caches.keys();
 await Promise.all(names.filter(name=>name.startsWith('scy-portfolio-images-')&&name!==CACHE).map(name=>caches.delete(name)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||request.headers.has('range')||url.origin!==location.origin||request.destination!=='image'||!url.pathname.endsWith('.webp'))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),saved=await cache.match(request);
  if(saved){
   if(Date.now()-Number(saved.headers.get('x-scy-cached-at')||0)>600000)event.waitUntil((async()=>{try{const fresh=await fetch(request,{cache:'no-cache'});if(fresh.ok&&fresh.status===200)await saveImage(cache,request,fresh);}catch{}})());
   return saved;
  }
  const response=await fetch(request);
  if(response.ok&&response.status===200){
   const copy=response.clone();
   event.waitUntil(saveImage(cache,request,copy).catch(()=>{}));
  }
  return response;
 })().catch(()=>fetch(request)));
});
