import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {prepareDxf,revolveProfile} from '../public/cad-dxf.js';
import {makeCadModel,makeRevolvedMesh,parseStl} from '../public/cad-model.js';
const require=createRequire(import.meta.url),DxfParser=require('dxf-parser');
const parsed=new DxfParser().parseSync(fs.readFileSync('public/samples/stepped-roll.dxf','utf8'));
const dxf=prepareDxf(parsed),roll=revolveProfile(dxf);
assert.equal(dxf.needsChoice,false);assert.equal(roll.length,800);assert.equal(roll.diameter,130);
let model=makeCadModel([makeRevolvedMesh(roll)]);
assert.deepEqual(model.size.toArray().map(Math.round),[800,130,130]);
// Radius at an axial position: the imported profile preserves the stepped shoulders.
assert(roll.profile.some(p=>p.axial===100&&p.radius===65));assert(roll.profile.some(p=>p.axial===100&&p.radius===25));model.dispose();
const missingUnit=structuredClone(dxf);missingUnit.unit=0;assert.throws(()=>revolveProfile(missingUnit),/단위/);
assert.equal(revolveProfile(missingUnit,{unit:'25.4'}).length,20320);
const vertical=structuredClone(parsed);for(const e of vertical.entities)for(const p of e.vertices||[])[p.x,p.y]=[p.y,p.x];const v=revolveProfile(prepareDxf(vertical));assert.equal(v.axis,'y');assert.equal(v.length,800);
const lines=structuredClone(parsed);const poly=lines.entities.shift();lines.entities.push(...poly.vertices.map((p,i)=>({type:'LINE',layer:'ROLL_PROFILE',vertices:[p,poly.vertices[(i+1)%poly.vertices.length]]})));assert.equal(revolveProfile(prepareDxf(lines)).diameter,130);
assert.throws(()=>prepareDxf({entities:[{type:'LINE',vertices:[{x:0,y:0},{x:100,y:0}]}]}),/닫힌 단면/);
const ambiguous=structuredClone(parsed);ambiguous.entities[0].layer='0';ambiguous.entities.push({...structuredClone(ambiguous.entities[0]),vertices:poly.vertices.map(p=>({x:p.x+1200,y:p.y}))});assert.equal(prepareDxf(ambiguous).needsChoice,true);
assert.throws(()=>parseStl(new TextEncoder().encode('not stl').buffer));
const occt=await require('occt-import-js')({print:()=>{},printErr:()=>{}});
for(const [file,reader] of [['Cube 10x10.stp','ReadStepFile'],['Cube 10x10.igs','ReadIgesFile']]){
 const bytes=fs.readFileSync('node_modules/occt-import-js/test/testfiles/cube-10x10mm/'+file);
 const result=occt[reader](bytes,{linearUnit:'millimeter'});assert(result.success&&result.meshes.length);
 model=makeCadModel(result.meshes.map(m=>({name:m.name,position:new Float32Array(m.attributes.position.array),index:new Uint32Array(m.index.array)})));
 assert(model.size.toArray().every(v=>Math.abs(v-10)<.001),file+' dimensions');model.dispose();
}
const bytes=fs.readFileSync('node_modules/occt-import-js/test/testfiles/cube-10x10mm/Cube 10x10.stl');
model=makeCadModel(parseStl(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)));assert(model.size.toArray().every(v=>Math.abs(v-10)<.001));model.dispose();
// Malformed geometry never reaches WebGL.
assert.throws(()=>makeCadModel([{position:new Float32Array([0,NaN,0])}]),/좌표/);
assert.throws(()=>makeCadModel([{position:new Float32Array([0,0,0,1,0,0,0,1,0]),index:new Uint32Array([0,1,90])}]),/면 데이터/);
console.log('PASS: real STEP / IGES / STL retain 10 mm dimensions; DXF 800 × 130 mm roll, shoulders, units, vertical axis, line stitching, ambiguity and invalid-file handling.');
