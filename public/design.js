import {normalizeDesign,download} from './design-model.js';
import * as T from './vendor/three.module.min.js';
const layoutStyle=document.createElement('link');layoutStyle.rel='stylesheet';layoutStyle.href='./design-layout.css';document.head.append(layoutStyle);
function arrangeDesignPanels(){
 const panel=document.querySelector('.design-panel'),cad=document.getElementById('import-cad-panel');
 if(!panel||!cad||panel.querySelector('.design-dimensions-panel'))return;
 const dimensions=document.createElement('section');dimensions.className='design-dimensions-panel';dimensions.setAttribute('aria-labelledby','dimension-heading');
 for(const child of [...panel.children])if(child!==cad)dimensions.append(child);
 const heading=dimensions.querySelector('h2');if(heading)heading.id='dimension-heading';
 panel.append(dimensions);
}
arrangeDesignPanels();
const builderAction=document.querySelector('.workspace-actions');
if(builderAction&&!builderAction.querySelector('[data-drawing-builder]')){
 const link=document.createElement('a');
 link.href='./drawing-builder.html';
 link.dataset.drawingBuilder='true';
 link.className='primary-link drawing-builder-entry';
 link.textContent='실제 도안 생성 ↗';
 builderAction.insertBefore(link,builderAction.firstChild);
}
const form=document.getElementById('dimension-form'),status=document.getElementById('design-feedback');
const manualApplyButton=form.querySelector('button[type="submit"]');
if(manualApplyButton)manualApplyButton.textContent='수동으로 다시 적용';
function fill(p){for(const key of ['face','diameter','shaft','left','right','grooveDepth','lead','starts'])if(p[key]!=null)form.elements[key].value=p[key];form.elements.kind.value=p.id==='grooved'?'grooved':'long';}
async function apply(raw,mode='manual'){
 try{
  const p=normalizeDesign(raw);
  await window.sj.applyDesign(p);
  if(mode!=='live')fill(p);
  status.textContent=mode==='live'?'자동 적용됨 · 3D·구조와 도면이 갱신되었습니다.':'치수를 적용했습니다. 3D·구조와 도면 탭에서 확인하세요.';
  return p;
 }catch(e){status.textContent=e.message;throw e;}
}
let liveTimer=null,liveApplying=false,liveQueued=false;
function readForm(){return {...Object.fromEntries(new FormData(form)),surface:window.sj.getDesign().surface};}
function scheduleLiveApply(){
 if(!window.sj)return;
 clearTimeout(liveTimer);
 liveTimer=setTimeout(async()=>{
  if(liveApplying){liveQueued=true;return;}
  liveApplying=true;
  try{await apply(readForm(),'live');}catch{}
  finally{
   liveApplying=false;
   if(liveQueued){liveQueued=false;scheduleLiveApply();}
  }
 },180);
}
form.addEventListener('input',scheduleLiveApply);
form.addEventListener('change',scheduleLiveApply);
form.addEventListener('submit',async e=>{e.preventDefault();try{await apply({...Object.fromEntries(new FormData(form)),surface:window.sj.getDesign().surface});}catch{}});
function current(){if(window.sj.getCad())throw new Error('업로드한 CAD는 원본 저장 또는 STL 저장을 이용하세요.');return normalizeDesign(window.sj.getDesign());}
document.getElementById('export-json').onclick=()=>{try{download(JSON.stringify(current(),null,2),'SJ-roll-design.json','application/json');status.textContent='현재 적용된 설계 파일을 저장했습니다.';}catch(e){status.textContent=e.message;}};
document.getElementById('import-design').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>100000)throw new Error('설계 파일은 100KB 이하만 열 수 있습니다.');await apply(JSON.parse(await f.text()));}catch(e){status.textContent=e.message;}e.target.value='';};
document.getElementById('save-png').onclick=()=>{const url=window.sj.snapshot();if(!url){status.textContent='3D 로딩이 끝난 뒤 다시 시도하세요.';return;}const a=document.createElement('a');a.href=url;a.download='SJ-roll-preview.png';a.click();};
document.getElementById('save-stl').onclick=()=>{const viewer=window.sj.getViewer();if(!viewer){status.textContent='3D 로딩이 끝난 뒤 다시 시도하세요.';return;}try{const model=viewer.model;const old=viewer.explosion;model.explode(0);model.root.updateMatrixWorld(true);const meshes=model.parts.map(r=>r.mesh);let count=0;for(const m of meshes)count+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;const buf=new ArrayBuffer(84+50*count),v=new DataView(buf);v.setUint32(80,count,true);let offset=84;const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),n=new T.Vector3(),ab=new T.Vector3(),ac=new T.Vector3();for(const m of meshes){const g=m.geometry,pos=g.attributes.position,idx=g.index,N=idx?.count||pos.count;for(let i=0;i<N;i+=3){[a,b,c].forEach((p,j)=>p.fromBufferAttribute(pos,idx?idx.getX(i+j):i+j).applyMatrix4(m.matrixWorld));n.crossVectors(ab.subVectors(b,a),ac.subVectors(c,a)).normalize();for(const p of [n,a,b,c])for(const x of [p.x,p.y,p.z]){v.setFloat32(offset,x,true);offset+=4;}v.setUint16(offset,0,true);offset+=2;}}model.explode(old,'staged');download(buf,'SJ-roll-concept-mm.stl');status.textContent='조립 상태의 STL을 저장했습니다. 단위 mm · 협의용 삼각망 모델입니다.';}catch(e){status.textContent='STL 저장 중 오류가 발생했습니다. 다시 시도해 주세요.';}};
document.getElementById('design-quote').onclick=async()=>{if(window.sj.getCad()){await window.sjCadQuote();return;}try{sessionStorage.removeItem('sj-studio-context');sessionStorage.setItem('sj-quote-draft',JSON.stringify(current()));location.href='./quote.html';}catch(e){status.textContent=e.message;}};
window.addEventListener('sj-product',e=>{if(e.detail.model==='roller')fill(e.detail);});
async function init(){let saved;try{saved=JSON.parse(sessionStorage.getItem('sj-design-draft')||'null');}catch{}const p=saved||{...Object.fromEntries(new FormData(form)),kind:new URLSearchParams(location.search).get('product')==='grooved'?'grooved':'long'};try{await apply(p);}catch{}}
if(window.sj)init();else window.addEventListener('sj-ready',init,{once:true});
