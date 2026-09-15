import {byId} from './catalog.js';
export function normalizeDesign(raw){
 if(!raw||typeof raw!=='object')throw new Error('올바른 설계 파일이 아닙니다.');
 const kind=raw.kind||raw.id; if(!['long','grooved'].includes(kind))throw new Error('금속·피복 롤 또는 사선 홈 롤을 선택하세요.');
 const fields={face:[100,4000],diameter:[60,600],shaft:[15,180],left:[80,1000],right:[80,1000],grooveDepth:[1,15],lead:[100,2000],starts:[2,16]};
 const p=structuredClone(byId(kind));for(const [k,[lo,hi]] of Object.entries(fields)){const n=Number(raw[k]??p[k]??{grooveDepth:4,lead:680,starts:8}[k]);if(!Number.isFinite(n)||n<lo||n>hi||!Number.isInteger(n))throw new Error(`${k}: ${lo}~${hi} 범위의 정수를 입력하세요.`);p[k]=n;}
 if(p.shaft*1.5>=p.diameter)throw new Error('롤 외경은 축 기준 지름의 1.5배보다 커야 합니다.');
 p.core=p.diameter-2*Math.max(p.grooveDepth+4,12);if(p.core< p.shaft*1.5+8)throw new Error('외경을 늘리거나 축 지름·홈 깊이를 줄여주세요.');
 if(!['original','steel','chrome','rubber','urethane','ivory'].includes(raw.surface||'original'))throw new Error('지원하지 않는 소재입니다.');
 p.surface=raw.surface||'original';p.name=kind==='grooved'?'사선 홈 롤 · 치수 시안':'금속·피복 롤 · 치수 시안';p.custom=true;p.version=1;p.notes='입력 치수에 따른 협의용 시안입니다. 내부 구조와 축 단차는 예시이며 제조 검토가 필요합니다.';return p;
}
export function download(data,name,type='application/octet-stream'){const u=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
