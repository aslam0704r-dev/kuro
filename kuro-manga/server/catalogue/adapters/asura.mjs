import {htmlDocument,unknownManga,strip,statusOf,httpsURL,pageNumber,timestamp,applyPageFilters} from './common.mjs';
import {sourceError} from '../transport.mjs';
import {tileTransform} from '../images.mjs';
function astroData(html,required){
 const $=htmlDocument(html);let found,nodes=0;
 function unwrap(value,depth=0){if(++nodes>100000||depth>24)throw sourceError('Source data exceeds parsing limits');
  if(Array.isArray(value)){if(value.length===1&&Number.isInteger(value[0]))return null;if(value.length===2&&Number.isInteger(value[0])&&value[0]>=0&&value[0]<=11)return unwrap(value[1],depth+1);return value.map(x=>unwrap(x,depth+1));}
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,unwrap(v,depth+1)]));return value;}
 $('[props]').each((_,element)=>{if(found)return;const literal=$(element).attr('props');if(!required.every(key=>literal.includes('"'+key+'"')))return;
  let data;try{data=unwrap(JSON.parse(literal));}catch(error){if(error.status)throw error;return;}
  if(required.every(key=>Object.hasOwn(data||{},key)))found=data;});
 if(!found)throw sourceError('Public source data unavailable');return found;
}
export function createAsuraAdapter(p,read){
 const slug=id=>{const prefix=p.id+'-';if(typeof id!=='string'||!id.startsWith(prefix)||! /^[a-z0-9][a-z0-9-]{0,180}$/.test(id.slice(prefix.length)))throw sourceError('Invalid source identity',400);return id.slice(prefix.length);};
 async function document(series){return read(new URL('/comics/'+series,p.website).href);}
 function map(row,id){return {...unknownManga(p,id,row.title),description:strip(row.description),coverUrl:httpsURL(row.coverUrl||row.cover,p.website),author:strip(row.author)||undefined,
  altTitles:Array.isArray(row.alt_titles)?row.alt_titles.map(strip).slice(0,30):[],genres:Array.isArray(row.genres)?row.genres.map(x=>strip(x.name)).slice(0,40):[],status:statusOf(row.status),kind:['MANGA','MANHWA','MANHUA'].includes(String(row.type).toUpperCase())?String(row.type).toUpperCase():undefined,rating:Number.isFinite(row.rating)?row.rating:undefined};}
 return {async call(action,params={}){
  if(['search','popular','latest'].includes(action)){
   const page=pageNumber(params.page),url=new URL('https://api.asurascans.com/api/series');url.searchParams.set('offset',(page-1)*20);url.searchParams.set('limit','20');if(params.q)url.searchParams.set('search',params.q);
   url.searchParams.set('sort',action==='latest'||params.filters?.sort==='LATEST'?'latest':action==='popular'||params.filters?.sort==='POPULAR'?'popular':'latest');
   const data=await read(url.href,{json:true});if(data.data===null&&data.meta?.has_more===false)return {items:[]};if(!Array.isArray(data.data)||data.data.length>100)throw sourceError('Public source catalogue unavailable');
   const items=data.data.filter(row=>/^[a-z0-9][a-z0-9-]{0,180}$/.test(row.slug||'')&&row.title).map(row=>map(row,p.id+'-'+row.slug));
   return applyPageFilters({items,...data.meta?.has_more?{nextPage:page+1}:{}},params.filters);
  }
  if(action==='details'||action==='chapters'){
   const series=slug(params.id),html=await document(series);
   if(action==='details')return map(astroData(html,['title','description']),params.id);
   const data=astroData(html,['chapters']);if(!Array.isArray(data.chapters))throw sourceError('Public source chapters unavailable');
   return data.chapters.filter(row=>!row.is_premium&&!row.is_locked&&!(timestamp(row.early_access_until)>Date.now())&&Number.isFinite(row.number)&&row.number>=0&&row.number<=100000)
    .map(row=>({id:p.id+':'+series+'~'+row.number,mangaId:params.id,sourceId:p.id,chapterNumber:row.number,title:'Chapter '+row.number+(row.title?' · '+strip(row.title):''),language:p.language||'en',publishDate:timestamp(row.created_at||row.published_at)})).sort((a,b)=>b.chapterNumber-a.chapterNumber);
  }
  if(action==='pages'){
   const match=new RegExp('^'+p.id+':([a-z0-9][a-z0-9-]{0,180})~(\\d{1,6}(?:\\.\\d{1,6})?)$').exec(params.id||'');if(!match)throw sourceError('Invalid source chapter identity',400);
   const [,series,number]=match,html=await document(series),chapters=astroData(html,['chapters']).chapters;
   const publicChapter=Array.isArray(chapters)&&chapters.find(row=>Number(row.number)===Number(number));
   if(!publicChapter||publicChapter.is_premium||publicChapter.is_locked||timestamp(publicChapter.early_access_until)>Date.now())throw sourceError('Source chapter is locked or unavailable to public readers',403);
   const details=astroData(html,['publicUrl']);let path;
   try{const u=new URL(details.publicUrl,p.website);if(u.origin!==new URL(p.website).origin||!/^\/comics\/[a-z0-9-]+$/.test(u.pathname)||u.search||u.hash)throw new Error();path=u.pathname;}catch{throw sourceError('Invalid public source reading path');}
   const data=astroData(await read(new URL(path+'/chapter/'+number,p.website).href),['pages']);if(!Array.isArray(data.pages)||!data.pages.length||data.pages.length>500)throw sourceError('No public source reading pages');
   return {chapterId:params.id,pages:data.pages.map((row,index)=>{const url=httpsURL(row.url,p.website);if(!url)throw sourceError('Invalid source page URL');
    const transform=Array.isArray(row.tiles)&&row.tiles.length?tileTransform({type:'tiles',columns:row.tile_cols||4,rows:row.tile_rows||5,order:row.tiles}):undefined;
    return {index,url,...transform?{transform}:{}};}),credits:[{name:p.name,url:p.website}]};
  }
  throw sourceError('Unsupported provider operation',400);
 }};
}
