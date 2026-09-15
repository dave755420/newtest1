import {phaseForPart,phaseProgress} from './motion.js';
import * as T from './vendor/three.module.min.js';
const TAU = Math.PI*2;
export const palette = {steel:0xb6c1cb, chrome:0xcbd4db, dark:0x34404a, ivory:0xd3c6a5, frame:0xe1dfd2, graphite:0x444a50, brass:0x8f7850};
function material(kind){return new T.MeshStandardMaterial({color:palette[kind]??palette.steel,metalness:['steel','chrome','dark','brass'].includes(kind)?.84:.06,roughness:kind==='chrome'?.22:kind==='steel'?.32:kind==='ivory'?.48:.42,side:T.DoubleSide});}
function cylinder(r,l,inner=0){const pts=inner>0?[[inner,-l/2],[r,-l/2],[r,l/2],[inner,l/2],[inner,-l/2]]:[[0,-l/2],[r,-l/2],[r,l/2],[0,l/2]];const g=new T.LatheGeometry(pts.map(p=>new T.Vector2(...p)),80);g.rotateZ(-Math.PI/2);return g;}
function shaftGeometry(profile){const g=new T.LatheGeometry(profile.map(p=>new T.Vector2(p[1],p[0])),96);g.rotateZ(-Math.PI/2);return g;}
function annulus(ro,ri,len,holes=0){const shape=new T.Shape();shape.absarc(0,0,ro,0,TAU,false);if(ri){const h=new T.Path();h.absarc(0,0,ri,0,TAU,true);shape.holes.push(h);}for(let n=0;n<holes;n++){const a=n/holes*TAU;const h=new T.Path();h.absarc(Math.cos(a)*ro*.76,Math.sin(a)*ro*.76,4.5,0,TAU,true);shape.holes.push(h);}const g=new T.ExtrudeGeometry(shape,{depth:len,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.7,bevelThickness:.7,curveSegments:40});g.translate(0,0,-len/2);g.rotateY(Math.PI/2);return g;}
export function grooveRadius(x,theta,p){const edge=Math.min(1,(p.face/2-Math.abs(x))/5),center=T.MathUtils.smoothstep(Math.abs(x),p.gap/2,p.gap/2+10);const phase=(theta-TAU*Math.abs(x)/p.lead)*p.starts/TAU;const d=Math.abs(phase-Math.round(phase));const width=.055;const cut=(1-T.MathUtils.smoothstep(d,width*.38,width))*center*Math.max(0,edge);return p.diameter/2-p.grooveDepth*cut-Math.max(0,1-edge)*1.2;}
function groovedShell(p){const nx=500,nt=320,pos=[],indices=[];for(let i=0;i<=nx;i++){const x=-p.face/2+i/nx*p.face;for(let j=0;j<=nt;j++){const a=j/nt*TAU,r=grooveRadius(x,a,p);pos.push(x,r*Math.cos(a),r*Math.sin(a));}}for(let i=0;i<nx;i++)for(let j=0;j<nt;j++){const a=i*(nt+1)+j,b=a+nt+1;indices.push(a,b,a+1,b,b+1,a+1);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(indices);g.computeVertexNormals();return g;}
function thread(r,len,pitch=4){const pts=[];for(let i=0;i<=Math.ceil(len/pitch*28);i++){const q=i/Math.ceil(len/pitch*28);const a=q*len/pitch*TAU;pts.push(new T.Vector3(q*len-len/2,Math.cos(a)*r,Math.sin(a)*r));}return new T.TubeGeometry(new T.CatmullRomCurve3(pts),Math.ceil(len/pitch*24),.65,5,false);}
export function buildModel(p){
 const root=new T.Group(),parts=[];let number=0;const mats={};
 const add=(name,geometry,kind,pos=[0,0,0],offset=[0,0,0],role='',family='结构')=>{const m=new T.Mesh(geometry,material(kind));m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;root.add(m);const rec={id:`${p.id}-${++number}`,name,role:role||'사진에서 보이는 형상을 기준으로 재구성한 부품입니다.',family,mesh:m,home:m.position.clone(),offset:new T.Vector3(...offset)};m.userData.part=rec.id;parts.push(rec);return m;};
 const box=(name,w,h,d,kind,pos,offset,role,family)=>add(name,new T.BoxGeometry(w,h,d),kind,pos,offset,role,family);
 const cyl=(name,r,l,kind,pos,offset,role,family,inner=0)=>add(name,cylinder(r,l,inner),kind,pos,offset,role,family);
 const bolt=(name,pos,offset,axis='x',size=6,family='체결부')=>{const m=add(name,(()=>{const g=new T.CylinderGeometry(size,size,size*1.2,6);g.rotateZ(-Math.PI/2);return g;})(),'dark',pos,offset,'체결 위치를 설명하는 육각 볼트입니다. 규격과 체결 방식은 가정입니다.',family);if(axis==='y')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.y=Math.PI/2;const w=cyl(name+' 와셔',size*1.3,1.8,'chrome',pos.map((v,i)=>v+(i===(axis==='x'?0:axis==='y'?1:2)?-size*.7:0)),offset,'접촉면을 지지하는 와셔 형상입니다.',family,size*.6);w.rotation.copy(m.rotation);};
 const bearing=(x,y,z,side,index,off)=>{const family=`${index}단 축 지지부`;cyl(`${index}단 베어링 외륜`,48,23,'steel',[x,y,z],off,'축 지지 관계를 설명하는 베어링입니다. 실제 규격과 내부 형상은 확인되지 않았습니다.',family,39);cyl(`${index}단 베어링 내륜`,34,23,'chrome',[x,y,z],off,'축에 접하는 내륜의 예시입니다.',family,25);for(let k=0;k<10;k++){const a=k/10*TAU;add(`${index}단 전동체 ${k+1}`,new T.SphereGeometry(6.2,12,10),'chrome',[x,y+36.5*Math.cos(a),z+36.5*Math.sin(a)],off,'내·외륜 사이의 전동체를 설명하는 예시입니다.',family);}cyl(`${index}단 베어링 실드`,46,2,'dark',[x+side*14,y,z],off.map((v,i)=>v+(i===0?side*45:0)),'베어링 단부를 보호하는 실드의 예시입니다.',family,31);};
 if(p.model==='roller'){
  const R=p.diameter/2,ir=p.core/2;
  if(p.id==='grooved'){
   add('사선 홈 표면',groovedShell(p),'ivory',[0,0,0],[0,210,0],'서로 반대 방향으로 이어지는 홈을 실제로 파인 곡면으로 만들었습니다. 깊이·피치·개수는 검토용 가정입니다.','표면층');
   for(const sign of [-1,1])cyl((sign<0?'좌':'우')+' 피복 단부',R,2,'ivory',[sign*(p.face/2-1),0,0],[0,210,0],'피복과 심관 사이 경계를 보여주는 단부입니다.','표면층',ir);
   cyl('피복 내면',ir+.2,p.face,'ivory',[0,0,0],[0,210,0],'심관에 접합된 것으로 가정한 피복 내면입니다. 분리는 구조 설명용입니다.','표면층',ir);
  }else cyl('롤 표면층',R,p.face,p.finish,[0,0,0],[0,240,0],p.notes,'표면층',ir);
  cyl('내부 심관',ir-.2,p.face-6,'steel',[0,0,0],[0,0,0],'원통형 심관을 가정했습니다. 두께·재질·접합 방식은 실물 확인이 필요합니다.','내부 심관',ir-16);
  for(const s of [-1,1]){
   const ext=s<0?p.left:p.right,side=s<0?'좌측':'우측',r=p.shaft/2;
   const profile=[[0,0],[0,r*1.32],[4,r*1.42],[34,r*1.42],[39,r*1.2],[ext*.56,r*1.2],[ext*.56+4,r],[ext*.84,r],[ext*.84+3,r*.78],[ext-3,r*.78],[ext,r*.69],[ext,0]];
   const g=shaftGeometry(profile);if(s<0)g.rotateY(Math.PI);
   add(`${side} 단차 축`,g,'chrome',[s*p.face/2,0,0],[s*240,0,0],'몸통 접합부·지지 구간·축 끝단의 단차를 구분했습니다. 세부 규격은 가정입니다.',`${side} 축`);
   add(`${side} 단부 플랜지`,annulus(ir-1,r*1.42,16,6),'steel',[s*(p.face/2-10),0,0],[s*120,0,0],'심관과 축을 연결하는 원형 단부를 가정했습니다. 홀은 설명용입니다.',`${side} 단부`);
   cyl(`${side} 축 칼라`,r*1.48,7,'dark',[s*(p.face/2+40),0,0],[s*265,0,0],'축 어깨의 접촉 경계를 나타내는 칼라 예시입니다.',`${side} 축`,r*1.2);
   const th=add(`${side} 끝단 나사`,thread(r*.78-1,ext*.10,3.5),'steel',[s*(p.face/2+ext*.93),0,0],[s*240,0,0],'끝단 고정 방식을 설명하는 나사 형상입니다. 실제 나사 규격은 미확인입니다.',`${side} 축`);
   for(let i=0;i<6;i++){const a=i/6*TAU;bolt(`${side} 단부 볼트 ${i+1}`,[s*(p.face/2+1),Math.cos(a)*(ir-1)*.76,Math.sin(a)*(ir-1)*.76],[s*150,0,0],'x',5,`${side} 단부`);}
  }
  root.rotation.set(.08,-.12,-.08);
 }else if(p.model==='assembly'){
  const half=p.face/2+110, H=p.height;
  for(const s of [-1,1]){
   const x=s*half,ox=s*270;
   box(`${s<0?'좌':'우'} 프레임 앞 기둥`,75,H,85,'frame',[x,H/2,180],[ox,0,0],'여러 높이의 롤을 지지하는 프레임입니다. 단면과 접합 방식은 가정입니다.','지지 프레임');
   box(`${s<0?'좌':'우'} 프레임 뒤 기둥`,75,H,85,'frame',[x,H/2,-180],[ox,0,0],'사진을 기준으로 재구성한 프레임 뒤쪽 지지부입니다.','지지 프레임');
   for(const y of [70,H-80])box('프레임 연결판',76,95,440,'frame',[x,y,0],[ox,0,0],'앞·뒤 기둥의 연결을 설명하는 판입니다.','지지 프레임');
   box('베이스 발판',220,22,560,'frame',[x,12,0],[ox,0,0],'프레임을 지지하는 바닥 판입니다.','지지 프레임');
   for(const z of [-220,220])bolt('베이스 체결 볼트',[x,30,z],[ox,0,0],'y',10,'지지 프레임');
   if(p.id==='frame-unit')for(const z of [-160,160]){
    const screw=cyl('높이 조절 나사축',10,H*.52,'chrome',[x+s*55,H*.63,z],[ox+s*75,0,0],'롤 지지부 높이를 조절하는 것으로 해석한 나사축입니다. 정확한 이동량은 미확인입니다.','높이 조절부');screw.rotation.z=Math.PI/2;
    const th=add('높이 조절 나사산',thread(10,H*.52,12),'dark',[x+s*55,H*.63,z],[ox+s*75,0,0],'가정한 나사 피치를 표시합니다.','높이 조절부');th.rotation.z=Math.PI/2;
    box('조절 나사 너트 블록',50,30,45,'dark',[x+s*55,H*.7,z],[ox+s*75,0,0],'조절 나사와 지지부의 관계를 설명합니다.','높이 조절부');
   }
  }
  for(const z of [-200,200]){const c=cyl('하부 연결 파이프',32,p.face+150,'frame',[0,155,z],[0,-80,z*.5],'좌우 프레임을 연결하는 파이프입니다.','연결재',25);for(const s of [-1,1])add('파이프 단부 플랜지',annulus(52,25,12,4),'frame',[s*(p.face/2+60),155,z],[s*60,-80,z*.5],'연결 파이프의 장착 위치를 설명합니다.','연결재');}
  p.levels.forEach((v,i)=>{
   const idx=i+1,dy=(i-(p.levels.length-1)/2)*135,off=[0,dy,220],family=`${idx}단 롤`;
   cyl(`${idx}단 롤 몸통`,v.r,p.face,i%2===0?'steel':(p.id==='gear-unit'?'graphite':'ivory'),[0,v.y,v.z],off,'포장 아래 표면은 재구성했습니다. 실제 소재와 표면 가공은 확인되지 않았습니다.',family,v.r-14);
   for(const s of [-1,1]){
    cyl(`${idx}단 ${s<0?'좌':'우'} 축`,p.shaft/2,170,'chrome',[s*(p.face/2+55),v.y,v.z],[s*130,dy,220],'롤 몸통에서 지지부로 이어지는 축입니다. 상세 치수는 가정입니다.',family);
    add(`${idx}단 단부`,annulus(v.r-1,p.shaft/2,14,4),'steel',[s*(p.face/2-10),v.y,v.z],[s*65,dy,220],'롤 내부와 축의 연결을 설명하는 원형 단부입니다.',family);
    box(`${idx}단 지지 블록`,64,135,138,'dark',[s*half,v.y,v.z],[s*270,dy,0],'롤 축을 지지하는 장착 블록입니다.',`${idx}단 축 지지부`);
    bearing(s*(half+36),v.y,v.z,s,idx,[s*360,dy,0]);
    for(const yy of [-49,49])for(const zz of [-49,49])bolt(`${idx}단 지지 블록 볼트`,[s*(half+37),v.y+yy,v.z+zz],[s*300,dy,0],'x',7,`${idx}단 축 지지부`);
   }
   if(p.id==='gear-unit'){
    const r=i===p.levels.length-1?88:128,teeth=i===p.levels.length-1?30:44,shape=new T.Shape();for(let t=0;t<=teeth*4;t++){const a=t/(teeth*4)*TAU,rr=t%4===1||t%4===2?r:r-9;const q=[rr*Math.cos(a),rr*Math.sin(a)];if(t===0)shape.moveTo(...q);else shape.lineTo(...q);}const hole=new T.Path();hole.absarc(0,0,31,0,TAU,true);shape.holes.push(hole);const g=new T.ExtrudeGeometry(shape,{depth:30,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:1,bevelThickness:1});g.translate(0,0,-15);g.rotateY(Math.PI/2);add(`${idx}단 구동 기어`,g,'dark',[-half-92,v.y,v.z],[-550,dy,0],'사진에서 보이는 외부 기어를 재구성했습니다. 실제 잇수·모듈·인벌류트 치형은 미확인입니다.','측면 기어');
    cyl(`${idx}단 기어 허브`,50,42,'steel',[-half-120,v.y,v.z],[-590,dy,0],'기어와 축의 연결 허브를 설명합니다.','측면 기어',31);
    for(let b=0;b<6;b++){const a=b/6*TAU;bolt(`${idx}단 기어 볼트`,[-half-113,v.y+70*Math.cos(a),v.z+70*Math.sin(a)],[-575,dy,0],'x',6,'측면 기어');}
   }
  });
  root.position.y=-H/2;
 }else{
  const h=p.height;
  const base=cyl('원형 베이스',p.base/2,14,'frame',[0,0,0],[0,-75,0],'원형 판으로 거치대를 지지합니다. 두께와 하중 조건은 가정입니다.','원형 베이스');base.rotation.z=Math.PI/2;
  const rim=cyl('베이스 가장자리',p.base/2+4,9,'dark',[0,-3,0],[0,-90,0],'사진의 어두운 가장자리 띠를 표현했습니다.','원형 베이스',p.base/2-3);rim.rotation.z=Math.PI/2;
  const col=cyl('수직 기둥',p.column/2,h-205,'frame',[0,(h-205)/2+10,0],[0,30,0],'원형 베이스에서 상부를 지지하는 기둥입니다. 재질과 벽 두께는 가정입니다.','수직 기둥',p.column/2-3);col.rotation.z=Math.PI/2;
  const points=[new T.Vector3(0,h-195,0),new T.Vector3(0,h-115,0),new T.Vector3(23,h-62,0),new T.Vector3(80,h-48,0)];
  add('곡선 상부 연결관',new T.TubeGeometry(new T.CatmullRomCurve3(points),40,18,24,false),'chrome',[0,0,0],[0,155,0],'사진의 곡선 연결부를 재구성했습니다. 기둥과의 결합은 설명용입니다.','상부 관절');
  const joint=cyl('상부 관절 하우징',34,44,'frame',[84,h-48,0],[0,155,0],'연결 암의 방향을 지지하는 관절 외형입니다. 내부 잠금 구조는 가정입니다.','상부 관절',14);joint.rotation.y=Math.PI/2;
  const pin=cyl('관절 중심축',13,50,'chrome',[84,h-48,0],[0,155,90],'관절의 연결 관계를 설명하는 중심축입니다.','상부 관절');pin.rotation.y=Math.PI/2;
  for(const s of [-1,1]){const cap=cyl('관절 덮개',34,4,'frame',[84,h-48,s*26],[0,155,s*100],'사진에 보이는 둥근 덮개입니다.','상부 관절',5);cap.rotation.y=Math.PI/2;for(let k=0;k<3;k++){const a=k/3*TAU;bolt('관절 덮개 나사',[84+25*Math.cos(a),h-48+25*Math.sin(a),s*29],[0,155,s*115],'z',3,'상부 관절');}}
  const start=new T.Vector3(112,h-65,0),end=new T.Vector3(112+p.arm*.82,h-65-p.arm*.57,0),dir=end.clone().sub(start),arm=cyl('연결 암',18,dir.length(),'chrome',start.clone().add(end).multiplyScalar(.5).toArray(),[125,95,0],'관절과 모니터 장착부를 잇는 관형 암입니다. 사진의 각도를 기준으로 표현했습니다.','연결 암',15);arm.quaternion.setFromUnitVectors(new T.Vector3(1,0,0),dir.normalize());
  box('모니터 장착판',95,95,7,'dark',[end.x,end.y,15],[160,95,50],'실제 뒷면이 가려져 있어 장착판과 홀 간격은 설명용 가정입니다.','장착부');
  for(const x of [-35,35])for(const y of [-35,35])bolt('장착판 나사',[end.x+x,end.y+y,22],[160,95,80],'z',4,'장착부');
  box('장착 모니터 참고 형상',310,205,22,'dark',[end.x,end.y,40],[190,95,160],'당사 제작품이 아닙니다. 거치대의 사용 관계만 보여주는 참고 형상입니다.','참고 모니터');
  box('화면 참고 면',285,178,1,'graphite',[end.x,end.y,52],[190,95,160],'모니터의 장착 위치를 나타냅니다.','참고 모니터');
  root.position.set(-140,-h/2,0);
 }
 root.updateMatrixWorld(true);
 return {root,parts,explode(t,mode='linear'){for(const r of parts){const progress=mode==='staged'?phaseProgress(t,phaseForPart(r,p)):t;r.mesh.position.copy(r.home).addScaledVector(r.offset,progress);}root.updateMatrixWorld(true);},dispose(){for(const r of parts){r.mesh.geometry.dispose();r.mesh.material.dispose();}}};
}
