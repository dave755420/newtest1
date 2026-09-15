import * as T from './vendor/three.module.min.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {buildModel} from './geometry.js';
export class Viewer {
 constructor(host,onSelect){
  this.host=host;this.onSelect=onSelect;this.active=true;this.inView=true;this.dirty=true;this.explosion=0;this.targetExplosion=0;this.selected=null;this.isolated=false;this.section=false;this.scale=1;this.last=0;
  this.renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));this.renderer.setClearColor(0xedf0f3,0);this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;this.renderer.localClippingEnabled=true;host.appendChild(this.renderer.domElement);
  this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(31,1,1,20000);this.controls=new OrbitControls(this.camera,this.renderer.domElement);this.controls.enableDamping=true;this.controls.dampingFactor=.07;this.controls.autoRotateSpeed=.45;this.controls.enablePan=false;this.controls.minDistance=100;this.controls.maxDistance=12000;this.controls.addEventListener('change',()=>this.dirty=true);
  const pm=new T.PMREMGenerator(this.renderer),room=new RoomEnvironment();this.environment=pm.fromScene(room,.04).texture;this.scene.environment=this.environment;room.dispose();pm.dispose();
  this.scene.add(new T.HemisphereLight(0xf5f8ff,0x9aa6b2,2));const key=new T.DirectionalLight(0xffffff,3.5);key.position.set(-1000,1800,1600);this.scene.add(key);const rim=new T.DirectionalLight(0xd1dfed,2);rim.position.set(800,700,-1500);this.scene.add(rim);
  this.plane=new T.Plane(new T.Vector3(0,0,-1),0);this.ray=new T.Raycaster();this.pointer=new T.Vector2();
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(host);this.intersection=new IntersectionObserver(e=>{this.inView=e[0].isIntersecting;this.dirty=true;});this.intersection.observe(host);
  this.down=null;host.addEventListener('pointerdown',e=>{this.down=[e.clientX,e.clientY];});host.addEventListener('pointerup',e=>{if(this.down&&Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])<7)this.pick(e);this.down=null;});
  host.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Escape'].includes(e.key))return;e.preventDefault();if(e.key==='Escape'){this.select(null);return;}const off=this.camera.position.clone().sub(this.controls.target),s=new T.Spherical().setFromVector3(off);if(e.key==='ArrowLeft')s.theta-=.14;if(e.key==='ArrowRight')s.theta+=.14;if(e.key==='ArrowUp')s.phi=Math.max(.08,s.phi-.14);if(e.key==='ArrowDown')s.phi=Math.min(Math.PI-.08,s.phi+.14);if(e.key==='+'||e.key==='=')s.radius*=.9;if(e.key==='-')s.radius*=1.1;off.setFromSpherical(s);this.camera.position.copy(this.controls.target).add(off);this.controls.update();this.dirty=true;});
  this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.onSelect({error:'3D 화면 연결이 중단되었습니다. 페이지를 새로고침하거나 사진과 도면을 이용해 주세요.'});});
  this.loop=this.loop.bind(this);this.frame=requestAnimationFrame(this.loop);
 }
 load(p){if(this.model){this.scene.remove(this.model.root);this.model.dispose();}this.product=p;this.model=buildModel(p);this.scene.add(this.model.root);this.explosion=this.targetExplosion=0;this.selected=null;this.isolated=false;this.scale=1;this.section=false;this.fit('perspective');this.resize();this.dirty=true;return this.model.parts;}
 loadCad(model){if(this.model){this.scene.remove(this.model.root);this.model.dispose();}this.model=model;this.product={model:"cad"};this.scene.add(model.root);this.explosion=this.targetExplosion=0;this.selected=null;this.isolated=false;this.section=false;this.scale=1;this.resize();this.fit();this.dirty=true;}
 resize(){const w=this.host.clientWidth,h=this.host.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();if(this.model)this.fit(this.cameraPreset||'perspective');this.dirty=true;}
 bounds(){this.model.root.updateMatrixWorld(true);const box=new T.Box3();for(const r of this.model.parts){if(!r.mesh.visible)continue;r.mesh.geometry.computeBoundingBox();box.union(r.mesh.geometry.boundingBox.clone().applyMatrix4(r.mesh.matrixWorld));}return box;}
 fit(preset='perspective'){
  this.cameraPreset=preset;const box=this.bounds(),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
  let direction=preset==='front'?new T.Vector3(0,.01,1):preset==='end'?new T.Vector3(1,.03,.001):preset==='top'?new T.Vector3(0,1,.001):new T.Vector3(-.48,.35,1);
  if(this.product.model==='stand'&&preset==='perspective')direction.set(.48,.15,1);
  direction.normalize();const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),direction),inv=q.clone().invert();let maxX=0,maxY=0,maxZ=0;for(let a of [box.min.x,box.max.x])for(let b of [box.min.y,box.max.y])for(let c of [box.min.z,box.max.z]){const v=new T.Vector3(a,b,c).sub(center).applyQuaternion(inv);maxX=Math.max(maxX,Math.abs(v.x));maxY=Math.max(maxY,Math.abs(v.y));maxZ=Math.max(maxZ,Math.abs(v.z));}
  const tan=Math.tan(T.MathUtils.degToRad(this.camera.fov/2)),distance=Math.max(maxY/tan,maxX/(tan*this.camera.aspect))*1.2+maxZ;
  this.controls.target.copy(center);this.camera.position.copy(center).addScaledVector(direction,distance);this.controls.minDistance=Math.max(.05,Math.min(size.x,size.y,size.z)*.3);this.controls.maxDistance=distance*4;this.camera.near=Math.max(.5,distance/2000);this.camera.far=distance*15;this.camera.updateProjectionMatrix();this.controls.update();this.dirty=true;
 }
 setExplosion(value){this.targetExplosion=T.MathUtils.clamp(value,0,1);this.model.explode(value===0?0:1,'staged');this.fit(this.cameraPreset);this.model.explode(this.explosion,'staged');this.dirty=true;}
 setWireframe(on){for(const r of this.model.parts)r.mesh.material.wireframe=on;this.dirty=true;}
 setSection(on){this.section=on;for(const r of this.model.parts){r.mesh.material.clippingPlanes=on?[this.plane]:[];r.mesh.material.clipShadows=true;r.mesh.material.needsUpdate=true;}this.dirty=true;}
 setMaterial(values){for(const r of this.model.parts){if(!r.originalSurface)r.originalSurface={color:r.mesh.material.color.clone(),metalness:r.mesh.material.metalness,roughness:r.mesh.material.roughness};if(this.product.model!=='cad'&&!/표면층|롤 모듈|롤 몸통|피복|롤 본체/.test(r.family)&&!/롤 몸통|롤 표면|사선 홈 표면|피복|^원형 베이스$|^수직 기둥$|^연결 암$/.test(r.name))continue;const m=r.mesh.material;if(values){m.color.setHex(values[0]);m.metalness=values[1];m.roughness=values[2];}else{m.color.copy(r.originalSurface.color);m.metalness=r.originalSurface.metalness;m.roughness=r.originalSurface.roughness;}m.needsUpdate=true;}this.dirty=true;}
 snapshot(){this.renderer.render(this.scene,this.camera);return this.renderer.domElement.toDataURL('image/png');}
 setScale(ratio){this.scale=ratio;this.model.root.scale.setScalar(ratio);this.fit();}
 setActive(on){this.active=on;this.dirty=true;}
 rotate(on){this.controls.autoRotate=on;this.dirty=true;}
 pick(e){if(!this.active||!this.model)return;const r=this.host.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);const hits=this.ray.intersectObjects(this.model.parts.filter(r=>r.mesh.visible).map(r=>r.mesh));let hit=hits.find(h=>!this.section||this.plane.distanceToPoint(h.point)>=0);if(hit)this.select(hit.object.userData.part);}
 select(id){this.selected=id;const rec=this.model.parts.find(r=>r.id===id);for(const r of this.model.parts){const match=id===r.id;r.mesh.material.emissive.setHex(match?0x304357:0x000000);r.mesh.material.emissiveIntensity=match?.65:0;r.mesh.visible=!this.isolated||!id||r.id===id;}this.onSelect(rec||null);this.dirty=true;}
 isolate(on){this.isolated=on;this.select(this.selected);if(on&&this.selected){const mesh=this.model.parts.find(r=>r.id===this.selected)?.mesh;if(mesh){this.fit();}}else this.fit();}
 loop(now){this.frame=requestAnimationFrame(this.loop);if(!this.active||!this.inView||document.hidden||!this.model)return;const dt=Math.min((now-this.last)/1000,.05);this.last=now;
  const moving=Math.abs(this.targetExplosion-this.explosion)>.0005;if(moving){this.explosion=matchMedia('(prefers-reduced-motion: reduce)').matches?this.targetExplosion:T.MathUtils.lerp(this.explosion,this.targetExplosion,.16);this.model.explode(this.explosion,'staged');this.dirty=true;}else if(this.explosion!==this.targetExplosion){this.explosion=this.targetExplosion;this.model.explode(this.explosion,'staged');this.dirty=true;}
  this.controls.update(dt);if(this.dirty||this.controls.autoRotate){this.renderer.render(this.scene,this.camera);this.dirty=false;}
 }
 dispose(){cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.intersection.disconnect();this.controls.dispose();this.model?.dispose();this.environment.dispose();this.renderer.dispose();}
}
