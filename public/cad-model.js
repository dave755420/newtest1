import * as T from './vendor/three.module.min.js';
export function parseStl(buffer){
 const view=new DataView(buffer),count=buffer.byteLength>=84?view.getUint32(80,true):0;let positions;
 if(count&&84+count*50===buffer.byteLength){if(count>2000000)throw new Error('STL 삼각형 수가 너무 많습니다.');positions=new Float32Array(count*9);for(let i=0;i<count;i++)for(let j=0;j<9;j++)positions[i*9+j]=view.getFloat32(84+i*50+12+j*4,true);}
 else{const text=new TextDecoder().decode(buffer);if(!/^\s*solid\s/i.test(text))throw new Error('올바른 STL 파일이 아닙니다.');const values=[];const rx=/\bvertex\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)/gi;for(const m of text.matchAll(rx))values.push(Number(m[1]),Number(m[2]),Number(m[3]));if(!values.length||values.length%9||values.length>18000000)throw new Error('STL 형상 데이터를 확인해 주세요.');positions=new Float32Array(values);}
 if(!positions.every(Number.isFinite))throw new Error('STL에 유효하지 않은 좌표가 있습니다.');return [{name:'STL 형상',position:positions}];
}
export function makeRevolvedMesh(result){const points=result.profile.map(p=>new T.Vector2(p.radius,p.axial));points.push(points[0].clone());const geometry=new T.LatheGeometry(points,128);geometry.rotateZ(-Math.PI/2);return {geometry,name:'DXF 회전 단면'};}
export function makeCadModel(items){
 if(!items.length||items.length>2000)throw new Error('표시할 CAD 부품을 확인해 주세요.');
 const root=new T.Group(),parts=[];let triangles=0;
 const dispose=()=>{parts.forEach(p=>{p.mesh.geometry.dispose();p.mesh.material.dispose();});};
 try{for(let i=0;i<items.length;i++){const m=items[i],g=m.geometry||new T.BufferGeometry();
  if(!m.geometry){if(!m.position?.length||m.position.length%3||!m.position.every(Number.isFinite))throw new Error('유효하지 않은 CAD 좌표입니다.');g.setAttribute('position',new T.BufferAttribute(m.position instanceof Float32Array?m.position:new Float32Array(m.position),3));if(m.index){if(m.index.length%3||!m.index.every(n=>Number.isInteger(n)&&n>=0&&n<m.position.length/3))throw new Error('유효하지 않은 CAD 면 데이터입니다.');g.setIndex(new T.BufferAttribute(m.index instanceof Uint32Array?m.index:new Uint32Array(m.index),1));}if(m.normal?.length===m.position.length&&m.normal.every(Number.isFinite))g.setAttribute('normal',new T.BufferAttribute(m.normal,3));else g.computeVertexNormals();}
  triangles+=(g.index?.count||g.attributes.position.count)/3;if(triangles>2000000)throw new Error('모델이 너무 복잡합니다.');
  const color=Array.isArray(m.color)&&m.color.length===3&&m.color.every(Number.isFinite)?new T.Color().setRGB(...m.color):new T.Color(0xaebbc8);
  const mesh=new T.Mesh(g,new T.MeshStandardMaterial({color,metalness:.6,roughness:.36,side:T.DoubleSide}));const id='cad-'+i;mesh.userData.part=id;root.add(mesh);parts.push({id,name:String(m.name||'부품 '+(i+1)).slice(0,100),family:'CAD 부품 '+(i+1),role:'원본 CAD 파일에서 읽은 형상',mesh,home:mesh.position.clone(),offset:new T.Vector3()});
 }const box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3());if(box.isEmpty()||!size.toArray().every(Number.isFinite)||size.length()<.001)throw new Error('CAD 외형 크기를 확인해 주세요.');
 const center=box.getCenter(new T.Vector3());root.position.copy(center).negate();
 return {root,parts,size,triangles,explode:()=>{},dispose};
 }catch(e){dispose();throw e;}
}
