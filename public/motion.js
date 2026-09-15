// Educational layer reveal, not a service/disassembly procedure.
export function phaseForPart(r,p){
 if(p.model==='roller'){
  if(/볼트|와셔/.test(r.name))return 1;
  if(/칼라|끝단 나사/.test(r.name))return 2;
  if(/플랜지/.test(r.name))return 3;
  if(/단차 축/.test(r.name))return 4;
  if(r.family==='표면층')return 5;
  return 0;
 }
 if(p.model==='assembly'){
  if(/볼트|와셔/.test(r.name))return 1;
  if(r.family==='측면 기어'||r.family==='높이 조절부')return 2;
  if(/축 지지부/.test(r.family))return 3;
  if(/단 롤/.test(r.family))return 4;
  return 5;
 }
 return 1;
}
export function phaseProgress(t,stage){if(!stage)return 0;const x=Math.max(0,Math.min(1,t*5-(stage-1)));return x*x*(3-2*x);}
export function phaseLabels(p){return p.model==='roller'?['조립 상태','체결 부품','고정 부품','단부 연결','축 구조','표면층·심관']:['조립 상태','체결 부품',p.id==='frame-unit'?'높이 조절부':'구동부','축 지지부','롤 모듈','지지 프레임'];}
export function phaseDescriptions(p){return p.model==='roller'?['제품 전체의 배치를 확인합니다.','볼트와 와셔의 위치를 구분합니다. 규격은 설명용 가정입니다.','축 칼라와 끝단 고정부를 구분합니다.','단부 플랜지와 몸통의 연결을 살펴봅니다. 실제 접합 방식은 확인이 필요합니다.','좌우 단차 축의 지지·체결 구간을 살펴봅니다.','피복과 심관의 관계를 보여주는 분리 표현입니다. 실제로 벗겨 분해할 수 있다는 의미는 아닙니다.']:['롤과 프레임의 배치를 확인합니다.','체결 위치를 구분해 보여줍니다.',p.id==='frame-unit'?'높이 조절 나사축과 너트 블록의 관계를 펼쳐 보여줍니다.':'구동 기어와 허브의 위치를 펼쳐 보여줍니다.','축을 지지하는 부품의 관계를 살펴봅니다.','각 롤 모듈의 배치를 분리해 보여줍니다.','프레임과 연결 구조를 펼칩니다. 모든 순서는 구조 설명용이며 정비 절차가 아닙니다.'];}
