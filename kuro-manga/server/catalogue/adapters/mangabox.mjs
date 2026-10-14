import {htmlDocument,pageNumber,timestamp,applyPageFilters} from './common.mjs';
import {parseMadaraCatalogue,parseMadaraDetails,parseMadaraPages,encodePathId,decodePathId} from './madara.mjs';import {sourceError} from '../transport.mjs';
function literalArray(html,name){const match=new RegExp('\\b'+name+'\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*(?:;|\\r?\\n|</script>)').exec(html);if(!match)return [];
 let value;try{value=JSON.parse(match[1]);}catch{throw sourceError('Invalid public reader array');}
 if(!Array.isArray(value)||value.length>500||value.some(x=>typeof x!=='string'||x.length>4096))throw sourceError('Invalid public reader array');return value;}
export function createMangaBoxAdapter(provider,read){
 const p={...provider,seriesPath:provider.seriesPath||'/manga/',selectors:{catalogue:'.list-comic-item-wrap,.list-truyen-item-wrap,.story_item',title:'.manga-info-top h1,.panel-story-info h1,.panel-story-info h2',description:'#contentBox,#noidungm,#panel-story-info-description',pages:'.container-chapter-reader img',next:'.group-page a:not([href]) + a:not(.page-last),a.page-select + a:not(.page-last),a.page_select + a:not(.page_last)',...provider.selectors}};
 return {async call(action,params={}){
  if(['search','latest','popular'].includes(action)){
   const page=pageNumber(params.page),q=String(params.q||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'_').replace(/^_+|_+$/g,'');
   const path=q?'/search/story/'+encodeURIComponent(q):action==='popular'||params.filters?.sort==='POPULAR'?'/manga-list/hot-manga':'/manga-list/latest-manga';
   const url=new URL(path,p.website);url.searchParams.set('page',page);return applyPageFilters(parseMadaraCatalogue(await read(url.href),p,page),params.filters);
  }
  if(action==='details')return parseMadaraDetails(await read(new URL(decodePathId(p,params.id,'-'),p.website).href),p,params.id);
  if(action==='chapters'){
   const path=decodePathId(p,params.id,'-'),slug=path.replace(/\/$/,'').split('/').at(-1),url=new URL('/api/manga/'+slug+'/chapters?limit=-1',p.website),data=await read(url.href,{json:true});
   if(data.success!==true||!Array.isArray(data.data?.chapters))throw sourceError('Public source chapter API unavailable');
   return data.data.chapters.filter(row=>!row.locked&&!row.is_premium&&typeof row.chapter_slug==='string'&&/^[a-zA-Z0-9_-]{1,250}$/.test(row.chapter_slug)&&Number.isFinite(Number(row.chapter_num)))
    .map(row=>({id:encodePathId(p,path.replace(/\/$/,'')+'/'+row.chapter_slug,':'),mangaId:params.id,sourceId:p.id,title:String(row.chapter_name||'Chapter '+Number(row.chapter_num)),chapterNumber:Number(row.chapter_num),language:p.language||'en',publishDate:timestamp(row.updated_at)})).sort((a,b)=>b.chapterNumber-a.chapterNumber);
  }
  if(action==='pages'){
   const html=await read(new URL(decodePathId(p,params.id,':'),p.website).href),files=literalArray(html,'chapterImages');
   if(!files.length)return parseMadaraPages(html,p,params.id);
   const cdns=literalArray(html,'cdns');if(!cdns.length)throw sourceError('Public source image origin unavailable');const base=new URL(cdns[0]);if(base.protocol!=='https:'||base.username||base.password)throw sourceError('Invalid public source image origin');
   const pages=files.map((file,index)=>{if(file.includes('..')||/[\x00-\x1f\\]/.test(file)||/^https?:|^\/\//i.test(file))throw sourceError('Invalid public source image path');return {index,url:new URL('/'+file.replace(/^\/+/,''),base).href};});
   return {chapterId:params.id,pages,credits:[{name:p.name,url:p.website}]};
  }
  throw sourceError('Unsupported source operation',400);
 }};
}
