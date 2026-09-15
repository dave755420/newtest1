import {makeCadModel,makeRevolvedMesh,parseStl} from './cad-model.js';
import {revolveProfile,profileSvg} from './cad-dxf.js';
import {download} from './design-model.js';
import {saveCadDraft} from './cad-store.js';
const $=id=>document.getElementById(id),panel=$('import-cad-panel'),status=$('cad-status');
let worker=null,timer=null,revision=0,activeFile=null,pendingFile=null,dxf=null,rawStl=null,svgUrl=null;
function message(text,error=false){status.textContent=text;status.dataset.error=String(error);}
function busy(value){$('cad-progress').hidden=!value;$('import-cad').disabled=value;$('cad-reapply').disabled=value;panel.setAttribute('aria-busy',String(value));}
function cancel(){revision++;worker?.terminate();worker=null;clearTimeout(timer);busy(false);}
function workerRead(buffer,format){return new Promise((resolve,reject)=>{worker=new Worker(new URL('./cad-worker.js',import.meta.url));worker.onmessage=e=>{clearTimeout(timer);worker?.terminate();worker=null;e.data.success?resolve(e.data):reject(new Error(e.data.error));};worker.onerror=()=>{clearTimeout(timer);worker?.terminate();worker=null;reject(new Error('도면 변환기를 불러오지 못했습니다. 다시 시도해 주세요.'));};timer=setTimeout(()=>{worker?.terminate();worker=null;reject(new Error('변환 시간이 길어졌습니다. 단순화한 파일로 다시 시도해 주세요.'));},90000);worker.postMessage({buffer,format},[buffer]);});}
async function display(items,file,note,svg=null){const model=makeCadModel(items),oldSvg=svgUrl;const nextSvg=svg?URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})):null;
 try{await window.sj.loadCad(model,{name:file.name,format:file.name.split('.').pop().toUpperCase(),note,svg:nextSvg});}catch(e){model.dispose();if(nextSvg)URL.revokeObjectURL(nextSvg);throw e;}
 svgUrl=nextSvg;if(oldSvg)URL.revokeObjectURL(oldSvg);activeFile=file;
 $('cad-result').hidden=false;$('cad-file-name').textContent=file.name;$('cad-file-summary').textContent=`${model.parts.length}개 형상 · ${model.size.toArray().map(v=>v.toFixed(2)).join(' × ')} mm\n${note}`;
 message('3D에 적용했습니다. 회전·소재·단면을 확인하세요.');$('export-json').disabled=true;
}
function optionsFor(kind){$('cad-options').hidden=!['dxf','stl'].includes(kind);for(const id of ['cad-profile','cad-axis','cad-axis-position'])$(id).closest('label').hidden=kind!=='dxf';$('cad-unit').querySelector('[value="auto"]').disabled=kind==='stl';$('cad-axis').value='auto';$('cad-axis-position').value='';$('cad-unit').value=kind==='stl'?'1':'auto';}
async function applyDxf(){const p=$('cad-profile').value,result=revolveProfile(dxf,{profile:p,axis:$('cad-axis').value,unit:$('cad-unit').value,axisPosition:$('cad-axis-position').value});const selected=dxf.profiles.find(x=>x.id===p)||dxf.profiles[0];await display([makeRevolvedMesh(result)],pendingFile,`DXF 회전체 · ${result.assumption} · 숨은 구멍·홈은 미포함`,profileSvg(dxf,selected));}
async function applyStl(){const factor=Number($('cad-unit').value)||1;const items=rawStl.map(m=>({...m,position:new Float32Array(m.position.map(n=>n*factor))}));await display(items,pendingFile,`STL 삼각망 · 좌표 단위 ${$('cad-unit').selectedOptions[0].textContent}`);}
async function read(file){
 if(!file)return;cancel();const run=revision;
 const format=file.name.split('.').pop().toLowerCase();
 if(!['step','stp','iges','igs','stl','dxf'].includes(format)){message('STEP·IGES·STL·DXF를 선택하세요. DWG는 DXF로 내보내고, PDF·사진 도면은 견적문의에 첨부해 주세요.',true);return;}
 if(!file.size||file.size>20*1024*1024){message('0바이트 파일은 열 수 없습니다. 도면은 파일당 20MB까지 가능합니다.',true);return;}
 busy(true);message('도면을 분석하고 있습니다…');
 try{const buffer=await file.arrayBuffer();if(run!==revision)return;
  if(format==='stl'){const parsed=parseStl(buffer);rawStl=parsed;dxf=null;pendingFile=file;optionsFor('stl');await applyStl();}
  else{const result=await workerRead(buffer,format);if(run!==revision)return;
   if(format==='dxf'){dxf=result.dxf;rawStl=null;pendingFile=file;optionsFor('dxf');$('cad-profile').replaceChildren(...dxf.profiles.map((p,i)=>{const option=document.createElement('option');option.value=p.id;option.textContent=`${i+1}. ${p.layer} · ${(p.bounds.maxX-p.bounds.minX).toFixed(1)} × ${(p.bounds.maxY-p.bounds.minY).toFixed(1)}`;return option;}));
    if(dxf.needsChoice){message('닫힌 외형이 여러 개 있습니다. 롤 단면과 단위를 선택하고 적용해 주세요.');}
    else await applyDxf();
   }else{await display(result.meshes,file,'원본 CAD 형상 · 단위 mm');dxf=null;rawStl=null;pendingFile=file;optionsFor(format);}
  }
 }catch(e){if(run===revision)message(e.message||'도면을 읽지 못했습니다.',true);}finally{if(run===revision)busy(false);}
}
async function loadSample(link){
 const url=link.href,filename=new URL(url,location.href).pathname.split('/').pop()||'SJ-sample.step';
 message('샘플 도면을 불러오는 중입니다…');
 try{const response=await fetch(url);if(!response.ok)throw new Error(`샘플 파일을 불러오지 못했습니다. (${response.status})`);const blob=await response.blob();await read(new File([blob],filename,{type:blob.type||'application/octet-stream'}));}
 catch(e){message(e.message||'샘플 도면을 불러오지 못했습니다.',true);}
}
$('import-cad').addEventListener('change',e=>{read(e.target.files[0]);e.target.value='';});
document.querySelector('.cad-sample-links')?.addEventListener('click',e=>{const link=e.target.closest('a[download]');if(!link)return;e.preventDefault();loadSample(link);});
panel.addEventListener('dragover',e=>{e.preventDefault();panel.classList.add('dragging');});panel.addEventListener('dragleave',()=>panel.classList.remove('dragging'));panel.addEventListener('drop',e=>{e.preventDefault();panel.classList.remove('dragging');if(e.dataTransfer.files.length!==1){message('한 번에 도면 한 개를 선택해 주세요.',true);return;}read(e.dataTransfer.files[0]);});
$('cad-cancel').onclick=()=>{cancel();message('도면 불러오기를 취소했습니다.');};
$('cad-reapply').onclick=async()=>{try{if(dxf)await applyDxf();else if(rawStl)await applyStl();}catch(e){message(e.message,true);}};
$('cad-source').onclick=()=>{if(activeFile)download(activeFile,activeFile.name);};
$('cad-clear').onclick=()=>{cancel();$('dimension-form').requestSubmit();};
window.addEventListener('sj-cad-clear',()=>{activeFile=null;$('cad-result').hidden=true;$('export-json').disabled=false;if(svgUrl)URL.revokeObjectURL(svgUrl);svgUrl=null;message('치수 입력 방식으로 전환했습니다.');});
window.sjCadQuote=async()=>{if(!activeFile)return;try{const info=window.sj.getCad();await saveCadDraft(activeFile,{name:activeFile.name,format:info.format,size:info.size,note:info.note});sessionStorage.removeItem('sj-quote-draft');sessionStorage.removeItem('sj-studio-context');location.href='./quote.html';}catch(e){message(e.message,true);}};
window.addEventListener('pagehide',()=>{cancel();if(svgUrl)URL.revokeObjectURL(svgUrl);});
