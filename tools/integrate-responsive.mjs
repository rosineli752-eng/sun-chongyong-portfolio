import fs from 'node:fs';
import vm from 'node:vm';
const context={window:{}};
vm.runInNewContext(fs.readFileSync('dist/image-manifest.js','utf8'),context);
const manifest=context.window.IMAGE_MANIFEST;
let html=fs.readFileSync('dist/index.html','utf8');
html=html.replace(/<img\s+src="(assets\/[^"]+)"([^>]*)>/g,(tag,src,attrs)=>{
 const m=manifest[src];if(!m)return tag;
 const sizes=src.includes('portrait')?'(max-width:700px) 84vw,30vw':src.includes('qingjiang')?'45vw':'(max-width:700px) 90vw,46vw';
 return `<img src="${m.preview}" srcset="${m.srcset}" sizes="${sizes}" width="${m.width}" height="${m.height}"${attrs.replace(/ loading="[^"]+"/g,'')} loading="lazy" decoding="async">`;
});
html=html.replace('<link rel="stylesheet" href="style.css">','<link rel="stylesheet" href="style.css?v=20261009">');
html=html.replace('<script src="data.js"></script><script src="app.js" defer></script>','<script src="data.js"></script><script src="image-manifest.js?v=20261009" defer></script><script src="video-manifest.js?v=20261009" defer></script><script src="app.js?v=20261009" defer></script>');
fs.writeFileSync('dist/index.html',html);
let server=fs.readFileSync('server.mjs','utf8');
server=server.replace(".listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'))", ".listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:'+(Number(process.env.PORT)||4173)))");
fs.writeFileSync('server.mjs',server);
const marker='/* Responsive media loading */';
if(!fs.readFileSync('dist/style.css','utf8').includes(marker))fs.appendFileSync('dist/style.css',`\n${marker}
.gallery-item[aria-busy=true]:after{content:'图片准备中';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:12px;color:#727781;pointer-events:none}
.film-content-wrap video{height:auto;aspect-ratio:854/480;object-fit:contain}
.film-player-tools{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;min-height:60px;padding:12px 0;color:#a7adba;font-size:13px}
.film-player-tools label{display:flex;align-items:center;gap:10px}.film-quality{background:#252a32;color:#f0f1f3;border:1px solid #596171;border-radius:25px;padding:8px 14px;font:inherit;cursor:pointer}.film-loading{font-size:12px}
`);
console.log('Integrated responsive static images and media manifests.');
