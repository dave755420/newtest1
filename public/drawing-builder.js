const form=document.getElementById('drawing-form');
const preview=document.getElementById('drawing-preview');
const status=document.getElementById('builder-status');
const stateBadge=document.getElementById('preview-state');
const checklist=document.getElementById('checklist');
const checklistCount=document.getElementById('checklist-count');
const overallOutput=document.getElementById('overall-output');
const numberFields=['face','bodyOd','bodyId','shaft','left','right','leftSeatDia','leftSeatLength','rightSeatDia','rightSeatLength','grooveDepth','grooveLead','grooveStarts'];
const defaults={project:'승지정밀산업롤 시제품',customer:'',drawingNo:'SJ-R-001',revision:'A',unit:'mm',role:'guide',type:'solid',face:800,bodyOd:220,bodyId:120,shaft:70,left:300,right:300,leftSeatDia:70,leftSeatLength:90,rightSeatDia:70,rightSeatLength:90,pattern:'plain',grooveDepth:4,grooveLead:680,grooveStarts:8,material:'S45C / KS D 3752',surface:'machined',hardness:'HB 180–220 / 협의',faceTol:'±0.10 mm',odTol:'±0.05 mm',shaftTol:'h6 / 협의',runout:'0.08 mm TIR',concentricity:'0.05 mm',roughness:'Ra 0.8 μm',balance:'G6.3 / 협의',datum:'A = 몸통 회전축',speed:'협의 rpm',notes:'도면 확정 전 설치 장치, 베어링, 하중, 속도와 온도 조건을 확인한다.\n최종 제작은 승인 도면과 검사 기준에 따라 진행한다.'};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=value=>Number(value||0).toLocaleString('ko-KR',{maximumFractionDigits:2});
const val=name=>form.elements[name]?.value??'';
const num=name=>Number(val(name));
function readState(){const state={};for(const key of Object.keys(defaults))state[key]=val(key);for(const key of numberFields)state[key]=num(key);return state;}
function setState(data){const next=Object.assign({},defaults,data);for(const key of Object.keys(defaults)){const el=form.elements[key];if(el)el.value=next[key]??'';}toggleFields();updateOverall();}
function toggleFields(){const hollow=val('type')==='hollow',groove=val('pattern')!=='plain';form.querySelectorAll('.hollow-only input').forEach(el=>{el.disabled=!hollow;el.setAttribute('aria-disabled',String(!hollow));});form.querySelectorAll('.groove-only input').forEach(el=>{el.disabled=!groove;el.setAttribute('aria-disabled',String(!groove));});}
function updateOverall(){const overall=num('left')+num('face')+num('right');overallOutput.textContent=Number.isFinite(overall)?fmt(overall)+' '+(val('unit')||'mm'):'입력 필요';}
function validate(state){
 const errors=[],warnings=[];
 const required={face:'몸통 면장',bodyOd:'몸통 외경',shaft:'기본 축 지름',left:'좌측 축 길이',right:'우측 축 길이',leftSeatDia:'좌측 시트 지름',leftSeatLength:'좌측 시트 길이',rightSeatDia:'우측 시트 지름',rightSeatLength:'우측 시트 길이'};
 for(const [key,label] of Object.entries(required))if(!Number.isFinite(state[key])||state[key]<=0)errors.push(label+'을(를) 0보다 크게 입력하세요.');
 if(state.face<50||state.face>10000)errors.push('몸통 면장은 50~10,000 범위로 입력하세요.');
 if(state.bodyOd<20||state.bodyOd>2000)errors.push('몸통 외경은 20~2,000 범위로 입력하세요.');
 if(state.shaft>=state.bodyOd*.66)errors.push('기본 축 지름이 몸통 외경에 비해 큽니다. 축·몸통 비율을 확인하세요.');
 if(state.bodyOd<=state.shaft+10)errors.push('몸통 외경은 축 지름보다 최소 10 이상 크게 입력하세요.');
 if(state.type==='hollow'){if(!Number.isFinite(state.bodyId)||state.bodyId<=0)errors.push('중공 롤은 내경을 입력하세요.');else if(state.bodyId>=state.bodyOd-10)errors.push('중공 롤은 외경과 내경 사이에 5 이상 벽 두께를 남겨야 합니다.');}
 for(const side of ['left','right']){const dia=state[side==='left'?'leftSeatDia':'rightSeatDia'],length=state[side==='left'?'leftSeatLength':'rightSeatLength'];if(dia>=state.bodyOd)errors.push((side==='left'?'좌측':'우측')+' 베어링 시트 지름은 몸통 외경보다 작아야 합니다.');if(length>state[side])errors.push((side==='left'?'좌측':'우측')+' 베어링 시트 길이가 축 길이보다 깁니다.');}
 if(state.pattern!=='plain'){if(!Number.isFinite(state.grooveDepth)||state.grooveDepth<=0)errors.push('홈 패턴은 홈 깊이를 입력하세요.');if(state.grooveDepth>=state.bodyOd/2)errors.push('홈 깊이가 외경 반지름보다 큽니다.');if(!Number.isFinite(state.grooveLead)||state.grooveLead<=0)errors.push('홈 패턴은 리드·피치 기준을 입력하세요.');if(!Number.isInteger(state.grooveStarts)||state.grooveStarts<1)errors.push('시작 수는 1 이상의 정수로 입력하세요.');}
 if(state.bodyOd>0&&state.face/state.bodyOd>15)warnings.push('면장/외경 비가 커 장축 롤입니다. 지지·가공 순서·직진도를 별도로 검토하세요.');
 if(!String(state.runout).trim())warnings.push('방사 런아웃 기준이 비어 있습니다.');
 if(!String(state.balance).trim())warnings.push('밸런스 등급 또는 협의 조건을 입력하세요.');
 if(!String(state.datum).trim())warnings.push('기준 데이텀을 입력하면 검사 기준이 분명해집니다.');
 if(!String(state.material).trim())warnings.push('모재를 입력하세요.');
 return {errors,warnings};
}
function setStatus(message,kind){status.textContent=message;status.className='builder-status '+(kind||'');}
function checklistRender(state,result){
 const items=[
  ['치수 범위와 전체 길이',!result.errors.some(e=>e.includes('길이')||e.includes('면장')||e.includes('외경')||e.includes('축'))],
  ['몸통 외경·내경·벽 두께',!result.errors.some(e=>e.includes('내경')||e.includes('벽 두께')||e.includes('몸통 외경'))],
  ['좌우 베어링 시트',!result.errors.some(e=>e.includes('베어링 시트'))],
  ['표면 패턴과 홈 조건',!result.errors.some(e=>e.includes('홈'))],
  ['재질·표면처리·경도',Boolean(String(state.material).trim()&&String(state.surface).trim()&&String(state.hardness).trim())],
  ['공차·런아웃·동심도',Boolean(String(state.faceTol).trim()&&String(state.odTol).trim()&&String(state.runout).trim()&&String(state.concentricity).trim())],
  ['거칠기·밸런스·데이텀',Boolean(String(state.roughness).trim()&&String(state.balance).trim()&&String(state.datum).trim())],
  ['장치 하중·속도·온도 확인',false]
 ];
 checklist.innerHTML=items.map(([label,ok])=>'<li class="'+(ok?'ok':label.includes('장치')?'warning':'')+'">'+esc(label)+(label.includes('장치')?' · 최종 협의':'')+'</li>').join('');
 checklistCount.textContent=items.filter(([,yes])=>yes).length+'/'+items.length;
}
function text(x,y,value,className,anchor){return '<text x="'+x+'" y="'+y+'" class="'+(className||'drawing-small')+'" text-anchor="'+(anchor||'start')+'">'+esc(value)+'</text>';}
function line(x1,y1,x2,y2,className){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="'+(className||'dim-line')+'"/>';}
function hDim(x1,x2,y,refY,label){return '<g>'+line(x1,refY,x1,y)+line(x2,refY,x2,y)+line(x1,y,x2,y)+'<path d="M'+x1+','+y+' l10,-4 v8 Z M'+x2+','+y+' l-10,-4 v8 Z" fill="#534775"/>'+text((x1+x2)/2,y-8,label,'dim-text','middle')+'</g>';}
function vDim(x,y1,y2,refX,label){return '<g>'+line(refX,y1,x,y1)+line(refX,y2,x,y2)+line(x,y1,x,y2)+'<path d="M'+x+','+y1+' l-4,10 h8 Z M'+x+','+y2+' l-4,-10 h8 Z" fill="#534775"/>'+text(x+9,(y1+y2)/2,label,'dim-text','start')+'</g>';}
function buildSvg(state){
 const overall=state.left+state.face+state.right;
 const x0=80,cy=268,s=Math.min(900/overall,185/state.bodyOd),x=value=>x0+value*s;
 const bodyStart=x(state.left),bodyEnd=x(state.left+state.face),end=x(overall),bodyH=state.bodyOd*s,shaftH=state.shaft*s,leftSeatH=state.leftSeatDia*s,rightSeatH=state.rightSeatDia*s,top=cy-bodyH/2;
 const sectionX=1165,sectionY=258,sectionR=100,innerR=state.type==='hollow'?Math.max(8,sectionR*state.bodyId/state.bodyOd):0;
 let shapes='';
 const rect=(x1,x2,h,cls)=>'<rect x="'+x1+'" y="'+(cy-h/2)+'" width="'+Math.max(1,x2-x1)+'" height="'+h+'" class="'+cls+'"/>';
 shapes+=rect(x0,bodyStart,shaftH,'shaft')+rect(bodyStart,bodyEnd,bodyH,'outline')+rect(bodyEnd,end,shaftH,'shaft');
 if(state.leftSeatLength>0)shapes+=rect(x(state.left-state.leftSeatLength),bodyStart,leftSeatH,'shaft');
 if(state.rightSeatLength>0)shapes+=rect(bodyEnd,x(state.left+state.face+state.rightSeatLength),rightSeatH,'shaft');
 if(state.type==='hollow')shapes+=line(bodyStart,cy,bodyEnd,cy,'bore-line');
 shapes+=line(x0-25,cy,end+30,cy,'centerline');
 if(state.pattern!=='plain'){const n=Math.max(3,Math.min(13,Math.round(state.face/Math.max(state.grooveLead,1)*4+5)));for(let i=-2;i<n;i++){const gx1=bodyStart+(i/n)*(bodyEnd-bodyStart),gx2=gx1+(bodyEnd-bodyStart)*.18;shapes+=line(gx1,top+4,gx2,top+bodyH-4,'groove-line');if(state.pattern==='chevron')shapes+=line(gx1,top+bodyH-4,gx2,top+4,'groove-line');}}
 const notes=['재질: '+(state.material||'미입력'),'표면: '+surfaceLabel(state.surface),'면장 공차: '+(state.faceTol||'협의'),'외경 공차: '+(state.odTol||'협의'),'축 시트: '+(state.shaftTol||'협의'),'런아웃: '+(state.runout||'협의'),'거칠기: '+(state.roughness||'협의'),'밸런스: '+(state.balance||'협의')];
 const noteRows=notes.map((v,i)=>text(80,575+i*20,v,'drawing-small')).join('');
 const titleBlock='<rect x="1010" y="570" width="330" height="172" class="title-block"/><line x1="1010" y1="610" x2="1340" y2="610" stroke="#9fa8af"/><line x1="1010" y1="650" x2="1340" y2="650" stroke="#9fa8af"/><line x1="1010" y1="690" x2="1340" y2="690" stroke="#9fa8af"/><line x1="1195" y1="570" x2="1195" y2="742" stroke="#9fa8af"/>'+text(1022,595,'DRAWING NO.','drawing-small')+text(1206,595,state.drawingNo||'SJ-R-001','drawing-label')+text(1022,635,'PROJECT','drawing-small')+text(1206,635,state.project||'ROLLER','drawing-small')+text(1022,675,'REVISION','drawing-small')+text(1206,675,state.revision||'A','drawing-label')+text(1022,715,'UNIT','drawing-small')+text(1206,715,state.unit||'mm','drawing-label')+text(1022,738,'PRELIMINARY / REVIEW','drawing-small');
 const noteLines=String(state.notes||'').split(/\r?\n/).filter(Boolean).slice(0,3).map((v,i)=>text(80,770+i*17,v,'drawing-small')).join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 820" role="img" aria-label="'+esc(state.project)+' 롤 제작 검토 도면"><rect width="1400" height="820" fill="#f8f9f9"/>'+text(80,42,state.project||'롤 제작 검토 도면','drawing-title')+text(80,65,(state.drawingNo||'SJ-R-001')+' · REV '+(state.revision||'A')+' · '+(state.unit||'mm'),'drawing-small')+text(80,105,'A-A  정면도','drawing-label')+shapes+hDim(x0,end,450,cy+bodyH/2,'전체 길이 '+fmt(overall)+' '+state.unit)+hDim(x0,bodyStart,410,cy+shaftH/2,'좌측 축 '+fmt(state.left)+' '+state.unit)+hDim(bodyStart,bodyEnd,150,top,'몸통 면장 '+fmt(state.face)+' '+state.unit)+hDim(bodyEnd,end,410,cy+shaftH/2,'우측 축 '+fmt(state.right)+' '+state.unit)+vDim(bodyEnd+58,top,cy+bodyH/2,bodyEnd,'Ø'+fmt(state.bodyOd))+vDim(bodyStart-40,cy-shaftH/2,cy+shaftH/2,bodyStart,'Ø'+fmt(state.shaft))+text(sectionX-100,105,'B-B  단면','drawing-label')+'<circle cx="'+sectionX+'" cy="'+sectionY+'" r="'+sectionR+'" class="section-fill"/>'+(state.type==='hollow'?'<circle cx="'+sectionX+'" cy="'+sectionY+'" r="'+innerR+'" fill="#f8f9f9" stroke="#263c50" stroke-width="2"/>':'')+line(sectionX-sectionR-18,sectionY,sectionX+sectionR+18,sectionY,'centerline')+line(sectionX,sectionY-sectionR-18,sectionX,sectionY+sectionR+18,'centerline')+text(sectionX,sectionY+sectionR+30,'외경 Ø'+fmt(state.bodyOd)+(state.type==='hollow'?' · 내경 Ø'+fmt(state.bodyId):''),'drawing-small','middle')+text(80,535,'제작 조건 / 검사 기준','drawing-label')+noteRows+titleBlock+text(80,750,'NOTE','drawing-label')+noteLines+text(1340,790,'SJ / DRAWING BUILDER','drawing-small','end')+'</svg>';
}
function surfaceLabel(value){return ({machined:'기계가공',chrome:'경질 크롬 도금',rubber:'고무 피복',urethane:'우레탄 피복',ivory:'아이보리 피복',heating:'히팅·냉각 협의'}[value]||value||'협의');}
function dxfPair(code,value){return code+'\n'+value+'\n';}
function buildDxf(state){
 const L=[];
 const add=(layer,x1,y1,x2,y2)=>{L.push(dxfPair(0,'LINE'),dxfPair(8,layer),dxfPair(10,x1),dxfPair(20,y1),dxfPair(30,0),dxfPair(11,x2),dxfPair(21,y2),dxfPair(31,0));};
 const txt=(layer,x,y,value,h=12)=>{L.push(dxfPair(0,'TEXT'),dxfPair(8,layer),dxfPair(10,x),dxfPair(20,y),dxfPair(30,0),dxfPair(40,h),dxfPair(1,String(value).replace(/[\r\n]/g,' ')));};
 const circle=(layer,x,y,r)=>{L.push(dxfPair(0,'CIRCLE'),dxfPair(8,layer),dxfPair(10,x),dxfPair(20,y),dxfPair(30,0),dxfPair(40,r));};
 const od=state.bodyOd/2,overall=state.left+state.face+state.right,bodyStart=state.left,bodyEnd=state.left+state.face;
 const rect=(x1,x2,h,layer)=>{layer=layer||'OUTLINE';add(layer,x1,h/2,x2,h/2);add(layer,x1,-h/2,x2,-h/2);add(layer,x1,-h/2,x1,h/2);add(layer,x2,-h/2,x2,h/2);};
 rect(0,bodyStart,state.shaft,'SHAFT');rect(bodyStart,bodyEnd,state.bodyOd);rect(bodyEnd,overall,state.shaft,'SHAFT');
 if(state.leftSeatLength)rect(bodyStart-state.leftSeatLength,bodyStart,state.leftSeatDia,'SHAFT');
 if(state.rightSeatLength)rect(bodyEnd,bodyEnd+state.rightSeatLength,state.rightSeatDia,'SHAFT');
 add('CENTER',-30,0,overall+30,0);
 const dim=(x1,x2,y,label)=>{add('DIM',x1,y,x2,y);add('DIM',x1,0,x1,y);add('DIM',x2,0,x2,y);txt('TEXT',(x1+x2)/2,y+18,label,12);};
 dim(0,overall,-state.bodyOd/2-100,'OVERALL '+fmt(overall)+' '+state.unit);dim(0,bodyStart,-state.bodyOd/2-55,'LEFT '+fmt(state.left));dim(bodyStart,bodyEnd,state.bodyOd/2+55,'FACE '+fmt(state.face));dim(bodyEnd,overall,-state.bodyOd/2-55,'RIGHT '+fmt(state.right));
 txt('TEXT',bodyEnd+70,od,'BODY OD '+fmt(state.bodyOd));txt('TEXT',bodyEnd+70,-od,'SHAFT OD '+fmt(state.shaft));
 const sectionX=overall+Math.max(state.bodyOd*1.7,450);circle('OUTLINE',sectionX,0,od);if(state.type==='hollow')circle('OUTLINE',sectionX,0,state.bodyId/2);add('CENTER',sectionX-od-25,0,sectionX+od+25,0);add('CENTER',sectionX,-od-25,sectionX,od+25);txt('TEXT',sectionX-od,od+45,'SECTION B-B',12);txt('TEXT',sectionX-od,-od-45,'OD '+fmt(state.bodyOd)+' / ID '+(state.type==='hollow'?fmt(state.bodyId):'SOLID'),12);txt('TEXT',0,-state.bodyOd/2-180,'MATERIAL '+(state.material||'TBD')+' | SURFACE '+surfaceLabel(state.surface),12);txt('TEXT',0,-state.bodyOd/2-205,'TOL '+(state.odTol||'TBD')+' | RUNOUT '+(state.runout||'TBD')+' | BALANCE '+(state.balance||'TBD'),12);
 const layers=['0','OUTLINE','SHAFT','CENTER','DIM','TEXT'];
 let out=dxfPair(0,'SECTION')+dxfPair(2,'HEADER')+dxfPair(0,'ENDSEC')+dxfPair(0,'SECTION')+dxfPair(2,'TABLES')+dxfPair(0,'TABLE')+dxfPair(2,'LAYER')+dxfPair(70,layers.length);
 for(const layer of layers)out+=dxfPair(0,'LAYER')+dxfPair(2,layer)+dxfPair(70,0)+dxfPair(62,layer==='CENTER'?1:layer==='DIM'?6:7)+dxfPair(6,layer==='CENTER'?'CENTER':layer==='DIM'?'DASHED':'CONTINUOUS');
 out+=dxfPair(0,'ENDTAB')+dxfPair(0,'ENDSEC')+dxfPair(0,'SECTION')+dxfPair(2,'ENTITIES')+L.join('')+dxfPair(0,'ENDSEC')+dxfPair(0,'EOF');
 return '999\nSJ DRAWING BUILDER · PRELIMINARY REVIEW\n0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1009\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n'+out;
}
function download(data,name,type){const blob=data instanceof Blob?data:new Blob([data],{type:type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function render(state,result,generated){
 checklistRender(state,result);
 if(result.errors.length){stateBadge.textContent='수정 필요';stateBadge.className='state-badge warn';setStatus(result.errors[0],'error');return false;}
 preview.innerHTML=buildSvg(state);
 stateBadge.textContent=result.warnings.length?'검토 필요':'생성 완료';
 stateBadge.className='state-badge '+(result.warnings.length?'warn':'valid');
 setStatus(generated?(result.warnings.length?'도안을 생성했습니다. '+result.warnings.length+'개 항목은 제작 전 협의가 필요합니다.':'도안을 생성했습니다. SVG·DXF·JSON으로 저장할 수 있습니다.'):'기본값으로 도면이 준비되었습니다.',result.warnings.length?'':'success');
 return true;
}
function generate(){toggleFields();const state=readState(),result=validate(state);updateOverall();return {state:state,result:result,ok:render(state,result,true)};}
function saveLocal(){const state=readState();localStorage.setItem('sj-drawing-builder-draft',JSON.stringify(Object.assign({},state,{savedAt:new Date().toISOString()})));setStatus('현재 입력값을 이 기기에 임시 저장했습니다.','success');}
function saveJson(){const r=generate();if(r.result.errors.length)return;download(JSON.stringify(Object.assign({},r.state,{format:'sj-roller-drawing-v1',savedAt:new Date().toISOString()}),null,2),(r.state.drawingNo||'SJ-R-001')+'-drawing.json','application/json');setStatus('도안 JSON을 저장했습니다.','success');}
function sendTo3d(){const r=generate();if(r.result.errors.length)return;const state=r.state,kind=state.pattern==='plain'?'long':'grooved',surface={machined:'steel',chrome:'chrome',rubber:'rubber',urethane:'urethane',ivory:'ivory',heating:'steel'}[state.surface]||'original';const draft={kind:kind,face:Math.round(state.face),diameter:Math.round(state.bodyOd),shaft:Math.round(state.shaft),left:Math.round(state.left),right:Math.round(state.right),grooveDepth:Math.max(1,Math.round(state.grooveDepth||4)),lead:Math.max(100,Math.round(state.grooveLead||680)),starts:Math.max(2,Math.min(16,Math.round(state.grooveStarts||8))),surface:surface};sessionStorage.setItem('sj-design-draft',JSON.stringify(draft));location.href='./design.html?product='+kind;}
form.addEventListener('input',()=>{toggleFields();updateOverall();});
form.addEventListener('change',()=>{toggleFields();updateOverall();});
document.getElementById('validate-drawing').addEventListener('click',()=>{const r=generate();if(!r.result.errors.length)setStatus(r.result.warnings.length?'입력값을 확인했습니다. 주황색 항목은 제작 전 협의가 필요합니다.':'입력값을 확인했습니다. 도안을 생성할 수 있습니다.',r.result.warnings.length?'':'success');});
document.getElementById('generate-drawing').addEventListener('click',generate);
document.getElementById('save-json').addEventListener('click',saveJson);
document.getElementById('save-local').addEventListener('click',saveLocal);
document.getElementById('send-3d').addEventListener('click',sendTo3d);
document.getElementById('export-svg').addEventListener('click',()=>{const r=generate();if(!r.result.errors.length)download('<?xml version="1.0" encoding="UTF-8"?>\n'+buildSvg(r.state),(r.state.drawingNo||'SJ-R-001')+'-drawing.svg','image/svg+xml;charset=utf-8');});
document.getElementById('export-dxf').addEventListener('click',()=>{const r=generate();if(!r.result.errors.length)download(buildDxf(r.state),(r.state.drawingNo||'SJ-R-001')+'-drawing.dxf','application/dxf;charset=utf-8');});
document.getElementById('print-drawing').addEventListener('click',()=>{const r=generate();if(!r.result.errors.length)window.print();});
document.getElementById('open-json').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>200000)throw new Error('도안 JSON은 200KB 이하만 열 수 있습니다.');const data=JSON.parse(await file.text());setState(data);render(readState(),validate(readState()),false);setStatus('도안 JSON을 불러왔습니다.','success');}catch(error){setStatus(error.message||'도안 JSON을 열지 못했습니다.','error');}event.target.value='';});
let initial=defaults;
try{const saved=JSON.parse(localStorage.getItem('sj-drawing-builder-draft')||'null');if(saved)initial=saved;}catch{}
setState(initial);
render(readState(),validate(readState()),false);
