import fs from 'node:fs/promises';
import {build} from 'esbuild';
const parts=['dist/data.js','dist/image-manifest.js','dist/video-manifest.js','dist/app.js','src/sculpture-loader.js'];
const contents=(await Promise.all(parts.map(file=>fs.readFile(file,'utf8')))).join('\n;\n');
await build({stdin:{contents,resolveDir:process.cwd(),sourcefile:'portfolio-runtime.js'},outfile:'dist/portfolio.js',minify:true,format:'iife',target:'es2020',charset:'utf8',legalComments:'none'});
await build({entryPoints:['src/sculpture.js'],outfile:'dist/sculpture.js',bundle:true,minify:true,format:'iife',target:'es2020',legalComments:'none'});
console.log('Built one portfolio entry and the separately loaded 3D scene.');
