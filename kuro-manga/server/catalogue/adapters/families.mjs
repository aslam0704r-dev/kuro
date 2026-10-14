import {createMadaraAdapter,parseMadaraCatalogue,parseMadaraDetails,parseMadaraChapters,parseMadaraPages,decodePathId} from './madara.mjs';
import {pageNumber} from './common.mjs';
import {sourceError} from '../transport.mjs';

export function createFamilyAdapter(provider,read){
 if(provider.adapter==='madara')return createMadaraAdapter(provider,read);
 const shared=createMadaraAdapter(provider,read);
 return {async call(action,params={}){
  if(['search','popular','latest'].includes(action)){
   const page=pageNumber(params.page),filters=params.filters;
   if(filters?.genres?.length||filters?.status?.length||filters?.kind&&filters.kind!=='ALL')return {items:[],notice:'Use All kinds and clear status/genres for this source.'};
   let url;
   if(provider.adapter==='themesia'){
    url=new URL(provider.seriesPath||'/manga/',provider.website);url.searchParams.set('page',page);
    if(params.q)url.searchParams.set('title',params.q);
    url.searchParams.set('order',action==='latest'||filters?.sort==='LATEST'?'update':action==='popular'||filters?.sort==='POPULAR'?'popular':'');
   }else if(provider.adapter==='keyoapp'){
    url=new URL(action==='latest'?'/latest/':action==='popular'?'/':provider.seriesPath||'/series/',provider.website);
    if(params.q)url.searchParams.set('q',params.q);if(page>1)url.searchParams.set('page',page);
   }else throw sourceError('Unsupported source family',400);
   return parseMadaraCatalogue(await read(url.href),provider,page);
  }
  if(action==='details')return parseMadaraDetails(await read(new URL(decodePathId(provider,params.id,'-'),provider.website).href),provider,params.id);
  if(action==='chapters'){
   if(provider.adapter==='themesia'){
    const rows=parseMadaraChapters(await read(new URL(decodePathId(provider,params.id,'-'),provider.website).href),provider,params.id);
    if(!rows.length)throw sourceError('No public chapter list is available');return rows;
   }
   return shared.call(action,params);
  }
  if(action==='pages')return parseMadaraPages(await read(new URL(decodePathId(provider,params.id,':'),provider.website).href),provider,params.id);
  throw sourceError('Unsupported source operation',400);
 }};
}
