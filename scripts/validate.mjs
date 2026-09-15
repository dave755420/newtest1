import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {products} from '../public/catalog.js';
import {makeSheet,referenceLength} from '../public/drawings.js';
import {buildModel,grooveRadius} from '../public/geometry.js';
import * as T from '../public/vendor/three.module.min.js';
let components=0,vertices=0;
for(const p of products){
 const model=buildModel(p);assert(model.parts.length>10);assert.equal(new Set(model.parts.map(r=>r.id)).size,model.parts.length);
 for(const r of model.parts){const a=r.mesh.geometry.getAttribute('position');assert(a.count>0);for(const n of a.array)assert(Number.isFinite(n),`${p.id} ${r.name}: nonfinite vertex`);vertices+=a.count;assert(r.role&&r.family);}
 for(const e of [0,.25,.5,.75,1]){model.explode(e);for(const r of model.parts){const expected=r.home.clone().addScaledVector(r.offset,e);assert(r.mesh.position.distanceTo(expected)<1e-7);}}
 model.explode(0);for(const r of model.parts)assert(r.mesh.position.equals(r.home));
 const box=new T.Box3().setFromObject(model.root);assert(!box.isEmpty());assert(box.min.toArray().concat(box.max.toArray()).every(Number.isFinite));
 for(const type of ['assembly','detail','exploded'])for(const scale of [1,1.25]){
  const sheet=makeSheet(p,type,scale);assert(sheet.svg.includes('viewBox="0 0 1200 800"'));assert(sheet.dxf.endsWith('0\nEOF\n'));assert(!sheet.svg.includes('NaN'));assert(sheet.entities.length>10);assert(sheet.svg.includes('가정값'));assert.equal(referenceLength(sheet.p),referenceLength(p)*scale);
  for(const e of sheet.entities)for(const n of Object.values(e).filter(v=>typeof v==='number'))assert(Number.isFinite(n));
  if(scale===1)assert.equal(fs.readFileSync(new URL(`../public/drawings/${p.id}-${type}.svg`,import.meta.url),'utf8'),sheet.svg);
 }
 for(const name of [p.photo,p.clean,p.extra].filter(Boolean))assert(fs.statSync(new URL('../public/assets/'+name,import.meta.url)).size>1000);
 console.log(`${p.id}: ${model.parts.length} selectable components; restoration, dimensions and drawings pass`);components+=model.parts.length;model.dispose();
}
const p=products[0],x=220,a=2*Math.PI*x/p.lead;assert(grooveRadius(x,a,p)<p.diameter/2-3.9);assert(grooveRadius(x,a+Math.PI/p.starts,p)>p.diameter/2-.01);assert(Math.abs(grooveRadius(x,a,p)-grooveRadius(-x,a,p))<1e-8);assert(grooveRadius(0,0,p)===p.diameter/2);
const html=fs.readFileSync(new URL('../public/products.html',import.meta.url),'utf8'),app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);assert.equal(ids.length,new Set(ids).size);for(const m of app.matchAll(/(?<!\$)\$\('([^']+)'\)/g))assert(ids.includes(m[1]),`missing control ${m[1]}`);
for(const m of html.matchAll(/(?:src|href)="(\.\/[^"#?]+)"/g))assert(fs.existsSync(path.join('public',m[1])),m[1]);
assert(!html.includes('data-product="machine"'));assert(fs.readFileSync('public/company.html','utf8').includes('현재 제작하지 않는 장비'));assert(html.includes('noindex,nofollow'));
console.log(`PASS: ${products.length} product models, ${components} components, ${vertices} vertices; physical recesses; original/clean photo paths; 18 SVG/DXF pairs; controls and noindex.`);
