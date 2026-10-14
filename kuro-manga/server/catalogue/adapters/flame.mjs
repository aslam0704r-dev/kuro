import {htmlDocument,unknownManga,strip,statusOf,pageNumber,applyPageFilters} from './common.mjs';
import {sourceError} from '../transport.mjs';
const normal=value=>String(value||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
const part=value=>{if(typeof value!=='string'||!value||value.length>1000||/[\\/\x00-\x1f\x7f]/.test(value)||['.','..'].includes(value))throw sourceError('Invalid source image name');return encodeURIComponent(value);};
export function createFlameAdapter(p,read){
 let buildId;
 const numeric=(id,separator)=>{const prefix=p.id+separator;if(typeof id!=='string'||!id.startsWith(prefix)||!/^\d{1,9}$/.test(id.slice(prefix.length)))throw sourceError('Invalid source identity',400);return id.slice(prefix.length);};
 async function build(force=false){if(!buildId||force){const $=htmlDocument(await read(p.website,force?{refresh:true}:undefined));let data;try{data=JSON.parse($('#__NEXT_DATA__').text());}catch{throw sourceError('Source deployment metadata unavailable');}
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(data.buildId||''))throw sourceError('Source deployment metadata unavailable');buildId=data.buildId;}return buildId;}
 async function data(path){const id=await build();try{return (await read(new URL('/_next/data/'+id+'/'+path,p.website).href,{json:true})).pageProps;}
  catch(error){if(!/404/.test(error.message))throw error;const next=await build(true);if(next===id)throw error;return (await read(new URL('/_next/data/'+next+'/'+path,p.website).href,{json:true})).pageProps;}}
 const cover=(id,file,stamp)=>'https://cdn.flamecomics.xyz/uploads/images/series/'+id+'/'+part(file)+(stamp?'?'+Number(stamp):'');
 function map(row){const id=String(row?.series_id||'');if(!/^\d{1,9}$/.test(id)||!row.title)return null;
  return {...unknownManga(p,p.id+'-'+id,row.title),coverUrl:row.cover?cover(id,row.cover,row.last_edit):'',description:strip(row.description),
   altTitles:Array.isArray(row.altTitles)?row.altTitles.map(strip).slice(0,30):[],author:Array.isArray(row.author)?row.author.map(strip).join(', '):undefined,
   genres:Array.isArray(row.tags||row.categories)?(row.tags||row.categories).map(strip).slice(0,40):[],status:statusOf(row.status),kind:['MANGA','MANHWA','MANHUA'].includes(String(row.type).toUpperCase())?String(row.type).toUpperCase():undefined};}
 return {async call(action,params={}){
  if(['search','popular','latest'].includes(action)){
   const page=pageNumber(params.page);let rows;
   if(action==='latest'){const value=await data('index.json');rows=value?.latestEntries?.blocks?.[0]?.series;}
   else rows=(await data('browse.json'))?.series;
   if(!Array.isArray(rows)||rows.length>10000)throw sourceError('Source catalogue data unavailable');
   if(action==='popular'||params.filters?.sort==='POPULAR')rows=[...rows].sort((a,b)=>Number.isFinite(a.popularityRank)&&Number.isFinite(b.popularityRank)?a.popularityRank-b.popularityRank:(b.views||0)-(a.views||0));
   if(action==='search'&&params.filters?.sort==='LATEST')rows=[...rows].sort((a,b)=>(b.last_edit||0)-(a.last_edit||0));
   const q=normal(params.q);if(q)rows=rows.filter(row=>[row.title,...row.altTitles||[]].some(title=>normal(title).includes(q)));
   const items=rows.map(map).filter(Boolean),start=(page-1)*48;return applyPageFilters({items:items.slice(start,start+48),...start+48<items.length?{nextPage:page+1}:{}},params.filters);
  }
  if(action==='details'||action==='chapters'){
   const id=numeric(params.id,'-'),value=await data('series/'+id+'.json?id='+id);
   if(action==='details'){const row=map(value?.series);if(!row||row.id!==params.id)throw sourceError('Source title details unavailable');return row;}
   if(!Array.isArray(value?.chapters))throw sourceError('Source chapters unavailable');
   return value.chapters.filter(row=>!row.premium&&!row.locked&&!row.is_locked&&Number(row.series_id)===Number(id)&&/^[a-zA-Z0-9_-]{1,160}$/.test(row.token)&&/^\d+(?:\.\d+)?$/.test(String(row.chapter))&&Number.isFinite(Number(row.chapter))&&Number(row.release_date)*1000<=Date.now())
    .map(row=>({id:p.id+':'+id+'~'+row.token,mangaId:params.id,sourceId:p.id,chapterNumber:Number(row.chapter),title:'Chapter '+Number(row.chapter)+(row.title?' · '+strip(row.title):''),language:p.language||'en',publishDate:Number(row.release_date)>0?Number(row.release_date)*1000:0})).sort((a,b)=>b.chapterNumber-a.chapterNumber||b.publishDate-a.publishDate);
  }
  if(action==='pages'){
   const match=new RegExp('^'+p.id+':(\\d{1,9})~([a-zA-Z0-9_-]{1,160})$').exec(params.id||'');if(!match)throw sourceError('Invalid source chapter identity',400);
   const [,id,token]=match,series=await data('series/'+id+'.json?id='+id),entry=series?.chapters?.find(row=>row.token===token&&Number(row.series_id)===Number(id));
   if(!entry||entry.premium||entry.locked||entry.is_locked||Number(entry.price)>0||Number(entry.release_date)*1000>Date.now())throw sourceError('Source chapter is locked or unavailable to public readers',403);
   const value=await data('series/'+id+'/'+token+'.json?id='+id+'&token='+token),chapter=value?.chapter;
   if(!chapter||String(chapter.series_id)!==id||chapter.token!==token||chapter.premium||chapter.locked)throw sourceError('No public reading manifest');
   const images=Object.values(chapter.images||{});if(!images.length||images.length>500)throw sourceError('No public reading manifest');
   return {chapterId:params.id,pages:images.map((image,index)=>({index,url:'https://cdn.flamecomics.xyz/uploads/images/series/'+id+'/'+part(token)+'/'+part(image.name)+'?'+Number(chapter.release_date||0)})),credits:[{name:p.name,url:p.website}]};
  }
  throw sourceError('Unsupported provider operation',400);
 }};
}
