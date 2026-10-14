// Shared identity rules for browser and server. Do not erase sequel/part labels.
export const titleKey=value=>String(value||'').normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}+]+/gu,' ').trim();
const editionPart=row=>String(row.title||'').normalize('NFKC').toLowerCase().match(/\b(part|season|vol(?:ume)?|book)\s*([0-9ivx]+)/)?.slice(1).join(':')||'';
const identities=row=>new Set((row.identityKeys||[]).filter(x=>typeof x==='string'&&/^[a-z][a-z0-9]*:[a-zA-Z0-9_-]{1,160}$/.test(x)));
function conflicts(a,b){
 const sharedEdition=[...a].some(id=>b.has(id)&&id.startsWith('mdx:'));
 const sharedWork=[...a].some(id=>b.has(id)&&/^(?:mal|anilist|kitsu|mu):/.test(id));
 const left=new Map(); for(const id of a){const [provider,value]=id.split(':');const s=left.get(provider)||new Set();s.add(value);left.set(provider,s);}
 for(const id of b){const [provider,value]=id.split(':');if(provider==='mdx'&&(sharedEdition||sharedWork))continue;if(left.has(provider)&&!left.get(provider).has(value))return true;} return false;
}
export function groupSeries(items,group=true){
 const distinct=[...new Map(items.filter(x=>x&&typeof x.id==='string'&&typeof x.title==='string').map(x=>[x.id,x])).values()];
 if(!group)return distinct.map(row=>({primary:row,editions:[row]}));
 const groups=[],keyIndex=new Map(),titleIndex=new Map(),order=new Map(distinct.map((row,i)=>[row.id,i]));
 const root=g=>{let r=g;while(r.parent)r=r.parent;while(g.parent&&g.parent!==r){const next=g.parent;g.parent=r;g=next;}return r;};
 const indexed=(index,key,g)=>{const set=index.get(key)||new Set();set.add(g);index.set(key,set);};
 const authorTitle=row=>titleKey(row.author)+'\0'+titleKey(row.title);
 function compatible(a,b){
  if(conflicts(a.keys,b.keys)||conflicts(b.keys,a.keys))return false;
  const parts=new Set([...a.editions,...b.editions].map(editionPart).filter(Boolean));if(parts.size>1)return false;
  if([...a.keys].some(key=>b.keys.has(key)))return true;
  if(a.editions.some(x=>b.editions.some(y=>y.sourceId===x.sourceId))||a.keys.size&&b.keys.size)return false;
  return a.editions.some(x=>titleKey(x.author)&&b.editions.some(y=>authorTitle(x)===authorTitle(y)));
 }
 function candidates(g){const found=new Set();for(const key of g.keys)for(const other of keyIndex.get(key)||[])found.add(root(other));
  for(const row of g.editions)if(titleKey(row.author))for(const other of titleIndex.get(authorTitle(row))||[])found.add(root(other));return [...found].filter(other=>other!==g).sort((a,b)=>a.index-b.index);}
 for(const [index,row]of distinct.entries()){
  let found={index,editions:[row],keys:identities(row)};groups.push(found);
  // A later trusted relationship may connect two earlier edition groups.
  // Merge the whole compatible groups, rechecking contradictory work IDs and
  // sequel parts, instead of retaining an order-dependent duplicate count.
  let merged;do{merged=false;for(const other of candidates(found))if(compatible(found,other)){
   const keep=found.index<other.index?found:other,drop=keep===found?other:found;drop.parent=keep;keep.editions.push(...drop.editions);for(const key of drop.keys)keep.keys.add(key);found=keep;merged=true;
  }}while(merged);
  for(const key of found.keys)indexed(keyIndex,key,found);for(const edition of found.editions)if(titleKey(edition.author))indexed(titleIndex,authorTitle(edition),found);
 }
 return groups.filter(g=>!g.parent).sort((a,b)=>a.index-b.index).map(g=>{const editions=g.editions.sort((a,b)=>order.get(a.id)-order.get(b.id)),primary=editions.find(x=>!x.catalogueOnly&&!x.publisherUrl)||editions[0];return {primary,editions};});
}
export function uniqueChapters(items){return [...new Map(items.filter(x=>x&&typeof x.id==='string'&&Number.isFinite(x.chapterNumber)).map(x=>[x.id,x])).values()];}
export function canonicalProvider(name,registry){const key=String(name).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,'');return registry.providers.find(x=>[x.name,...x.aliases].some(n=>String(n).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,'')===key));}
export function validNewIdentity(id,provider,registered){
 return /^[a-z0-9]{1,40}$/.test(provider)&&registered.includes(provider)&&typeof id==='string'&&id.startsWith(provider+'-')&&
 /^[a-zA-Z0-9_~.-]{1,900}$/.test(id.slice(provider.length+1))&&!id.slice(provider.length+1).includes('..');
}
