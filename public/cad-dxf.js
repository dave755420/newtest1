// Conservative conversion of planar, closed roll sections. No inferred hidden features.
const EPS=1e-5,near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<EPS;
const bounds=points=>({minX:Math.min(...points.map(p=>p.x)),maxX:Math.max(...points.map(p=>p.x)),minY:Math.min(...points.map(p=>p.y)),maxY:Math.max(...points.map(p=>p.y))});
function arc(center,r,start,sweep){const n=Math.min(256,Math.max(4,Math.ceil(Math.abs(sweep)/.06)));return Array.from({length:n+1},(_,i)=>({x:center.x+r*Math.cos(start+sweep*i/n),y:center.y+r*Math.sin(start+sweep*i/n)}));}
function polyPoints(vertices,closed){const out=[];for(let i=0;i<vertices.length-(closed?0:1);i++){const a=vertices[i],b=vertices[(i+1)%vertices.length];out.push({x:a.x,y:a.y});if(a.bulge){const angle=4*Math.atan(a.bulge),d=Math.hypot(b.x-a.x,b.y-a.y),h=d*(1-a.bulge*a.bulge)/(4*a.bulge),cx=(a.x+b.x)/2-(b.y-a.y)/d*h,cy=(a.y+b.y)/2+(b.x-a.x)/d*h;out.push(...arc({x:cx,y:cy},Math.hypot(a.x-cx,a.y-cy),Math.atan2(a.y-cy,a.x-cx),angle).slice(1,-1));}}if(!closed)out.push(vertices.at(-1));return out;}
function area(points){return Math.abs(points.reduce((a,p,i)=>{const q=points[(i+1)%points.length];return a+p.x*q.y-q.x*p.y;},0))/2;}
function flatten(dxf){const paths=[],axes=[];let count=0,ignored=0;
 function walk(entities,transform=p=>p,depth=0,layer='0'){
  if(depth>8)throw new Error('중첩 블록이 너무 많습니다. 블록을 분해한 DXF로 저장해 주세요.');
  for(const e of entities){if(++count>15000)throw new Error('도면이 복잡합니다. 롤 단면만 별도 DXF로 저장해 주세요.');if(e.inPaperSpace||e.visible===false)continue;
   const name=e.layer==='0'?layer:(e.layer||layer);
   if(e.type==='INSERT'){const block=dxf.blocks?.[e.name];if(!block){ignored++;continue;}if((e.rowCount||1)>1||(e.columnCount||1)>1){ignored++;continue;}const a=(e.rotation||0)*Math.PI/180,base=block.position||{x:0,y:0},pos=e.position||{x:0,y:0};walk(block.entities,p=>{const x=(p.x-base.x)*(e.xScale??1),y=(p.y-base.y)*(e.yScale??1);return transform({x:pos.x+x*Math.cos(a)-y*Math.sin(a),y:pos.y+x*Math.sin(a)+y*Math.cos(a)});},depth+1,name);continue;}
   if(/DIM|TEXT|HATCH|LEADER|VIEWPORT/.test(e.type))continue;
   let points,closed=false;
   if(e.type==='LINE')points=e.vertices;
   else if(['LWPOLYLINE','POLYLINE'].includes(e.type)){if(e.is3dPolyline||e.isPolyfaceMesh){ignored++;continue;}closed=!!e.shape;points=polyPoints(e.vertices,closed);}
   else if(e.type==='ARC'){let sweep=e.endAngle-e.startAngle;while(sweep<=0)sweep+=2*Math.PI;points=arc(e.center,e.radius,e.startAngle,sweep);}
   else if(e.type==='CIRCLE'){points=arc(e.center,e.radius,0,2*Math.PI).slice(0,-1);closed=true;}
   else{ignored++;continue;}
   if(!points||points.length<2||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.z||0)>EPS)){ignored++;continue;}
   if(e.extrusionDirection?.z<0||e.extrusionDirectionZ<0){ignored++;continue;}
   points=points.map(transform);if(points.some(p=>Math.max(Math.abs(p.x),Math.abs(p.y))>1e9))throw new Error('도면 좌표 범위를 확인해 주세요.');
   if(/CENTER|CENTRE|AXIS|중심/i.test(name+' '+(e.lineType||''))){if(points.length===2)axes.push(points);continue;}
   if(/DIM|HATCH|FRAME|BORDER|TITLE|치수|도곽/i.test(name))continue;
   if(near(points[0],points.at(-1))){points.pop();closed=true;}
   paths.push({points,closed,layer:name});
  }
 }walk(dxf.entities||[]);return {paths,axes,ignored};
}
export function prepareDxf(dxf){
 const {paths,axes,ignored}=flatten(dxf),profiles=paths.filter(p=>p.closed),open=paths.filter(p=>!p.closed);
 if(open.length>2500)throw new Error('선이 너무 많습니다. 롤 외형을 닫힌 폴리선으로 결합해 주세요.');
 const used=new Set();
 for(let i=0;i<open.length;i++){if(used.has(i))continue;used.add(i);let chain=[...open[i].points],closed=false;
  while(chain.length<5000){const end=chain.at(-1);if(near(end,chain[0])){chain.pop();closed=true;break;}const matches=[];
   for(let j=0;j<open.length;j++)if(!used.has(j)&&open[j].layer===open[i].layer){if(near(end,open[j].points[0]))matches.push([j,false]);else if(near(end,open[j].points.at(-1)))matches.push([j,true]);}
   if(matches.length!==1)break;const [j,rev]=matches[0];used.add(j);chain.push(...(rev?[...open[j].points].reverse():open[j].points).slice(1));
  }if(closed)profiles.push({points:chain,closed:true,layer:open[i].layer});
 }
 const valid=profiles.filter(p=>p.points.length>=3&&p.points.length<=5000&&area(p.points)>EPS).map((p,i)=>({...p,id:String(i),bounds:bounds(p.points),area:area(p.points)}));
 valid.sort((a,b)=>(/PROFILE|SECTION|단면/i.test(b.layer)?1:0)-(/PROFILE|SECTION|단면/i.test(a.layer)?1:0)||b.area-a.area);
 if(!valid.length)throw new Error('회전시킬 닫힌 단면을 찾지 못했습니다. 롤 외형을 닫힌 폴리선으로 저장해 주세요.');
 const named=valid.filter(p=>/PROFILE|SECTION|단면/i.test(p.layer));
 return {profiles:valid.slice(0,100),axes,unit:Number(dxf.header?.$INSUNITS)||0,ignored,needsChoice:valid.length>1&&named.length!==1};
}
function rangesAt(points,x){const ys=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];if((a.x<=x&&b.x>x)||(b.x<=x&&a.x>x))ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));}return ys.sort((a,b)=>a-b);}
function symmetric(points,axis){const b=bounds(points),tol=Math.max(b.maxY-b.minY,1)*1e-4;for(let i=1;i<40;i++){const ys=rangesAt(points,b.minX+(b.maxX-b.minX)*i/40);if(ys.length!==2||Math.abs(ys[0]+ys[1]-2*axis)>tol)return false;}return true;}
function clip(points,axis){const out=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ina=a.y>=axis-EPS,inb=b.y>=axis-EPS;if(ina)out.push(a);if(ina!==inb){const t=(axis-a.y)/(b.y-a.y);out.push({x:a.x+(b.x-a.x)*t,y:axis});}}return out;}
export function revolveProfile(data,options={}){
 const selected=data.profiles.find(p=>p.id===String(options.profile))||data.profiles[0];
 const b=selected.bounds,axis=options.axis==='auto'||!options.axis?(b.maxX-b.minX>=b.maxY-b.minY?'x':'y'):options.axis;
 let points=selected.points.map(p=>axis==='x'?{...p}:{x:p.y,y:p.x}),box=bounds(points),center;
 const custom=options.axisPosition!==''&&options.axisPosition!=null;
 if(custom){center=Number(options.axisPosition);if(!Number.isFinite(center))throw new Error('축 위치를 숫자로 입력해 주세요.');}
 else{const lines=data.axes.map(l=>l.map(p=>axis==='x'?p:{x:p.y,y:p.x})).filter(l=>Math.abs(l[0].y-l[1].y)<EPS&&Math.min(l[0].x,l[1].x)<=box.maxX&&Math.max(l[0].x,l[1].x)>=box.minX);const positions=[...new Set(lines.map(l=>l[0].y))];if(positions.length===1)center=positions[0];else if(symmetric(points,(box.minY+box.maxY)/2))center=(box.minY+box.maxY)/2;else throw new Error('회전축이 명확하지 않습니다. DXF 좌표 기준 축 위치를 입력해 주세요.');}
 if(box.minY<center-EPS&&box.maxY>center+EPS){if(!symmetric(points,center))throw new Error('축 양쪽 외형이 비대칭입니다. 한쪽 단면만 분리한 DXF를 사용해 주세요.');points=clip(points,center);}
 const factor=options.unit&&options.unit!=='auto'?Number(options.unit):({1:25.4,2:304.8,4:1,5:10,6:1000,7:1e6,9:.0254,10:914.4,14:.1}[data.unit]);
 if(!factor||!Number.isFinite(factor))throw new Error('DXF 단위가 지정되지 않았습니다. 좌표 단위를 선택해 주세요.');
 const profile=points.map(p=>({axial:p.x*factor,radius:Math.abs(p.y-center)*factor}));
 const length=(box.maxX-box.minX)*factor,diameter=Math.max(...profile.map(p=>p.radius))*2;
 if(!Number.isFinite(length)||!Number.isFinite(diameter)||length<.01||diameter<.01||length>1e6||diameter>1e6)throw new Error('단위 또는 외형 크기를 확인해 주세요.');
 return {profile,axis,center,unit:factor,length,diameter,layer:selected.layer,source:points,assumption:custom?'지정 회전축':data.axes.length?'도면 중심선 기준':'대칭 외형 중심축 기준'};
}
export function profileSvg(data,selected){const b=selected.bounds,pad=Math.max(b.maxX-b.minX,b.maxY-b.minY)*.06||1;const pts=selected.points.map(p=>`${p.x},${-p.y}`).join(' ');return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.minX-pad} ${-b.maxY-pad} ${b.maxX-b.minX+2*pad} ${b.maxY-b.minY+2*pad}"><rect x="${b.minX-pad}" y="${-b.maxY-pad}" width="${b.maxX-b.minX+2*pad}" height="${b.maxY-b.minY+2*pad}" fill="#fff"/><polygon points="${pts}" fill="#e7edf3" stroke="#243b52" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;}
