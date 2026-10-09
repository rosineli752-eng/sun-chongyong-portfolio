'use strict';
const clock = document.querySelector('.local-clock');
function updateClock(){clock.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit'}).format(new Date());}updateClock();setInterval(updateClock,60000);
const motionButton=document.querySelector('.motion-toggle');let motionOff=matchMedia('(prefers-reduced-motion: reduce)').matches;
function setMotion(){document.body.classList.toggle('motion-off',motionOff);motionButton.setAttribute('aria-pressed',String(motionOff));motionButton.setAttribute('aria-label',motionOff?'开启动态效果':'暂停动态效果');motionButton.querySelector('span').textContent=motionOff?'OFF':'ON';}setMotion();motionButton.addEventListener('click',()=>{motionOff=!motionOff;setMotion();});
const {projects,films,awards}=window.PORTFOLIO;
const projectDialog=document.querySelector('#project-dialog'),filmDialog=document.querySelector('#film-dialog'),lightbox=document.querySelector('#lightbox');
let currentProject=null,imageIndex=0,returnHash='#work',filmReturnHash='#motion';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const imageManifest=window.IMAGE_MANIFEST||{},videoPreviews=window.VIDEO_PREVIEWS||{};
function imageTag(src,alt,{sizes='(max-width:700px) 90vw,46vw',eager=false,deferred=false}={}){
 const m=imageManifest[src],small=m?.preview||src;
 const set=m?(navigator.connection?.saveData?`${small} 480w`:m.srcset):'';
 const dim=m?` width="${m.width}" height="${m.height}"`:'';
 const source=deferred?`data-src="${esc(small)}"${set?` data-srcset="${esc(set)}"`:''}`:`src="${esc(small)}"${set?` srcset="${esc(set)}"`:''}`;
 return `<img ${source} data-original="${esc(src)}"${dim}${set?` sizes="${sizes}"`:''} alt="${esc(alt)}" loading="${eager?'eager':'lazy'}" fetchpriority="${eager?'high':'auto'}" decoding="async">`;
}
document.addEventListener('load',e=>{if(e.target.tagName==='IMG')e.target.closest('.gallery-item')?.removeAttribute('aria-busy');},true);
document.addEventListener('error',e=>{const im=e.target;if(im.tagName==='IMG'&&im.dataset.original&&!im.dataset.originalFallback){im.dataset.originalFallback='true';im.removeAttribute('srcset');im.src=im.dataset.original;}},true);
let galleryObserver;
function observeGallery(){
 galleryObserver?.disconnect();
 const pending=projectDialog.querySelectorAll('img[data-src]');
 const load=im=>{if(im.dataset.srcset){im.srcset=im.dataset.srcset;delete im.dataset.srcset;}im.src=im.dataset.src;delete im.dataset.src;};
 if(!('IntersectionObserver' in window)){pending.forEach(load);return;}
 galleryObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){load(e.target);galleryObserver.unobserve(e.target);}}),{root:projectDialog,rootMargin:'300px 0px'});
 pending.forEach(im=>galleryObserver.observe(im));
}
function projectCard(p){
 let visual=imageTag(p.cover,p.title);
 if(p.id==='qingjiang')visual=`<div class="feature-word">QINGJIANG<br>SPIRIT<small>把山水，变成性格。<br>清江守望者 / 文旅 IP</small></div>${visual}`;
 if(['hbn','sanfu','heritage'].includes(p.id))visual=`${imageTag(p.images[0].src,p.images[0].alt,{sizes:'(max-width:700px) 38vw,20vw'})}${imageTag(p.images[1].src,p.images[1].alt,{sizes:'(max-width:700px) 38vw,20vw'})}`;
 return `<a class="project-card ${p.id==='qingjiang'?'feature ':''}${p.id} reveal" href="#project-${p.id}"><div class="project-image ${['hbn','sanfu','heritage'].includes(p.id)?'poster-pair':''}" style="background-color:${p.color}">${visual}${p.award?`<span class="project-award">${esc(p.award.split(' · ')[0])}</span>`:''}<span class="view-label">查看项目</span></div><div class="project-meta"><div><span class="project-number">${p.number}</span><h3>${p.title}</h3><p>${p.tags}</p></div><span class="project-year">${p.category==='photo'?'摄影作品':p.kind==='合作竞赛作品'?'合作作品':'设计实践'}</span></div></a>`;
}
let revealObserver;
function observeReveals(){if(motionOff){document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));return;}if(!revealObserver){document.body.classList.add('reveal-ready');revealObserver=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target);}}),{threshold:.08});}document.querySelectorAll('.reveal:not(.visible)').forEach(el=>revealObserver.observe(el));}
function renderProjects(filter='all'){
 const selected=filter==='all'?projects.slice(0,6):projects.filter(p=>p.category===filter);
 document.querySelector('#project-grid').innerHTML=selected.map(projectCard).join('');
 document.querySelector('#archive').hidden=filter!=='all';
 document.querySelector('#archive-list').innerHTML=projects.slice(6).map(p=>`<a class="archive-row" href="#project-${p.id}"><span>${p.number}</span>${imageTag(p.cover,p.title,{sizes:'100px'})}<h3>${p.title}</h3><p>${p.tags}</p><span class="archive-open" aria-hidden="true">+</span></a>`).join('');
 document.querySelector('#filter-status').textContent=(filter==='all'?projects.length:selected.length)+' 个项目';observeReveals();
}
document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn));});renderProjects(btn.dataset.filter);}));renderProjects();
document.querySelector('#film-count').textContent=String(films.length).padStart(2,'0');
document.querySelector('#film-grid').innerHTML=films.map(f=>`<button class="film-card" data-film="${f.id}" aria-label="播放影片：${f.title}"><div class="film-picture">${imageTag(f.poster,f.title+'影片画面')}<span class="play-disc" aria-hidden="true">PLAY</span><span class="film-duration">${f.duration}</span></div><div class="film-description"><div><h3>${f.title}</h3><p>${f.english}</p></div>${f.award?`<span>${f.award}</span>`:''}</div></button>`).join('');
const awardOrder=[2,5,1,3,4,0,7,6];document.querySelector('#award-list').innerHTML=awardOrder.map(i=>{const a=awards[i];return `<div class="award-row"><div><h4>${a.title}</h4><p>${a.date} / ${a.category}<br>${a.authors}</p></div><a href="${a.pdf}" target="_blank" rel="noopener" aria-label="查看${a.title}${a.round}${a.award}证书"><b>${a.round.includes('全国')?'全国总决赛':'黑龙江赛区'} · ${a.award}</b>查看证书</a></div>`;}).join('');
function galleryMarkup(items,start=0){return items.map((item,i)=>`<button class="gallery-item" data-image="${i+start}" aria-busy="true" aria-label="放大${esc(item.alt)}">${imageTag(item.src,item.alt,{sizes:i+start===0?'90vw':'(max-width:700px) 90vw,43vw',eager:i+start===0,deferred:i+start!==0})}<span class="image-index">${String(i+start+1).padStart(2,'0')} / ${String(currentProject.images.length).padStart(2,'0')}</span></button>`).join('');}
function openProject(id){const p=projects.find(p=>p.id===id);if(!p)return;if(currentProject?.id===id&&projectDialog.open)return;currentProject=p;
 const next=projects[(projects.indexOf(p)+1)%projects.length];
 document.querySelector('#case-index').textContent=`${p.number} / ${String(projects.length).padStart(2,'0')} · PROJECT ARCHIVE`;
 document.querySelector('#case-content').innerHTML=`<div class="case-heading"><div><p class="eyebrow">${p.kind} / ${p.number}</p><h2 id="case-title">${p.title}</h2><p class="case-english">${p.english}</p></div><div class="case-summary"><span class="case-tag">${p.tags}</span><p>${p.images.length} 张作品 / 视觉档案</p></div></div>${p.award?`<p class="case-award">${p.award}<a href="${p.certificate}" target="_blank" rel="noopener">查看证书</a></p>`:''}${p.credits?`<p class="case-credit">${p.credits}</p>`:''}<div class="case-intro"><h3>${p.lead}</h3><p>${p.description}</p></div>${p.film?`<button class="case-film-button" data-film="${p.film}">观看《${films.find(f=>f.id===p.film)?.title||'影片'}》 / ${films.find(f=>f.id===p.film)?.duration||''}</button>`:''}<div class="case-gallery">${galleryMarkup(p.images.slice(0,8))}</div>${p.images.length>8?`<button class="gallery-more" type="button">展开完整档案 / 共 ${p.images.length} 张</button>`:''}<div class="case-next"><p>NEXT EXPLORATION</p><a href="#project-${next.id}">${next.title}</a></div>`;
 if(!projectDialog.open)projectDialog.showModal();projectDialog.scrollTop=0;document.title=p.title+' · 孙重勇作品集';observeGallery();
 const more=projectDialog.querySelector('.gallery-more');if(more)more.addEventListener('click',()=>{projectDialog.querySelector('.case-gallery').insertAdjacentHTML('beforeend',galleryMarkup(p.images.slice(8),8));more.remove();observeGallery();});
}
function closeProject(){galleryObserver?.disconnect();if(lightbox.open)lightbox.close();if(projectDialog.open)projectDialog.close();currentProject=null;history.replaceState(null,'',returnHash);document.title='孙重勇 — 视觉设计与数字艺术';}
let fullImageToken=0,fullImageLoader;
function setLightbox(){
 const item=currentProject.images[imageIndex],im=document.querySelector('#lightbox-image'),m=imageManifest[item.src],token=++fullImageToken;
 if(fullImageLoader)fullImageLoader.src='';
 im.src=m?.variants.at(-1).src||item.src;im.alt=item.alt;
 const hint=document.querySelector('.lightbox-hint');hint.textContent='正在加载高清原图…';
 document.querySelector('#lightbox-count').textContent=String(imageIndex+1).padStart(2,'0')+' / '+String(currentProject.images.length).padStart(2,'0');document.querySelector('#original-image').href=item.src;document.querySelector('.zoom-image').scrollTop=0;
 fullImageLoader=new Image();fullImageLoader.decoding='async';
 fullImageLoader.onload=()=>{if(token===fullImageToken&&lightbox.open){im.src=item.src;hint.textContent='左右方向键切换 / Esc 关闭';}};
 fullImageLoader.onerror=()=>{if(token===fullImageToken)hint.textContent='已显示浏览版 / 可点击「打开完整大图」查看原图';};
 fullImageLoader.src=item.src;
}
lightbox.addEventListener('close',()=>{++fullImageToken;if(fullImageLoader)fullImageLoader.src='';});
function stepImage(step){if(!currentProject)return;imageIndex=(imageIndex+step+currentProject.images.length)%currentProject.images.length;setLightbox();}
document.querySelector('#image-prev').addEventListener('click',()=>stepImage(-1));document.querySelector('#image-next').addEventListener('click',()=>stepImage(1));
lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();stepImage(-1);}if(e.key==='ArrowRight'){e.preventDefault();stepImage(1);}});
let filmGeneration=0;
function openFilm(id){const f=films.find(f=>f.id===id);if(!f)return;
 if(filmDialog.open&&filmDialog.dataset.filmId===id)return;
 const old=filmDialog.querySelector('video');if(old){old.pause();old.querySelector('source')?.remove();old.load();}
 const generation=++filmGeneration,preview=videoPreviews[f.src]||f.src,poster=imageManifest[f.poster]?.preview||f.poster;
 filmDialog.dataset.filmId=id;
 document.querySelector('#film-content').innerHTML=`<div class="film-content-wrap"><video controls playsinline preload="metadata" width="854" height="480" poster="${poster}" aria-label="${esc(f.title)}"><source src="${preview}" type="video/mp4">您的浏览器不支持视频播放。<a href="${f.src}">下载影片</a></video><div class="film-player-tools"><label>画质 <select class="film-quality" aria-label="影片画质"><option value="fast">流畅 · 更快加载</option><option value="hd">原版高清</option></select></label><span class="film-loading" role="status">正在准备影片…</span></div><h2 id="film-title">${f.title}</h2><p>${f.description}</p>${f.award?`<p class="case-award">${f.award}<a href="${f.certificate}" target="_blank" rel="noopener">查看证书</a></p>`:''}${f.credits?`<p>${f.credits}</p>`:''}<p class="film-error" hidden>影片加载遇到问题。<a href="${f.src}" target="_blank" rel="noopener">打开影片文件</a></p></div>`;
 if(!filmDialog.open)filmDialog.showModal();
 const video=filmDialog.querySelector('video'),status=filmDialog.querySelector('.film-loading'),select=filmDialog.querySelector('.film-quality');
 let restore=null,changeId=0;
 const active=()=>generation===filmGeneration&&filmDialog.open;
 video.addEventListener('loadstart',()=>{if(active())status.textContent='正在准备影片…';});
 video.addEventListener('loadedmetadata',()=>{if(!active()||!restore||restore.id!==changeId)return;const r=restore;restore=null;video.currentTime=Math.min(r.time,Math.max(0,video.duration-.1));video.volume=r.volume;video.muted=r.muted;video.playbackRate=r.rate;if(!r.paused)video.play().catch(()=>{});});
 video.addEventListener('canplay',()=>{if(active())status.textContent='';});
 video.addEventListener('playing',()=>{if(active())status.textContent='';});
 video.addEventListener('waiting',()=>{if(active())status.textContent='正在缓冲…';});
 video.addEventListener('error',()=>{if(active()){status.textContent='';filmDialog.querySelector('.film-error').hidden=false;}});
 select.addEventListener('change',()=>{
  const previous=restore||{time:video.currentTime,paused:video.paused,volume:video.volume,muted:video.muted,rate:video.playbackRate};
  restore={...previous,id:++changeId};video.pause();filmDialog.querySelector('.film-error').hidden=true;status.textContent='正在切换画质…';video.querySelector('source').src=select.value==='hd'?f.src:preview;video.load();
 });
 document.title=f.title+' · 孙重勇作品集';
}
function closeFilm(){++filmGeneration;const v=filmDialog.querySelector('video');if(v){v.pause();v.removeAttribute('src');v.querySelector('source')?.remove();v.load();}if(filmDialog.open)filmDialog.close();history.replaceState(null,'',filmReturnHash);document.title=currentProject?currentProject.title+' · 孙重勇作品集':'孙重勇 — 视觉设计与数字艺术';}
function route(){const h=location.hash;if(h.startsWith('#project-')){if(filmDialog.open)closeFilm();openProject(h.slice(9));}else if(h.startsWith('#film-'))openFilm(h.slice(6));else{if(filmDialog.open)closeFilm();if(projectDialog.open||lightbox.open)closeProject();history.replaceState(null,'',h||location.pathname+location.search);document.title='孙重勇 — 视觉设计与数字艺术';}}
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#project-"]');if(a&&!projectDialog.open)returnHash=location.hash||'#work';const f=e.target.closest('[data-film]');if(f){filmReturnHash=location.hash||'#motion';location.hash='film-'+f.dataset.film;}const image=e.target.closest('[data-image]');if(image&&currentProject){imageIndex=Number(image.dataset.image);setLightbox();lightbox.showModal();}const close=e.target.closest('[data-close]');if(close){if(close.dataset.close==='project')closeProject();if(close.dataset.close==='film')closeFilm();if(close.dataset.close==='lightbox')lightbox.close();}});
projectDialog.addEventListener('cancel',e=>{e.preventDefault();closeProject();});filmDialog.addEventListener('cancel',e=>{e.preventDefault();closeFilm();});
window.addEventListener('hashchange',route);route();
document.querySelector('#copy-email').addEventListener('click',async()=>{const email='RosineLi752@gmail.com',status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText(email);status.textContent='邮箱已复制。';}catch{const field=document.createElement('textarea');field.value=email;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();const copied=document.execCommand('copy');field.remove();status.textContent=copied?'邮箱已复制。':'请选中邮箱地址复制。';}});
motionButton.addEventListener('click',()=>{if(motionOff)document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));});
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
 const cacheImages=()=>navigator.serviceWorker.register('sw.js').catch(()=>{});
 if(document.readyState==='complete')cacheImages();else window.addEventListener('load',cacheImages,{once:true});
}

