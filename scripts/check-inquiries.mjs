import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {normalizeDesign} from '../public/design-model.js';
import {buildModel} from '../public/geometry.js';
import {makeSheet} from '../public/drawings.js';
class Bucket{data=new Map();async put(k,b){const bytes=await new Response(b).arrayBuffer();this.data.set(k,bytes);}async get(k){const bytes=this.data.get(k);return bytes?{body:bytes,json:async()=>JSON.parse(new TextDecoder().decode(bytes))}:null;}async head(k){return this.data.has(k)?{}:null;}async delete(k){this.data.delete(k);}async list({prefix}){return {objects:[...this.data.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key})),truncated:false};}}
const env={BUCKET:new Bucket()},origin='https://example.com';
function request(path,method='GET',body=null,user='user-a'){return new Request(origin+path,{method,body,headers:{origin,...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':user+'@example.com'}:{})}});}
function form(){const f=new FormData();for(const [k,v] of Object.entries({requestId:crypto.randomUUID(),company:'테스트 제조',name:'검증용',email:'test@example.com',phone:'010-0000-0000',type:'신규 롤 제작',quantity:'2',message:'도면 검토',consent:'on'}))f.set(k,v);f.append('files',new Blob(['drawing']),'test.dxf');return f;}
assert.equal((await worker.fetch(request('/api/requests','GET',null,null),env)).status,401);
const f=form(),res=await worker.fetch(request('/api/requests','POST',f),env);assert.equal(res.status,201);const {id}=await res.json();assert(id);assert.equal((await worker.fetch(request('/api/requests','POST',f),env)).status,200);
let list=await (await worker.fetch(request('/api/requests'),env)).json();assert.equal(list.items.length,1);assert.equal(list.items[0].files[0].name,'test.dxf');
assert.equal((await worker.fetch(request(`/api/requests/${id}/files/0`,'GET',null,'other'),env)).status,404);
assert.equal(await (await worker.fetch(request(`/api/requests/${id}/files/0`),env)).text(),'drawing');
const bad=form();bad.set('quantity','-3');assert.equal((await worker.fetch(request('/api/requests','POST',bad),env)).status,400);
const badfile=form();badfile.append('files',new Blob(['bad']),'run.exe');assert.equal((await worker.fetch(request('/api/requests','POST',badfile),env)).status,400);
const oversized=form();oversized.append('files',new Blob([new Uint8Array(20*1024*1024+1)]),'large.pdf');assert.equal((await worker.fetch(request('/api/requests','POST',oversized),env)).status,400);
const cross=request('/api/requests','POST',form());cross.headers.set('origin','https://other.example');assert.equal((await worker.fetch(cross,env)).status,403);
assert.equal((await worker.fetch(request('/api/requests/'+id,'DELETE'),env)).status,200);assert.equal(env.BUCKET.data.size,0);
for(const kind of ['long','grooved']){const p=normalizeDesign({kind,face:1000,diameter:240,shaft:70,left:300,right:200,surface:'rubber'});const m=buildModel(p);for(const part of m.parts)assert([...part.mesh.geometry.attributes.position.array].every(Number.isFinite));assert(makeSheet(p,'assembly',1).svg.includes('1000'));m.dispose();}
assert.throws(()=>normalizeDesign({kind:'long',diameter:60,shaft:100}));assert.throws(()=>normalizeDesign({kind:'long',surface:'invalid'}));
console.log('PASS: authenticated submission, attachments, idempotency, ownership, invalid dimensions/files, CSRF and deletion.');
