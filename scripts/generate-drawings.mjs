import {mkdir,writeFile} from 'node:fs/promises';
import {products} from '../public/catalog.js';
import {makeSheet} from '../public/drawings.js';
await mkdir(new URL('../public/drawings/',import.meta.url),{recursive:true});
for(const p of products)for(const type of ['assembly','detail','exploded']){const result=makeSheet(p,type);for(const ext of ['svg','dxf'])await writeFile(new URL(`../public/drawings/${p.id}-${type}.${ext}`,import.meta.url),result[ext]);}
await writeFile(new URL('../public/drawings/model-parameters.json',import.meta.url),JSON.stringify({revision:'TEST2-A',units:'mm',status:'Photo-proportioned study dimensions; unmeasured and not manufacturing drawings.',products},null,2));
console.log('Generated 18 SVG and 18 DXF sheets from shared product dimensions.');
