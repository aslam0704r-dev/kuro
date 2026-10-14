import { unknownManga, strip, pageNumber, httpsURL } from './common.mjs';
import { sourceError } from '../transport.mjs';
const BASE='https://guya.cubari.moe/';
const valid=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,200}$/.test(value)&&!value.includes('..');
function seriesId(value){if(typeof value!=='string'||!value.startsWith('guya-')||!valid(value.slice(5)))throw sourceError('Invalid Guya identity',400);return value.slice(5);}
function map(provider,title,row){return {...unknownManga(provider,'guya-'+row.slug,title),description:strip(row.description),author:row.author||undefined,artist:row.artist||undefined,coverUrl:httpsURL(row.cover,BASE)};}
export function createGuyaAdapter(provider,read){
 const all=()=>read(BASE+'api/get_all_series/',{json:true});
 const details=slug=>read(BASE+'api/series/'+slug+'/',{json:true});
 return {async call(action,params={}){
  if(['search','popular','latest'].includes(action)){
   if(params.filters?.genres?.length||params.filters?.status?.length||params.filters?.kind&&params.filters.kind!=='ALL')return {items:[],notice:'Clear status, genres and kind to include Guya; its API does not provide these classifications.'};
   const values=Object.entries(await all()).filter(([title,row])=>valid(row.slug)&&(!params.q||(title+' '+row.slug).toLowerCase().includes(params.q.toLowerCase())));
   if(action==='latest')values.sort((a,b)=>(b[1].last_updated||0)-(a[1].last_updated||0));
   const page=pageNumber(params.page),start=(page-1)*24;const result={items:values.slice(start,start+24).map(([title,row])=>map(provider,title,row)),total:values.length};
   if(start+24<values.length)result.nextPage=page+1;return result;
  }
  if(action==='details'){const slug=seriesId(params.id);const row=await details(slug);return map(provider,row.title||slug,{...row,slug});}
  if(action==='chapters'){
   const slug=seriesId(params.id),row=await details(slug);const chapters=[];
   for(const [number,ch]of Object.entries(row.chapters||{})){if(!/^\d+(?:\.\d+)?$/.test(number))continue;
    for(const [group,files]of Object.entries(ch.groups||{})){if(!/^\d+$/.test(group)||!Array.isArray(files)||!files.length)continue;
     chapters.push({id:'guya:'+slug+'~'+number+'~'+group,mangaId:params.id,sourceId:'guya',title:strip(ch.title),chapterNumber:Number(number),
      publishDate:Number.isFinite(Number(ch.release_date?.[group]))?Number(ch.release_date[group])*1000:0,volumeNumber:Number(ch.volume)||undefined,language:'en',pages:files.length,group:row.groups?.[group]});}
   }return chapters.sort((a,b)=>b.chapterNumber-a.chapterNumber||b.publishDate-a.publishDate);
  }
  if(action==='pages'){
   const match=/^guya:([a-zA-Z0-9_-]{1,200})~(\d+(?:\.\d+)?)~(\d+)$/.exec(params.id||'');if(!match)throw sourceError('Invalid Guya chapter',400);
   const [,slug,number,group]=match,row=await details(slug),chapter=row.chapters?.[number];if(!chapter||!valid(chapter.folder)||!Array.isArray(chapter.groups?.[group]))throw sourceError('Guya chapter unavailable');
   const files=chapter.groups[group];if(!files.every(file=>typeof file==='string'&&/^[a-zA-Z0-9_.-]+(?:\?[a-zA-Z0-9_.=&-]+)?$/.test(file)&&!file.includes('..')))throw sourceError('Invalid Guya page filename');
   return {chapterId:params.id,pages:files.map((file,index)=>({index,url:BASE+'media/manga/'+slug+'/chapters/'+chapter.folder+'/'+group+'/'+file})),credits:[{name:row.groups?.[group]||'Guya.moe scanlation group',url:BASE+'read/manga/'+slug+'/'}]};
  }throw sourceError('Unsupported provider operation',400);
 }};
}
