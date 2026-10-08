'use strict';
const clock = document.querySelector('.local-clock');
function updateClock(){clock.textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit'}).format(new Date());}updateClock();setInterval(updateClock,60000);
const motionButton=document.querySelector('.motion-toggle');let motionOff=matchMedia('(prefers-reduced-motion: reduce)').matches;
function setMotion(){document.body.classList.toggle('motion-off',motionOff);motionButton.setAttribute('aria-pressed',String(motionOff));motionButton.setAttribute('aria-label',motionOff?'开启动态效果':'暂停动态效果');motionButton.querySelector('span').textContent=motionOff?'OFF':'ON';}setMotion();motionButton.addEventListener('click',()=>{motionOff=!motionOff;setMotion();});
const {projects,films,awards}=window.PORTFOLIO;
const projectDialog=document.querySelector('#project-dialog'),filmDialog=document.querySelector('#film-dialog'),lightbox=document.querySelector('#lightbox');
let currentProject=null,imageIndex=0,returnHash='#work',filmReturnHash='#motion';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function imageTag(src,alt){return `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;}
function projectCard(p){
 let visual=imageTag(p.cover,p.title);
 if(p.id==='qingjiang')visual=`<div class="feature-word">QINGJIANG<br>SPIRIT<small>把山水，变成性格。<br>清江守望者 / 文旅 IP</small></div>${visual}`;
 if(['hbn','sanfu','heritage'].includes(p.id))visual=`${imageTag(p.images[0].src,p.images[0].alt)}${imageTag(p.images[1].src,p.images[1].alt)}`;
 return `<a class="project-card ${p.id==='qingjiang'?'feature ':''}${p.id} reveal" href="#project-${p.id}"><div class="project-image ${['hbn','sanfu','heritage'].includes(p.id)?'poster-pair':''}" style="background-color:${p.color}">${visual}${p.award?`<span class="project-award">${esc(p.award.split(' · ')[0])}</span>`:''}<span class="view-label">查看项目</span></div><div class="project-meta"><div><span class="project-number">${p.number}</span><h3>${p.title}</h3><p>${p.tags}</p></div><span class="project-year">${p.category==='photo'?'摄影作品':p.kind==='合作竞赛作品'?'合作作品':'设计实践'}</span></div></a>`;
}
let revealObserver;
function observeReveals(){if(motionOff){document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));return;}if(!revealObserver){document.body.classList.add('reveal-ready');revealObserver=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target);}}),{threshold:.08});}document.querySelectorAll('.reveal:not(.visible)').forEach(el=>revealObserver.observe(el));}
function renderProjects(filter='all'){
 const selected=filter==='all'?projects.slice(0,6):projects.filter(p=>p.category===filter);
 document.querySelector('#project-grid').innerHTML=selected.map(projectCard).join('');
 document.querySelector('#archive').hidden=filter!=='all';
 document.querySelector('#archive-list').innerHTML=projects.slice(6).map(p=>`<a class="archive-row" href="#project-${p.id}"><span>${p.number}</span>${imageTag(p.cover,p.title)}<h3>${p.title}</h3><p>${p.tags}</p><span class="archive-open" aria-hidden="true">+</span></a>`).join('');
 document.querySelector('#filter-status').textContent=(filter==='all'?projects.length:selected.length)+' 个项目';observeReveals();
}
document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn));});renderProjects(btn.dataset.filter);}));renderProjects();
document.querySelector('#film-count').textContent=String(films.length).padStart(2,'0');
document.querySelector('#film-grid').innerHTML=films.map(f=>`<button class="film-card" data-film="${f.id}" aria-label="播放影片：${f.title}"><div class="film-picture">${imageTag(f.poster,f.title+'影片画面')}<span class="play-disc" aria-hidden="true">PLAY</span><span class="film-duration">${f.duration}</span></div><div class="film-description"><div><h3>${f.title}</h3><p>${f.english}</p></div>${f.award?`<span>${f.award}</span>`:''}</div></button>`).join('');
const awardOrder=[2,5,1,3,4,0,7,6];document.querySelector('#award-list').innerHTML=awardOrder.map(i=>{const a=awards[i];return `<div class="award-row"><div><h4>${a.title}</h4><p>${a.date} / ${a.category}<br>${a.authors}</p></div><a href="${a.pdf}" target="_blank" rel="noopener" aria-label="查看${a.title}${a.round}${a.award}证书"><b>${a.round.includes('全国')?'全国总决赛':'黑龙江赛区'} · ${a.award}</b>查看证书</a></div>`;}).join('');
function galleryMarkup(items,start=0){return items.map((item,i)=>`<button class="gallery-item" data-image="${i+start}" aria-label="放大${esc(item.alt)}">${imageTag(item.src,item.alt)}<span class="image-index">${String(i+start+1).padStart(2,'0')} / ${String(currentProject.images.length).padStart(2,'0')}</span></button>`).join('');}
function openProject(id){const p=projects.find(p=>p.id===id);if(!p)return;if(currentProject?.id===id&&projectDialog.open)return;currentProject=p;
 const next=projects[(projects.indexOf(p)+1)%projects.length];
 document.querySelector('#case-index').textContent=`${p.number} / ${String(projects.length).padStart(2,'0')} · PROJECT ARCHIVE`;
 document.querySelector('#case-content').innerHTML=`<div class="case-heading"><div><p class="eyebrow">${p.kind} / ${p.number}</p><h2 id="case-title">${p.title}</h2><p class="case-english">${p.english}</p></div><div class="case-summary"><span class="case-tag">${p.tags}</span><p>${p.images.length} 张作品 / 视觉档案</p></div></div>${p.award?`<p class="case-award">${p.award}<a href="${p.certificate}" target="_blank" rel="noopener">查看证书</a></p>`:''}${p.credits?`<p class="case-credit">${p.credits}</p>`:''}<div class="case-intro"><h3>${p.lead}</h3><p>${p.description}</p></div>${p.film?`<button class="case-film-button" data-film="${p.film}">观看《${films.find(f=>f.id===p.film)?.title||'影片'}》 / ${films.find(f=>f.id===p.film)?.duration||''}</button>`:''}<div class="case-gallery">${galleryMarkup(p.images.slice(0,8))}</div>${p.images.length>8?`<button class="gallery-more" type="button">展开完整档案 / 共 ${p.images.length} 张</button>`:''}<div class="case-next"><p>NEXT EXPLORATION</p><a href="#project-${next.id}">${next.title}</a></div>`;
 if(!projectDialog.open)projectDialog.showModal();projectDialog.scrollTop=0;document.title=p.title+' · 孙重勇作品集';
 const more=projectDialog.querySelector('.gallery-more');if(more)more.addEventListener('click',()=>{projectDialog.querySelector('.case-gallery').insertAdjacentHTML('beforeend',galleryMarkup(p.images.slice(8),8));more.remove();});
}
function closeProject(){if(lightbox.open)lightbox.close();if(projectDialog.open)projectDialog.close();currentProject=null;history.replaceState(null,'',returnHash);document.title='孙重勇 — 视觉设计与数字艺术';}
function setLightbox(){const item=currentProject.images[imageIndex];const im=document.querySelector('#lightbox-image');im.src=item.src;im.alt=item.alt;document.querySelector('#lightbox-count').textContent=String(imageIndex+1).padStart(2,'0')+' / '+String(currentProject.images.length).padStart(2,'0');document.querySelector('#original-image').href=item.src;document.querySelector('.zoom-image').scrollTop=0;}
function stepImage(step){if(!currentProject)return;imageIndex=(imageIndex+step+currentProject.images.length)%currentProject.images.length;setLightbox();}
document.querySelector('#image-prev').addEventListener('click',()=>stepImage(-1));document.querySelector('#image-next').addEventListener('click',()=>stepImage(1));
lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();stepImage(-1);}if(e.key==='ArrowRight'){e.preventDefault();stepImage(1);}});
function openFilm(id){const f=films.find(f=>f.id===id);if(!f)return;
 document.querySelector('#film-content').innerHTML=`<div class="film-content-wrap"><video controls playsinline preload="metadata" poster="${f.poster}" aria-label="${esc(f.title)}"><source src="${f.src}" type="video/mp4">您的浏览器不支持视频播放。<a href="${f.src}">下载影片</a></video><h2 id="film-title">${f.title}</h2><p>${f.description}</p>${f.award?`<p class="case-award">${f.award}<a href="${f.certificate}" target="_blank" rel="noopener">查看证书</a></p>`:''}${f.credits?`<p>${f.credits}</p>`:''}<p class="film-error" hidden>影片加载遇到问题。<a href="${f.src}" target="_blank" rel="noopener">打开影片文件</a></p></div>`;
 if(!filmDialog.open)filmDialog.showModal();const video=filmDialog.querySelector('video');video.addEventListener('error',()=>filmDialog.querySelector('.film-error').hidden=false);document.title=f.title+' · 孙重勇作品集';
}
function closeFilm(){const v=filmDialog.querySelector('video');if(v){v.pause();v.removeAttribute('src');v.querySelector('source')?.remove();v.load();}if(filmDialog.open)filmDialog.close();history.replaceState(null,'',filmReturnHash);document.title=currentProject?currentProject.title+' · 孙重勇作品集':'孙重勇 — 视觉设计与数字艺术';}
function route(){const h=location.hash;if(h.startsWith('#project-')){if(filmDialog.open)closeFilm();openProject(h.slice(9));}else if(h.startsWith('#film-'))openFilm(h.slice(6));else{if(filmDialog.open)closeFilm();if(projectDialog.open){projectDialog.close();currentProject=null;}document.title='孙重勇 — 视觉设计与数字艺术';}}
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#project-"]');if(a&&!projectDialog.open)returnHash=location.hash||'#work';const f=e.target.closest('[data-film]');if(f){filmReturnHash=location.hash||'#motion';location.hash='film-'+f.dataset.film;}const image=e.target.closest('[data-image]');if(image&&currentProject){imageIndex=Number(image.dataset.image);setLightbox();lightbox.showModal();}const close=e.target.closest('[data-close]');if(close){if(close.dataset.close==='project')closeProject();if(close.dataset.close==='film')closeFilm();if(close.dataset.close==='lightbox')lightbox.close();}});
projectDialog.addEventListener('cancel',e=>{e.preventDefault();closeProject();});filmDialog.addEventListener('cancel',e=>{e.preventDefault();closeFilm();});
window.addEventListener('hashchange',route);route();
document.querySelector('#copy-email').addEventListener('click',async()=>{const email='RosineLi752@gmail.com',status=document.querySelector('#copy-status');try{await navigator.clipboard.writeText(email);status.textContent='邮箱已复制。';}catch{const field=document.createElement('textarea');field.value=email;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();const copied=document.execCommand('copy');field.remove();status.textContent=copied?'邮箱已复制。':'请选中邮箱地址复制。';}});
motionButton.addEventListener('click',()=>{if(motionOff)document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));});

