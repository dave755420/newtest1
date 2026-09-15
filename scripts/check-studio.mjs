import assert from 'node:assert/strict';
import fs from 'node:fs';
import {products} from '../public/catalog.js';
import {buildModel} from '../public/geometry.js';
import {phaseForPart,phaseLabels} from '../public/motion.js';
import {cleanRequirements,requirementsText} from '../public/requirements.js';
assert(!products.some(p=>p.id==='stand'));
for(const p of products){const model=buildModel(p);assert.equal(phaseLabels(p).length,6);for(let step=1;step<=5;step++){assert(model.parts.some(r=>phaseForPart(r,p)===step),p.id+' empty step '+step);model.explode(step/5,'staged');for(const part of model.parts){const phase=phaseForPart(part,p);if(phase>step||phase===0)assert(part.mesh.position.equals(part.home),p.id+' moved future layer');else assert(part.mesh.position.distanceTo(part.home.clone().add(part.offset))<1e-6);}}model.explode(.47,'staged');model.explode(0,'staged');for(const r of model.parts)assert(r.mesh.position.equals(r.home));model.dispose();}
const fields=cleanRequirements({work:'보수·재가공',hardness:'80',shore:'Shore A',condition:'표면 마모',rpm:'300',drawing:'R-100 REV B'});assert(requirementsText(products[0],fields).includes('REV B'));assert(requirementsText(products[0],fields).includes('협의 필요'));assert.throws(()=>cleanRequirements({hardness:80,shore:'협의 필요'}));assert.throws(()=>cleanRequirements({rpm:'not-a-number'}));
for(const name of ['index','studio','design','quote']){const html=fs.readFileSync('public/'+name+'.html','utf8'),ids=[...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,name+' duplicate id');for(const m of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)(?:[?#][^"]*)?"/g))assert(fs.existsSync('public/'+m[1]),name+' missing '+m[1]);assert(!html.includes('모니터 거치대'));}
console.log('PASS: five nonempty separation stages, future-layer isolation, exact restoration, specification validation and four page assets.');
