const film=document.getElementById('hero-film'),toggle=document.getElementById('film-toggle');
if(film&&toggle){
const sync=()=>{toggle.textContent=film.paused?'재생 ▷':'일시정지 Ⅱ';toggle.setAttribute('aria-label',film.paused?'영상 재생':'영상 일시정지');};
if(matchMedia('(prefers-reduced-motion: reduce)').matches)film.pause();
film.addEventListener('play',sync);film.addEventListener('pause',sync);sync();
toggle.addEventListener('click',async()=>{if(film.paused){try{await film.play();}catch{toggle.textContent='다시 재생 ▷';}}else film.pause();});
}
const spots=[['01 · 롤 몸통','폭 방향으로 배치된 롤의 몸통입니다. 제품 단품과 설비 안에서의 배치를 함께 확인할 수 있습니다.'],['02 · 축과 지지부','롤 양 끝의 축과 이를 지지하는 부분입니다. 롤과 주변 부품이 연결되는 위치를 살펴보세요.'],['03 · 프레임','여러 높이의 롤을 배치하고 지지하는 구조입니다. 제품의 배치와 장치 전체의 외형을 함께 확인할 수 있습니다.']];
document.querySelectorAll('[data-spot]').forEach(b=>b.addEventListener('click',()=>{const item=spots[Number(b.dataset.spot)];document.getElementById('spot-title').textContent=item[0];document.getElementById('spot-description').textContent=item[1];document.querySelectorAll('[data-spot]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));
document.getElementById('copy-address')?.addEventListener('click',async()=>{const address=document.getElementById('company-address').textContent;try{await navigator.clipboard.writeText(address);document.getElementById('map-status').textContent='주소를 복사했습니다.';}catch{document.getElementById('map-status').textContent='주소를 길게 누르거나 선택해 복사하세요: '+address;}});
