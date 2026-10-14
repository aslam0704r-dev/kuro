import { load } from 'cheerio';
import { sourceError } from '../transport.mjs';

export const plain=value=>load('<div></div>').text(String(value||'')).text();
export const strip=value=>load(String(value||'')).text().replace(/\s+/g,' ').trim().slice(0,16000);
export function htmlDocument(html){
 if(typeof html!=='string'||!/<html|<li|<div/i.test(html)||/<title[^>]*>\s*(Just a moment|Access denied|Attention Required)|cf-chl-/i.test(html))throw sourceError('Source did not return its public catalogue');
 return load(html);
}
export const httpsURL=(url,base)=>{try{const value=new URL(String(url||'').trim(),base);return value.protocol==='https:'&&!value.username&&!value.password?value.href:'';}catch{return '';}};
export const unknownManga=(provider,id,title)=>({id,sourceId:provider.id,title:strip(title),description:'',coverUrl:'',status:'UNKNOWN',genres:[]});
export const statusOf=value=>/completed|finished|ended|^released$/i.test(value||'')?'COMPLETED':/ongoing|publishing|releasing|current/i.test(value||'')?'ONGOING':/hiatus/i.test(value||'')?'HIATUS':/cancel/i.test(value||'')?'CANCELLED':'UNKNOWN';
export function applyPageFilters(result,filters){
 if(!filters)return result;const statuses=Array.isArray(filters.status)?filters.status:[],genres=Array.isArray(filters.genres)?filters.genres:[];
 if(!statuses.length&&!genres.length&&!filters.kind||!statuses.length&&!genres.length&&filters.kind==='ALL')return result;
 const items=result.items.filter(row=>(!statuses.length||statuses.includes(row.status))&&genres.every(g=>row.genres.some(value=>value.toLowerCase()===g.toLowerCase()))&&(!filters.kind||filters.kind==='ALL'||row.kind===filters.kind));
 return {...result,items,notice:'Filters apply to the returned page. Continue to the next page for more matching records.'};
}
export const timestamp=value=>{const date=Date.parse(value||'');return Number.isFinite(date)?date:0;};
export function pageNumber(value){const number=Number(value||1);if(!Number.isSafeInteger(number)||number<1||number>100)throw sourceError('Invalid catalogue page',400);return number;}
