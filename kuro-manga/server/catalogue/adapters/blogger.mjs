import {htmlDocument,unknownManga,strip,httpsURL,pageNumber,timestamp,applyPageFilters} from './common.mjs';import {sourceError} from '../transport.mjs';
export function createBloggerAdapter(p,read){
 const category=p.seriesLabel||'Series',chapterCategory=p.chapterLabel||'Chapter';
 function path(value){let url;try{url=new URL(value,p.website);}catch{throw sourceError('Invalid source identity',400);}if(url.protocol==='http:'&&url.hostname===new URL(p.website).hostname)url.protocol='https:';
  if(url.origin!==new URL(p.website).origin||url.search||url.hash||!/^\/(?:19|20)\d{2}\/(?:0[1-9]|1[0-2])\/[^/]+\.html$/.test(url.pathname)||/[\\\x00-\x20]/.test(decodeURIComponent(url.pathname)))throw sourceError('Invalid source identity',400);return url.pathname;}
 const encode=(url,separator)=>p.id+separator+Buffer.from(path(url)).toString('base64url');
 function decode(id,separator){if(typeof id!=='string'||!id.startsWith(p.id+separator))throw sourceError('Invalid source identity',400);const raw=id.slice(p.id.length+1);if(!/^[a-zA-Z0-9_-]{1,1000}$/.test(raw))throw sourceError('Invalid source identity',400);const decoded=Buffer.from(raw,'base64url').toString();if(Buffer.from(decoded).toString('base64url')!==raw)throw sourceError('Invalid source identity',400);return path(decoded);}
 const feed=(labels)=>new URL('/feeds/posts/default/-/'+labels.map(encodeURIComponent).join('/'),p.website);
 const request=async url=>{url.searchParams.set('alt','json');return read(url.href,{json:true});};
 const entries=data=>{if(!data?.feed||data.feed.entry&&!Array.isArray(data.feed.entry))throw sourceError('Public source feed unavailable');return data.feed.entry||[];};
 const alternate=row=>row.link?.find(link=>link.rel==='alternate')?.href;
 const inCategory=(row,label)=>row.category?.some(value=>value.term===label);
 return {async call(action,params={}){
  if(['search','latest','popular'].includes(action)){
   if(action==='popular')return {items:[],notice:'This source provides search and latest releases.'};const page=pageNumber(params.page),url=feed([category]);url.searchParams.set('start-index',(page-1)*24+1);url.searchParams.set('max-results',24);url.searchParams.set('orderby','updated');if(params.q)url.searchParams.set('q',params.q);
   const data=await request(url),items=[];
   for(const row of entries(data)){if(!inCategory(row,category)||row.category?.some(x=>/^(Novel|Novela|Anime)$/i.test(x.term)))continue;let id;try{id=encode(alternate(row),'-');}catch{continue;}
    const $=htmlDocument('<div>'+String(row.content?.$t||'')+'</div>');items.push({...unknownManga(p,id,row.title?.$t),coverUrl:httpsURL(row['media$thumbnail']?.url||$('img').first().attr('src'),p.website)});}
   return applyPageFilters({items,...Number(data.feed['openSearch$totalResults']?.$t)>page*24?{nextPage:page+1}:{}},params.filters);
  }
  if(action==='details'||action==='chapters'){
   const html=await read(new URL(decode(params.id,'-'),p.website).href),$=htmlDocument(html);const title=$('h1.post-title,h1.entry-title,h2.post-title,.post-title.entry-title').first().text().trim()||$('meta[property="og:title"]').attr('content');
   if(action==='details'){if(!title)throw sourceError('Public title details unavailable');return {...unknownManga(p,params.id,title),description:$('#synopsis,.post-body .synopsis').first().text().trim().slice(0,16000),coverUrl:httpsURL($('.grid.gtc-235fr img,.post-body img').first().attr('src')||$('meta[property="og:image"]').attr('content'),p.website)};}
   const script=$('#clwd > script').text()||$('#latest > script').text();const label=/clwd\.run\(\s*["']([^"']{1,250})["']\s*\)/.exec(script)?.[1]||/\blabel\s*=\s*["']([^"']{1,250})["']/.exec(script)?.[1];
   let url;if(label)url=feed(script.includes('clwd.run')?[chapterCategory,...label.split('/')]:[label]);
   else{const old=$('#myUL > script').attr('src');if(!old)throw sourceError('Public chapter feed unavailable');url=new URL(old,p.website);if(url.origin!==new URL(p.website).origin||!url.pathname.startsWith('/feeds/posts/default/'))throw sourceError('Invalid public chapter feed');}
   const all=[],seen=new Set();let start=1,total;
   for(let count=0;count<10;count++){url.searchParams.set('start-index',start);url.searchParams.set('max-results','500');const data=await request(url),batch=entries(data);total=Number(data.feed['openSearch$totalResults']?.$t)||batch.length;
    for(const row of batch){const link=alternate(row);if(link&&!seen.has(link)){seen.add(link);all.push(row);}}
    if(start-1+batch.length>=total)break;if(!batch.length)throw sourceError('Complete chapter feed unavailable');start+=batch.length;
   }
   if(all.length<total)throw sourceError('Complete chapter feed exceeds source limits');
   const result=[];for(const row of all){if(!inCategory(row,chapterCategory))continue;let id;try{id=encode(alternate(row),':');}catch{continue;}
    const title=strip(row.title?.$t),match=/(?:chapter|ch\.?|cap(?:ítulo|itulo)?\.?|bölüm|الفصل)\s*(\d+(?:[.,]\d+)?)/i.exec(title);
    result.push({id,mangaId:params.id,sourceId:p.id,title,chapterNumber:match?Number(match[1].replace(',','.')):0,publishDate:timestamp(row.published?.$t||row.updated?.$t),language:p.language||'en'});}
   return result.sort((a,b)=>b.chapterNumber-a.chapterNumber||b.publishDate-a.publishDate);
  }
  if(action==='pages'){
   const $=htmlDocument(await read(new URL(decode(params.id,':'),p.website).href));const nodes=$(p.selectors?.pages||'div.check-box div.separator img,#readerarea img,.reader-area img');const pages=[];
   nodes.each((_,e)=>{const image=$(e),url=httpsURL(image.attr('data-src')||image.attr('src'),p.website);if(!url)throw sourceError('Invalid source page URL');pages.push({index:pages.length,url});});
   if(!pages.length)throw sourceError('No public reading manifest');return {chapterId:params.id,pages,credits:[{name:p.name,url:p.website}]};
  }
  throw sourceError('Unsupported source operation',400);
 }};
}
