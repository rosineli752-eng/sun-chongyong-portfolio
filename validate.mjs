import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const root=path.resolve('dist');const context={window:{}};vm.runInNewContext(fs.readFileSync('dist/data.js','utf8'),context);const data=context.window.PORTFOLIO;const refs=new Set();
for(const p of data.projects){refs.add(p.cover);for(const i of p.images)refs.add(i.src);if(p.certificate)refs.add(p.certificate);}
for(const f of data.films){refs.add(f.src);refs.add(f.poster);if(f.certificate)refs.add(f.certificate);}
for(const a of data.awards)refs.add(a.pdf);
refs.add('assets/portrait.webp');refs.add('downloads/sun-chongyong-resume.docx');
for(const ref of refs){const file=path.resolve(root,ref);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))throw Error('Missing asset: '+ref);if(fs.statSync(file).size>25*1024*1024)throw Error('Asset exceeds hosting limit: '+ref);}
if(data.projects.length!==13||data.films.length!==5||data.awards.length!==8)throw Error('Incomplete content');
const crossroads=data.projects.find(p=>p.id==='crossroads'),beijing=data.projects.find(p=>p.id==='works');
if(crossroads.images.length!==1||!crossroads.images[0].src.endsWith('works-02-full.webp'))throw Error('Crossroads source mismatch');
if(beijing.images.length!==7||beijing.images.some(i=>i.src===crossroads.images[0].src))throw Error('Photography series overlap');
if(new Set(data.projects.map(p=>p.id)).size!==data.projects.length)throw Error('Duplicate project identifiers');
for(const name of ['app.js','data.js','sculpture.js'])new vm.Script(fs.readFileSync(path.join(root,name),'utf8'),{filename:name});
console.log(JSON.stringify({result:'passed',projects:data.projects.length,images:data.projects.reduce((n,p)=>n+p.images.length,0),films:data.films.length,awards:data.awards.length,verified_assets:refs.size}));
