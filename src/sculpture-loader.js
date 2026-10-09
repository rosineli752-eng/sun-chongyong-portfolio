// Keep the portfolio usable while the optional interactive scene downloads.
(()=>{
 const stage=document.querySelector('#sculpture-stage'),activate=document.querySelector('#activate-sculpture');
 if(!stage||!activate)return;
 stage.dataset.renderer='poster';
 let loading=false,loaded=false,mounted=false,visible=false,pendingMaterial=null;
 const unobstructed=()=>!document.querySelector('dialog[open]');
 const automatic=()=>unobstructed()&&!navigator.connection?.saveData&&!document.body.classList.contains('motion-off');
 const ready=new MutationObserver(()=>{
  if(stage.dataset.renderer==='webgl'){activate.hidden=true;ready.disconnect();performance.mark('sculpture-ready');}
 });
 ready.observe(stage,{attributes:true,attributeFilter:['data-renderer']});
 function mount(){
  if(!loaded||mounted||!visible||document.hidden||!unobstructed())return;
  mounted=true;window.dispatchEvent(new Event('sculpture-mount'));
  if(pendingMaterial){document.querySelector(`[data-material="${pendingMaterial}"]`)?.click();pendingMaterial=null;}
 }
 function start(force=false){
  if(loaded){mount();return;}
  if(loading||!unobstructed()||(!force&&(!visible||!automatic()))||document.hidden)return;
  loading=true;activate.disabled=true;activate.textContent='正在开启三维…';
  performance.mark('sculpture-download');
  const script=document.createElement('script');script.src='sculpture.js?v=20261009b';script.async=true;script.fetchPriority='low';
  script.onload=()=>{loading=false;loaded=true;mount();if(stage.dataset.renderer!=='webgl'){activate.textContent='三维体验';activate.disabled=false;}};
  script.onerror=()=>{loading=false;script.remove();activate.disabled=false;activate.textContent='重试三维体验';};
  document.head.append(script);
 }
 function schedule(){
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if('requestIdleCallback' in window)requestIdleCallback(()=>start(),{timeout:1800});else setTimeout(()=>start(),250);
  }));
 }
 activate.addEventListener('click',()=>start(true));
 stage.addEventListener('pointerdown',()=>start(true),{passive:true});
 document.querySelectorAll('[data-material]').forEach(button=>button.addEventListener('click',()=>{if(!loaded){pendingMaterial=button.dataset.material;start(true);}}));
 document.querySelector('.motion-toggle').addEventListener('click',()=>{if(automatic()&&visible)schedule();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&visible)schedule();});
 document.addEventListener('close',()=>{if(visible&&(loaded||automatic()))schedule();},{capture:true});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();}).observe(stage);
 else {visible=true;schedule();}
 performance.mark('portfolio-ready');
})();
