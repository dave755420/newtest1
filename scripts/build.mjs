import fs from 'node:fs';
// The pinned CAD dependency supplies its binary during build, keeping source uploads small.
fs.mkdirSync('public/vendor/cad',{recursive:true});
fs.copyFileSync('node_modules/occt-import-js/dist/occt-import-js.wasm','public/vendor/cad/occt-import-js.wasm');
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});fs.cpSync('public','dist/client',{recursive:true});fs.copyFileSync('worker/index.js','dist/server/index.js');fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');console.log('Built Worker and '+fs.readdirSync('public').filter(f=>f.endsWith('.html')).length+' static pages.');
