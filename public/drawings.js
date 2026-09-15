import {assumptions} from './catalog.js';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function referenceLength(p){return p.model==='stand'?p.height:p.face;}
export function scaledProduct(p,scale=1){const q={...p};for(const k of ['face','diameter','left','right','shaft','core','grooveDepth','lead','gap','height','depth','base','column','arm'])if(typeof q[k]==='number')q[k]*=scale;if(q.levels)q.levels=q.levels.map(v=>({y:v.y*scale,r:v.r*scale,z:v.z*scale}));return q;}
export function makeSheet(product,type='assembly',scale=1){
 const p=scaledProduct(product,scale),entities=[],s=scale;let note='외형과 내부를 설명하는 검토용 조립도';
 const line=(x1,y1,x2,y2,layer='OBJECT')=>entities.push({kind:'line',x1,y1,x2,y2,layer});
 const circle=(x,y,r,layer='OBJECT')=>entities.push({kind:'circle',x,y,r,layer});
 const text=(x,y,value,size=22*s,layer='TEXT')=>entities.push({kind:'text',x,y,value,size,layer});
 const rect=(x,y,w,h,layer='OBJECT')=>{line(x,y,x+w,y,layer);line(x+w,y,x+w,y+h,layer);line(x+w,y+h,x,y+h,layer);line(x,y+h,x,y,layer);};
 const dim=(x1,x2,y,label)=>{line(x1,y-30*s,x1,y+25*s,'DIM');line(x2,y-30*s,x2,y+25*s,'DIM');line(x1,y,x2,y,'DIM');line(x1,y,x1+12*s,y-6*s,'DIM');line(x1,y,x1+12*s,y+6*s,'DIM');line(x2,y,x2-12*s,y-6*s,'DIM');line(x2,y,x2-12*s,y+6*s,'DIM');text((x1+x2)/2,y+14*s,label,22*s,'DIM');};
 const hatch=(x,y,w,h)=>{for(let t=0;t<w+h;t+=25*s){const ax=Math.max(0,t-h),ay=Math.min(t,h),bx=Math.min(t,w),by=Math.max(0,t-w);line(x+ax,y+ay,x+bx,y+by,'HATCH');}};
 const n=v=>Number(v.toFixed(1));
 const shaft=(end,sign,ext,r,shiftX=0,shiftY=0)=>{const pp=[[0,0],[0,r*1.32],[4*s,r*1.42],[34*s,r*1.42],[39*s,r*1.2],[ext*.56,r*1.2],[ext*.56+4*s,r],[ext*.84,r],[ext*.84+3*s,r*.78],[ext-3*s,r*.78],[ext,r*.69],[ext,0]];for(let side of [-1,1])for(let i=0;i<pp.length-1;i++)line(end+sign*pp[i][0]+shiftX,side*pp[i][1]+shiftY,end+sign*pp[i+1][0]+shiftX,side*pp[i+1][1]+shiftY);};
 if(p.model==='roller'){
  const L=p.face,R=p.diameter/2,ir=p.core/2,total=L+p.left+p.right;
  if(type==='assembly'){
   rect(-L/2,-R,L,R*2);shaft(-L/2,-1,p.left,p.shaft/2);shaft(L/2,1,p.right,p.shaft/2);line(-L/2-p.left-40*s,0,L/2+p.right+40*s,0,'CENTER');
   if(p.id==='grooved')for(let sign of [-1,1])for(let x=p.gap;x<L/2-40*s;x+=p.lead/p.starts)line(sign*x,-R+5*s,sign*Math.min(x+80*s,L/2-3*s),R-5*s,'GROOVE');
   dim(-L/2,L/2,-R-85*s,`몸통 길이 ${n(L)}`);dim(-L/2-p.left,L/2+p.right,-R-170*s,`전체 길이 ${n(total)}`);
   text(0,R+55*s,`정면도 · 외경 Ø${n(p.diameter)} / 축 기준 Ø${n(p.shaft)}`,24*s);
   const cy=R+340*s;circle(0,cy,R);circle(0,cy,ir);circle(0,cy,p.shaft/2);line(-R-30*s,cy,R+30*s,cy,'CENTER');line(0,cy-R-30*s,0,cy+R+30*s,'CENTER');text(0,cy+R+40*s,'단부 투영 / 내부 경계는 가정',22*s);
  }else if(type==='detail'){
   note='축 단차와 표면층·심관을 설명하는 주요 부품도';shaft(0,-1,p.left,p.shaft/2);shaft(0,1,p.right,p.shaft/2);dim(-p.left,0,-140*s,`좌측 돌출 ${n(p.left)}`);dim(0,p.right,-140*s,`우측 돌출 ${n(p.right)}`);text(0,90*s,'좌·우 축 프로파일 · 접합부 규격 미확정',22*s);
   const cy=420*s;circle(0,cy,R);circle(0,cy,ir);circle(0,cy,ir-16*s);text(0,cy+R+50*s,`외경 Ø${n(p.diameter)} / 심관 외경 Ø${n(p.core)}`,22*s);text(0,cy+R+90*s,`표면층 ${(n((p.diameter-p.core)/2))} / 심관 두께 ${n(16*s)} (가정)`,22*s);
   if(p.id==='grooved'){const gx=-220*s,gy=cy+R+190*s;line(gx,gy,-30*s,gy);line(-30*s,gy,-20*s,gy-p.grooveDepth*8);line(-20*s,gy-p.grooveDepth*8,20*s,gy-p.grooveDepth*8);line(20*s,gy-p.grooveDepth*8,30*s,gy);line(30*s,gy,220*s,gy);text(0,gy+50*s,`홈 단면 개념 확대 · 깊이 ${n(p.grooveDepth)} / ${p.starts}줄 / 리드 ${n(p.lead)}`,22*s);}
  }else{
   note='표면층과 접합 부품을 펼친 구조 설명도 · 접합부 분리는 정비 순서를 의미하지 않음';
   rect(-L/2,220*s-R,L,R*2);text(0,220*s+R+45*s,'01 표면층 / 사선 홈 또는 표면 마감',22*s);
   rect(-L/2,-ir,L,ir*2);rect(-L/2,-ir+16*s,L,ir*2-32*s,'HATCH');hatch(-L/2,-ir,L,16*s);hatch(-L/2,ir-16*s,L,16*s);text(0,-ir-42*s,'02 내부 심관 (가정)',22*s);
   for(const sign of [-1,1]){rect(sign*(L/2+120*s)-8*s,-ir,16*s,2*ir);shaft(sign*L/2,sign,sign<0?p.left:p.right,p.shaft/2,sign*240*s,0);line(sign*L/2,0,sign*(L/2+240*s),0,'CENTER');text(sign*(L/2+150*s),-ir-60*s,'03 단부 / 04 단차 축',22*s);}
  }
 }else if(p.model==='assembly'){
  const L=p.face,H=p.height,hx=L/2+110*s;
  if(type==='assembly'){
   for(const sign of [-1,1])rect(sign*hx-38*s,0,76*s,H);for(const y of [70*s,H-80*s])rect(-hx,y,2*hx,40*s);
   p.levels.forEach((v,i)=>{rect(-L/2,v.y-v.r,L,2*v.r);line(-hx-140*s,v.y,hx+140*s,v.y,'CENTER');rect(-hx-50*s,v.y-66*s,100*s,132*s);rect(hx-50*s,v.y-66*s,100*s,132*s);text(0,v.y,`${i+1}단 · Ø${n(v.r*2)}`,28*s);});
   dim(-L/2,L/2,-130*s,`롤 몸통 ${n(L)}`);text(0,H+100*s,`정면도 · 프레임 높이 가정 ${n(H)}`,30*s);
  }else if(type==='detail'){
   note='롤과 축 지지부의 연결 및 측면 높이 배치';
   p.levels.forEach((v,i)=>{circle(0,v.y,v.r);circle(0,v.y,p.shaft/2);line(-v.r-50*s,v.y,v.r+260*s,v.y,'CENTER');text(v.r+360*s,v.y,`${i+1}단 중심 높이 ${n(v.y)} · 앞뒤 ${n(v.z)}`,26*s);});
   const xx=1000*s,cy=H*.5;rect(xx-67*s,cy-67*s,134*s,134*s);circle(xx,cy,48*s);circle(xx,cy,39*s);circle(xx,cy,34*s);circle(xx,cy,25*s);for(let i=0;i<10;i++){const a=i/10*Math.PI*2;circle(xx+Math.cos(a)*36.5*s,cy+Math.sin(a)*36.5*s,6.2*s);}text(xx,cy+160*s,'축 지지부 설명용 단면',25*s);text(xx,cy+200*s,'베어링·공차 미확정',24*s);
  }else{
   note='롤 모듈·지지부·프레임의 위치 관계를 펼친 구조 설명도';
   for(const sign of [-1,1])rect(sign*(hx+270*s)-38*s,0,76*s,H);
   p.levels.forEach((v,i)=>{const yy=v.y+(i-(p.levels.length-1)/2)*135*s;rect(-L/2,yy-v.r,L,2*v.r);for(const sign of [-1,1]){rect(sign*(hx+360*s)-25*s,yy-60*s,50*s,120*s);line(sign*L/2,yy,sign*(hx+420*s),yy,'CENTER');}text(0,yy,`${i+1}단 롤 모듈`,26*s);});text(0,H+300*s,'롤 → 단부·축 → 지지 블록 → 프레임',30*s);
  }
 }else{
  const h=p.height,base=p.base,shift=type==='exploded'?200*s:0;
  if(type==='detail'){
   note='베이스 평면과 관절·장착판의 설명용 부품도';circle(0,0,base/2);circle(0,0,p.column/2);line(-base/2-40*s,0,base/2+40*s,0,'CENTER');dim(-base/2,base/2,-base/2-80*s,`베이스 Ø${n(base)}`);text(0,base/2+60*s,'원형 베이스 평면',24*s);const x=base+150*s;circle(x,0,34*s);circle(x,0,14*s);for(let i=0;i<3;i++){const a=i/3*Math.PI*2;circle(x+25*s*Math.cos(a),25*s*Math.sin(a),3*s);}text(x,100*s,'상부 관절 덮개 · 가정',24*s);rect(x-47.5*s,260*s,95*s,95*s);for(let a of [-35,35])for(let b of [-35,35])circle(x+a*s,307.5*s+b*s,4*s);text(x,400*s,'장착판 홀 간격 70 (가정)',22*s);
  }else{
   rect(-base/2,-14*s-shift,base,14*s);rect(-p.column/2,0,p.column,h-195*s);line(0,h-195*s+shift,0,h-100*s+shift);line(0,h-100*s+shift,30*s,h-50*s+shift);line(30*s,h-50*s+shift,84*s,h-48*s+shift);circle(84*s,h-48*s+shift,34*s);const ex=112*s+p.arm*.82,ey=h-65*s-p.arm*.57+shift;line(112*s,h-65*s+shift,ex,ey);line(112*s,h-35*s+shift,ex,ey+30*s);rect(ex-47*s+shift,ey-47*s,95*s,95*s);rect(ex-155*s+shift,ey-103*s,310*s,205*s,'REFERENCE');text(ex+shift,ey-140*s,'모니터 참고 형상 · 당사 제작 범위 아님',24*s);dim(-base/2,base/2,-110*s-shift,`베이스 Ø${n(base)}`);text(0,h+160*s+shift,`높이 가정 ${n(h)} / 기둥 Ø${n(p.column)} / 암 ${n(p.arm)}`,26*s);if(type==='exploded')note='베이스·기둥·상부 관절·장착부의 분리 관계';
  }
 }
 let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const e of entities){let bounds=e.kind==='line'?[Math.min(e.x1,e.x2),Math.min(e.y1,e.y2),Math.max(e.x1,e.x2),Math.max(e.y1,e.y2)]:e.kind==='circle'?[e.x-e.r,e.y-e.r,e.x+e.r,e.y+e.r]:[e.x-e.value.length*e.size*.32,e.y-e.size,e.x+e.value.length*e.size*.32,e.y+e.size];minX=Math.min(minX,bounds[0]);minY=Math.min(minY,bounds[1]);maxX=Math.max(maxX,bounds[2]);maxY=Math.max(maxY,bounds[3]);}
 const factor=Math.min(1060/(maxX-minX),540/(maxY-minY)),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
 const tx=x=>600+(x-cx)*factor,ty=y=>370-(y-cy)*factor;
 const strokes={OBJECT:'#294052',DIM:'#648297',HATCH:'#9fb1bd',CENTER:'#9aabb7',GROOVE:'#8d8270',REFERENCE:'#9ea9b3',TEXT:'#294052'};
 const shape=entities.map(e=>{const color=strokes[e.layer];if(e.kind==='line')return `<line x1="${tx(e.x1)}" y1="${ty(e.y1)}" x2="${tx(e.x2)}" y2="${ty(e.y2)}" stroke="${color}" stroke-width="${e.layer==='OBJECT'?1.6:.9}" ${e.layer==='CENTER'||e.layer==='REFERENCE'?'stroke-dasharray="8 5"':''}/>`;if(e.kind==='circle')return `<circle cx="${tx(e.x)}" cy="${ty(e.y)}" r="${e.r*factor}" stroke="${color}" stroke-width="1.4" fill="none"/>`;return `<text x="${tx(e.x)}" y="${ty(e.y)}" text-anchor="middle" fill="${color}" font-size="${Math.max(12,Math.min(19,e.size*factor))}">${esc(e.value)}</text>`;}).join('');
 const title=type==='assembly'?'외형·조립도':type==='detail'?'주요 부품도':'구조 분리도';
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="${esc(p.name)} ${title}"><rect width="1200" height="800" fill="#fbfcfd"/><g font-family="Arial, Malgun Gothic, sans-serif"><rect x="24" y="24" width="1152" height="752" fill="none" stroke="#c6d0d9"/><text x="50" y="64" font-size="23" fill="#203244">승지정밀산업롤 · ${esc(p.name)}</text><text x="1150" y="63" text-anchor="end" font-size="15" fill="#687b8c">${p.code} / ${title} / TEST2</text><line x1="24" y1="88" x2="1176" y2="88" stroke="#c6d0d9"/>${shape}<line x1="24" y1="679" x2="1176" y2="679" stroke="#c6d0d9"/><text x="50" y="711" font-size="15" fill="#203244">${esc(note)}</text><text x="50" y="739" font-size="14" fill="#687b8c">${esc(assumptions)}</text><text x="1150" y="761" text-anchor="end" font-size="12" fill="#687b8c">단위 mm · 화면 맞춤 축척 · REV A · 기준 비율 ${Number(scale.toFixed(3))}</text></g></svg>`;
 return {svg,dxf:makeDXF(entities),entities,title,p};
}
function makeDXF(es){let out='0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1021\n9\n$INSUNITS\n70\n4\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n';const f=x=>Number(x.toFixed(4));for(const e of es){if(e.kind==='line')out+=`0\nLINE\n8\n${e.layer}\n10\n${f(e.x1)}\n20\n${f(e.y1)}\n30\n0\n11\n${f(e.x2)}\n21\n${f(e.y2)}\n31\n0\n`;else if(e.kind==='circle')out+=`0\nCIRCLE\n8\n${e.layer}\n10\n${f(e.x)}\n20\n${f(e.y)}\n30\n0\n40\n${f(e.r)}\n`;else out+=`0\nTEXT\n8\n${e.layer}\n10\n${f(e.x)}\n20\n${f(e.y)}\n30\n0\n40\n${f(e.size)}\n1\n${e.value}\n`; }return out+'0\nENDSEC\n0\nEOF\n';}
