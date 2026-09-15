// Keep existing product and section bookmarks working after the homepage was shortened.
const destinations={process:'./company.html#process',records:'./company.html#records',company:'./company.html#company',directions:'./location.html',exhibition:'./products.html#exhibition'};
const product=new URLSearchParams(location.search).get('product');
if(product)location.replace('./products.html?product='+encodeURIComponent(product)+'#exhibition');
else if(destinations[location.hash.slice(1)])location.replace(destinations[location.hash.slice(1)]);

// Give the main homepage a direct route into the parametric drawing builder.
const shortcuts=document.querySelector('.hero-shortcuts');
if(shortcuts&&!shortcuts.querySelector('[data-drawing-builder]')){
 const link=document.createElement('a');
 link.href='./drawing-builder.html';
 link.dataset.drawingBuilder='true';
 link.innerHTML='실제 도안 생성 <span aria-hidden="true">↗</span>';
 shortcuts.insertBefore(link,shortcuts.querySelector('.hero-quote')||null);
}
