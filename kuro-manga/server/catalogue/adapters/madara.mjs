import { htmlDocument, httpsURL, unknownManga, statusOf, timestamp, pageNumber } from './common.mjs';
import { sourceError } from '../transport.mjs';

const seriesPath=p=>p.seriesPath||'/manga/';
function ownedPath(provider,value,chapter=false){
 let url;try{url=new URL(value,provider.website);}catch{throw sourceError('Invalid source path',400);}
 const base=new URL(provider.website);const decoded=decodeURIComponent(url.pathname);
 const allowed=url.pathname.startsWith(seriesPath(provider))||chapter&&provider.chapterPattern&&new RegExp(provider.chapterPattern).test(url.pathname);
 if(url.origin!==base.origin||url.search||url.hash||!allowed||/[\\\x00-\x20]/.test(decoded)||decoded.split('/').includes('..'))throw sourceError('Invalid source path',400);
 return url.pathname;
}
export function encodePathId(provider,url,separator){return provider.id+separator+Buffer.from(ownedPath(provider,url,separator===':')).toString('base64url');}
export function decodePathId(provider,id,separator){
 if(typeof id!=='string'||!id.startsWith(provider.id+separator))throw sourceError('Invalid source identity',400);
 const encoded=id.slice(provider.id.length+1);if(!/^[a-zA-Z0-9_-]{1,900}$/.test(encoded))throw sourceError('Invalid source identity',400);
 const decoded=Buffer.from(encoded,'base64url').toString('utf8');if(Buffer.from(decoded).toString('base64url')!==encoded)throw sourceError('Invalid source identity',400);
 return ownedPath(provider,new URL(decoded,provider.website),separator===':');
}
function validSeries(provider,href){try{const path=ownedPath(provider,href);const rest=path.slice(seriesPath(provider).length).replace(/\/$/,'');return !!rest&&!rest.includes('/')&&!['page','feed','genres'].includes(rest);}catch{return false;}}
export function parseMadaraCatalogue(html,provider,page=1){
 const $=htmlDocument(html),items=new Map();
 $('aside,footer,nav,header,.sidebar,#sidebar,.widget,.serieslist.pop,.related-manga,.recommended-manga').remove();
 const containers=$('.listupd,.listo,.c-search-content,.c-search-results,.c-tabs-item__content,.search-no-results');
 $(provider.selectors?.catalogue||'.page-item-detail,.c-tabs-item__content,.manga-item,.bs').each((_,element)=>{
  const card=$(element);let anchor;
  for(const selector of ['.post-title h3 a,.post-title h4 a,.post-title h5 a','h3 a,h4 a,h5 a','.post-title a','a[href]']){anchor=card.find(selector).filter((_,a)=>validSeries(provider,$(a).attr('href'))).first();if(anchor.length)break;}
  if(!anchor.length)return;const id=encodePathId(provider,anchor.attr('href'),'-');const title=anchor.attr('title')||anchor.find('.tt').text().trim()||anchor.text().trim();if(!title)return;
  const image=card.find('img').first();const row={...unknownManga(provider,id,title),coverUrl:httpsURL(image.attr('data-src')||image.attr('data-lazy-src')||image.attr('src'),provider.website)};
  const chapter=card.find('.chapter a,.chapter-item a,.list-chapter a').first().text().trim();if(chapter)row.latestChapter=chapter;
  items.set(id,row);
 });
 // Some Madara deployments use a different card wrapper, but retain the series anchor.
 if(!items.size)(containers.length?containers.find(`a[href*="${seriesPath(provider)}"]`):$(`a[href*="${seriesPath(provider)}"]`)).each((_,a)=>{const anchor=$(a);if(!validSeries(provider,anchor.attr('href')))return;const title=anchor.attr('title')||anchor.find('img').attr('alt')||anchor.text().trim();if(!title||/^read|chapter|more$/i.test(title))return;const id=encodePathId(provider,anchor.attr('href'),'-');if(!items.has(id))items.set(id,unknownManga(provider,id,title));});
 if(!items.size&&!containers.length&&!/no results|nothing found|no manga found|no posts found|لم يتم العثور/i.test($.text()))throw sourceError('Source catalogue layout is unsupported');
 const result={items:[...items.values()].slice(0,48)};
 const next=$(provider.selectors?.next||'a.next.page-numbers,.nav-previous a,.pagination .next a,.pagination a.next,.hpage a.r,link[rel="next"]').first();
 if(next.length&&items.size)result.nextPage=page+1;return result;
}
export function parseMadaraDetails(html,provider,id){
 const $=htmlDocument(html);const title=$(provider.selectors?.title||'.post-title h1,h1.post-title,.post-title h3,.manga-title,h1.entry-title,.infox h1,h1').first().text().trim();
 if(!title)throw sourceError('Source details are unavailable');
 const image=$('.summary_image img,.manga-thumb img,.thumb img').first();
 const row={...unknownManga(provider,id,title),description:$(provider.selectors?.description||'.description-summary,.summary__content,.manga-description,.entry-content').first().text().trim().slice(0,16000),
  coverUrl:httpsURL(image.attr('data-src')||image.attr('data-lazy-src')||image.attr('src')||$('meta[property="og:image"]').attr('content'),provider.website),
  genres:[...new Set($('.genres-content a,.mgen a').map((_,a)=>$(a).text().trim()).get())].slice(0,30)};
 const author=$('.author-content,.artist-content').first().text().trim();if(author&&!/^updating|unknown|n\/a$/i.test(author))row.author=author;
 $('.post-content_item').each((_,e)=>{const key=$(e).find('.summary-heading').text();const value=$(e).find('.summary-content').text().trim();if(/status/i.test(key))row.status=statusOf(value);if(/alternative/i.test(key))row.altTitles=value.split(/;|\n/).map(x=>x.trim()).filter(Boolean).slice(0,20);});
 return row;
}
export function parseMadaraChapters(html,provider,mangaId){
 const $=htmlDocument(html),series=decodePathId(provider,mangaId,'-'),rows=new Map();
 $(provider.selectors?.chapters||'.wp-manga-chapter a,.chapter-list a,.eplister a,#chapterlist a,.bxcl a,.cl a').each((_,a)=>{
  const anchor=$(a),href=anchor.attr('href');if(!href||href==='#'||anchor.closest('.locked,.premium,.paid,[data-premium="true"]').length||anchor.closest('li').find('.fa-lock,.locked,.chapter-lock').length)return;
  let pathname;try{pathname=ownedPath(provider,href,true);}catch{return;}
  const modern=provider.chapterPattern&&new RegExp(provider.chapterPattern).test(pathname);if(pathname===series||!modern&&!pathname.startsWith(series.replace(/\/$/,'')+'/'))return;
  const title=anchor.text().trim();const match=title.match(/(?:chapter|ch\.?|bölüm|الفصل|episode)\s*([0-9]+(?:[.,][0-9]+)?)/i)||title.match(/^([0-9]+(?:[.,][0-9]+)?)(?:\s|$)/)||pathname.replace(/\/$/,'').split('/').at(-1).match(/(?:chapter-|ch-|^)(\d+(?:[._-]\d+)?)$/i);
  const number=match?Number(match[1].replace(/[,_-]/g,'.')):0;
  if(!Number.isFinite(number))return;const id=encodePathId(provider,new URL(pathname,provider.website),':');
  const container=anchor.closest('li');const date=container.find('time').attr('datetime')||container.find('[data-datetime]').attr('data-datetime');
  rows.set(id,{id,mangaId,sourceId:provider.id,title,chapterNumber:number,publishDate:timestamp(date),language:provider.language||'en'});
 });return [...rows.values()].sort((a,b)=>b.chapterNumber-a.chapterNumber||b.publishDate-a.publishDate);
}
export function parseMadaraPages(html,provider,chapterId){
 const $=htmlDocument(html);const pages=[];
 const literal=/ts_reader\.run\((\{[\s\S]*?\})\)\s*;/.exec(html);
 if(literal){let data;try{data=JSON.parse(literal[1]);}catch{throw sourceError('Invalid public reader manifest');}
  const images=data.sources?.find(x=>Array.isArray(x.images)&&x.images.length)?.images;if(!images||images.length>500)throw sourceError('No public chapter image manifest');
  for(const raw of images){const url=httpsURL(raw,provider.website);if(!url)throw sourceError('Invalid chapter page URL',422);pages.push({index:pages.length,url});}
 }else{const specific=$('.reading-content img.wp-manga-chapter-img');const nodes=provider.selectors?.pages?$(provider.selectors.pages):specific.length?specific:$('.reading-content img,.reader-area img,.read-container img,#readerarea img');
  nodes.each((_,image)=>{const e=$(image);const url=httpsURL(e.attr('data-src')||e.attr('data-lazy-src')||e.attr('src'),provider.website);if(!url)throw sourceError('Invalid chapter page URL',422);
   // Explicitly identified 32px reader refresh control, never a comic page.
   if(provider.id==='tritiniascans'&&new URL(url).pathname==='/wp-content/plugins/from-grave-and-back-hidden/images/refresh.png')return;
   pages.push({index:pages.length,url});});}
 if(!pages.length)throw sourceError('No public chapter image manifest');return {chapterId,pages,credits:[{name:provider.name,url:provider.website}]};
}
export function createMadaraAdapter(provider,read){return {async call(action,params={}){
 if(['search','popular','latest'].includes(action)){
  const page=pageNumber(params.page);if(params.filters?.genres?.length||params.filters?.status?.length||params.filters?.kind&&params.filters.kind!=='ALL')return {items:[],notice:'Use All kinds and clear status/genres for this provider; these catalogue filters are unsupported.'};
  const base=new URL(provider.website);const url=new URL(params.q?'/':seriesPath(provider)+(page>1?'page/'+page+'/':''),base);
  if(params.q){url.searchParams.set('s',params.q);url.searchParams.set('post_type','wp-manga');if(page>1)url.searchParams.set('paged',page);}
  url.searchParams.set('m_orderby',action==='latest'||params.filters?.sort==='LATEST'?'latest':action==='popular'||params.filters?.sort==='POPULAR'?'views':'relevance');
  return parseMadaraCatalogue(await read(url.href),provider,page);
 }
 if(action==='details')return parseMadaraDetails(await read(new URL(decodePathId(provider,params.id,'-'),provider.website).href),provider,params.id);
 if(action==='chapters'){
  const pathname=decodePathId(provider,params.id,'-'),url=new URL(pathname,provider.website);const html=await read(url.href);
  let rows=parseMadaraChapters(html,provider,params.id);if(!rows.length){const ajax=new URL(pathname.replace(/\/$/,'')+'/ajax/chapters/',provider.website);rows=parseMadaraChapters(await read(ajax.href,{method:'POST',body:''}),provider,params.id);}
  if(!rows.length)throw sourceError('No public chapter list is available');return rows;
 }
 if(action==='pages'){const url=new URL(decodePathId(provider,params.id,':'),provider.website);url.searchParams.set('style','list');return parseMadaraPages(await read(url.href),provider,params.id);}
 throw sourceError('Unsupported provider operation',400);
}};}
