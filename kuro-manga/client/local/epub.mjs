// Only parse the EPUB's reading order. Never mount its HTML, SVG, links or scripts.
export function epubPages({pages,metadata}){
 const parse=value=>{if(!value)throw new Error('This EPUB is missing its reading-order metadata.');if(/<!ENTITY/i.test(value))throw new Error('EPUB entity declarations are not supported.');const doc=new DOMParser().parseFromString(value,'application/xml');if(doc.querySelector('parsererror'))throw new Error('The EPUB reading-order metadata is damaged.');return doc;};
 const elements=(doc,name)=>[...doc.getElementsByTagNameNS('*',name)];
 const resolve=(href,base)=>{const u=new URL(href,'https://epub.invalid/'+base);if(u.origin!=='https://epub.invalid'||u.search)throw new Error('This EPUB references a page outside the comic file.');return decodeURIComponent(u.pathname.slice(1));};
 const container=parse(metadata['META-INF/container.xml']),opf=elements(container,'rootfile')[0]?.getAttribute('full-path');
 if(!opf||!metadata[opf])throw new Error('This EPUB is missing its content manifest.');
 const doc=parse(metadata[opf]),manifest=new Map(elements(doc,'item').map(item=>[item.getAttribute('id'),resolve(item.getAttribute('href')||'',opf)]));
 const images=new Map(pages.map(page=>[page.name,page])),ordered=[];
 const add=name=>{const image=images.get(name);if(!image)throw new Error('A comic page referenced by this EPUB is missing or unsupported.');if(ordered.length>=600)throw new Error('Import up to 600 EPUB pages at a time.');ordered.push(image);};
 for(const item of elements(doc,'itemref')){
  if(item.getAttribute('linear')==='no')continue;
  const name=manifest.get(item.getAttribute('idref'));if(!name)throw new Error('This EPUB has a damaged reading order.');
  if(images.has(name)){add(name);continue;}
  const page=parse(metadata[name]);for(const image of [...page.getElementsByTagName('*')].filter(node=>['img','image'].includes(node.localName))){const href=image.getAttribute('src')||image.getAttribute('href')||image.getAttributeNS('http://www.w3.org/1999/xlink','href');if(href)add(resolve(href,name));}
 }
 if(!ordered.length)throw new Error('No comic images were found in the EPUB reading order. Text-only EPUBs are not supported.');
 return ordered;
}
