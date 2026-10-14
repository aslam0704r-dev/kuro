import {unknownManga,strip,statusOf,httpsURL,pageNumber,timestamp,applyPageFilters} from './common.mjs';
import {sourceError} from '../transport.mjs';
const number=value=>Number.isSafeInteger(Number(value))&&Number(value)>0?Number(value):null;
export function createIkenAdapter(p,read){
 const api=(path,params={})=>{const url=new URL(path,p.apiUrl);for(const [key,value]of Object.entries(params))url.searchParams.set(key,String(value));return read(url.href,{json:true});};
 const encode=row=>p.id+'-'+Buffer.from(JSON.stringify([row.slug,number(row.id)])).toString('base64url');
 function decode(id){if(typeof id!=='string'||!id.startsWith(p.id+'-'))throw sourceError('Invalid source identity',400);const encoded=id.slice(p.id.length+1);if(!/^[a-zA-Z0-9_-]{1,900}$/.test(encoded))throw sourceError('Invalid source identity',400);
  let data;try{data=JSON.parse(Buffer.from(encoded,'base64url').toString());}catch{throw sourceError('Invalid source identity',400);}
  if(!Array.isArray(data)||data.length!==2||typeof data[0]!=='string'||!data[0]||data[0].length>250||/[\/\\\x00-\x1f\x7f]/.test(data[0])||!number(data[1])||Buffer.from(JSON.stringify(data)).toString('base64url')!==encoded)throw sourceError('Invalid source identity',400);return data;}
 const map=row=>({...unknownManga(p,encode(row),row.postTitle),description:strip(row.postContent),coverUrl:httpsURL(row.featuredImage,p.website),author:strip(row.author)||undefined,
  genres:Array.isArray(row.genres)?row.genres.map(x=>strip(x.name)).slice(0,40):[],status:statusOf(row.seriesStatus),kind:['MANGA','MANHWA','MANHUA'].includes(row.seriesType)?row.seriesType:undefined,altTitles:typeof row.alternativeTitles==='string'?row.alternativeTitles.split(/;|\n/).map(strip).slice(0,30):[]});
 const visible=row=>row&&!row.isLocked&&!row.isTimeLocked&&!(Number(row.price)>0)&&number(row.id)&&Number.isFinite(Number(row.number))&&Number(row.number)>=0;
 return {async call(action,params={}){
  if(['search','popular','latest'].includes(action)){
   const page=pageNumber(params.page),data=await api('/api/query',{page,perPage:18,searchTerm:params.q||'',orderBy:action==='popular'||params.filters?.sort==='POPULAR'?'totalViews':'lastChapterAddedAt',orderDirection:'desc'});
   if(!Array.isArray(data.posts)||data.posts.length>500)throw sourceError('Public source catalogue unavailable');
   const items=data.posts.filter(row=>!row.isNovel&&!/novel/i.test(row.seriesType||'')&&number(row.id)&&row.slug&&row.postTitle).map(map);
   return applyPageFilters({items,...Number(data.totalCount)>page*18?{nextPage:page+1}:{}},params.filters);
  }
  if(action==='details'||action==='chapters'){
   const [slug,id]=decode(params.id),data=await api('/api/post',{postSlug:slug});if(!data.post||number(data.post.id)!==id||data.post.isNovel)throw sourceError('Source title details unavailable');
   if(action==='details')return {...map(data.post),id:params.id};let chapters=data.post.chapters;
   if(!Array.isArray(chapters))throw sourceError('Public source chapters unavailable');
   if(Number(data.totalChapterCount)>chapters.length){const full=await api('/api/chapters',{postId:id});if(!Array.isArray(full.post?.chapters)||full.post.chapters.length<Number(data.totalChapterCount))throw sourceError('Complete public chapter list unavailable');chapters=full.post.chapters;}
   return chapters.filter(visible).map(row=>({id:p.id+':'+number(row.id),mangaId:params.id,sourceId:p.id,chapterNumber:Number(row.number),title:'Chapter '+Number(row.number)+(row.title?' · '+strip(row.title):''),language:p.language||'en',publishDate:timestamp(row.createdAt)})).sort((a,b)=>b.chapterNumber-a.chapterNumber);
  }
  if(action==='pages'){
   const match=new RegExp('^'+p.id+':(\\d{1,12})$').exec(params.id||'');if(!match)throw sourceError('Invalid source chapter identity',400);
   const data=(await api('/api/chapter',{chapterId:match[1]})).chapter;
   if(!data||data.isLocked||data.isLockedByCoins||data.isTimeLocked||data.isPermanentlyLocked||data.isShortLinkLocked)throw sourceError('Source chapter is locked',403);
   if(!Array.isArray(data.images)||!data.images.length||data.images.length>500)throw sourceError('No public reading manifest');
   const images=[...data.images].sort((a,b)=>(Number.isFinite(a.order)?a.order:Infinity)-(Number.isFinite(b.order)?b.order:Infinity));
   return {chapterId:params.id,pages:images.map((row,index)=>{const url=httpsURL(row.url,p.website);if(!url)throw sourceError('Invalid source page URL');return {index,url};}),credits:[{name:p.name,url:p.website}]};
  }
  throw sourceError('Unsupported provider operation',400);
 }};
}
