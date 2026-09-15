/* All uploaded data is processed locally in this dedicated worker. */
let engine;
self.onmessage=async({data})=>{try{
 const {buffer,format}=data;
 if(format==='dxf'){
  importScripts('./vendor/cad/dxf-parser.js');
  const {prepareDxf}=await import('./cad-dxf.js');
  const text=new TextDecoder().decode(buffer);
  if(text.startsWith('AutoCAD Binary DXF'))throw new Error('ASCII DXF로 다시 저장해 주세요.');
  const dxf=new self.DxfParser().parseSync(text);self.postMessage({success:true,dxf:prepareDxf(dxf)});return;
 }
 if(!engine){importScripts('./vendor/cad/occt-import-js.js');engine=await occtimportjs({locateFile:path=>new URL('./vendor/cad/'+path,self.location.href).href,print:()=>{},printErr:()=>{}});}
 const fn=['step','stp'].includes(format)?'ReadStepFile':'ReadIgesFile';
 const result=engine[fn](new Uint8Array(buffer),{linearUnit:'millimeter',linearDeflectionType:'bounding_box_ratio',linearDeflection:.001,angularDeflection:.35});
 if(!result.success||!result.meshes?.length)throw new Error('CAD 형상을 읽지 못했습니다. 파일을 다시 내보내 주세요.');
 if(result.meshes.length>2000)throw new Error('부품이 너무 많습니다. 필요한 부품만 별도 파일로 저장해 주세요.');
 let total=0;const transfers=[],meshes=result.meshes.map(m=>{total+=m.index.array.length/3;if(total>2000000)throw new Error('모델이 너무 복잡합니다. 단순화한 CAD를 사용해 주세요.');const position=new Float32Array(m.attributes.position.array),index=new Uint32Array(m.index.array),normal=m.attributes.normal?new Float32Array(m.attributes.normal.array):null;transfers.push(position.buffer,index.buffer);if(normal)transfers.push(normal.buffer);return {name:m.name,color:m.color,position,index,normal};});
 self.postMessage({success:true,meshes},transfers);
 }catch(e){self.postMessage({success:false,error:e.message||'도면 변환에 실패했습니다.'});}
};
