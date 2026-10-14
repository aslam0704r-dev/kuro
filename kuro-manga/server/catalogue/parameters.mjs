import {sourceError} from './transport.mjs';
const catalogue=new Set(['search','popular','latest']);
export function canonicalParameters(action,input={}){
 const out={};if(catalogue.has(action)){
  out.page=Number(input.page||1);if(!Number.isSafeInteger(out.page)||out.page<1||out.page>100)throw sourceError('Invalid catalogue page',400);
  if(action==='search'){out.q=String(input.q||'').trim();if(out.q.length>120)throw sourceError('Search title is too long',400);const value=input.filters||{};
   if(!value||typeof value!=='object'||Array.isArray(value))throw sourceError('Invalid source filters',400);
   const filters={};if(value.kind!==undefined){if(!['ALL','MANGA','MANHWA','MANHUA'].includes(value.kind))throw sourceError('Invalid kind filter',400);filters.kind=value.kind;}
   if(value.sort!==undefined){if(!['RELEVANCE','POPULAR','LATEST','TITLE'].includes(value.sort))throw sourceError('Invalid sort filter',400);filters.sort=value.sort;}
   if(value.status!==undefined){if(!Array.isArray(value.status)||value.status.length>5||value.status.some(x=>!['ONGOING','COMPLETED','HIATUS','CANCELLED','UNKNOWN'].includes(x)))throw sourceError('Invalid status filter',400);filters.status=[...new Set(value.status)].sort();}
   if(value.genres!==undefined){if(!Array.isArray(value.genres)||value.genres.length>12||value.genres.some(x=>typeof x!=='string'||!x.trim()||x.length>64))throw sourceError('Invalid genre filter',400);filters.genres=[...new Set(value.genres.map(x=>x.trim()))].sort();}
   out.filters=filters;
  }
 }else{if(typeof input.id!=='string'||input.id.length>1400||!input.id)throw sourceError('Invalid provider identity',400);out.id=input.id;}
 return out;
}
