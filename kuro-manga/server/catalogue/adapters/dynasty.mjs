import { htmlDocument, unknownManga, strip, timestamp, pageNumber, httpsURL } from './common.mjs';
import { sourceError } from '../transport.mjs';
const BASE='https://dynasty-scans.com/';
const slug=value=>/^[a-z0-9_-]{1,250}$/.test(value||'')&&!value.includes('..');
const ignored=new Set(['added','recently_added','popular','recently_released']);
export function parseDynastyCatalogue(html,provider,page=1){
 const $=htmlDocument(html),rows=new Map();
 $('a[href^="/series/"],a[href^="/chapters/"]').each((_,a)=>{const e=$(a);const match=/^\/(series|chapters)\/([a-z0-9_-]+)$/.exec(e.attr('href')||'');if(!match||!slug(match[2])||ignored.has(match[2]))return;
  const title=e.text().trim();if(!title)return;const id='dynasty-'+(match[1]==='series'?'s':'c')+'~'+match[2];if(!rows.has(id))rows.set(id,unknownManga(provider,id,title));});
 const result={items:[...rows.values()].slice(0,48)};if($('.next a,a[rel="next"]').length&&rows.size)result.nextPage=page+1;
 if(!rows.size&&!/no results|nothing found/i.test($.text()))throw sourceError('Dynasty catalogue layout is unsupported');return result;
}
export function parseDynastyPages(html,chapterId){
 const match=/(?:var|let|const)\s+pages\s*=\s*(\[[\s\S]*?\]);/.exec(html);if(!match)throw sourceError('No public Dynasty image manifest');
 let data;try{data=JSON.parse(match[1]);}catch{throw sourceError('Invalid Dynasty image manifest');}
 if(!Array.isArray(data)||!data.length||data.length>500)throw sourceError('Invalid Dynasty image manifest');
 const pages=data.map((page,index)=>({index,url:httpsURL(page.image||page.url,BASE),width:Number(page.width)||undefined,height:Number(page.height)||undefined}));
 if(pages.some(x=>!x.url))throw sourceError('Invalid Dynasty image manifest');return {chapterId,pages,credits:[{name:'Dynasty Reader and credited scanlators',url:BASE+'chapters/'+chapterId.slice(8)}]};
}
function decode(id){const m=/^dynasty-([sc])~([a-z0-9_-]{1,250})$/.exec(id||'');if(!m||!slug(m[2]))throw sourceError('Invalid Dynasty identity',400);return {kind:m[1],slug:m[2],url:BASE+(m[1]==='s'?'series/':'chapters/')+m[2]};}
export function createDynastyAdapter(provider,read){return {async call(action,params={}){
 if(['search','latest','popular'].includes(action)){const url=new URL(params.q?'/search':'/chapters/added',BASE);url.searchParams.set('page',pageNumber(params.page));if(params.q)url.searchParams.set('q',params.q);return parseDynastyCatalogue(await read(url.href),provider,pageNumber(params.page));}
 if(action==='details'){const data=decode(params.id),html=await read(data.url),$=htmlDocument(html);const title=$('#chapter-title,h2,h1,.tag-title').first().text().trim();if(!title)throw sourceError('Dynasty details unavailable');
  return {...unknownManga(provider,params.id,title),description:$('.description').first().text().trim().slice(0,16000),author:$('a[href^="/authors/"]').first().text().trim()||undefined,coverUrl:httpsURL($('.cover img').attr('src'),BASE)};
 }
 if(action==='chapters'){const data=decode(params.id),html=await read(data.url),$=htmlDocument(html),rows=new Map();
  if(data.kind==='c')rows.set(data.slug,{id:'dynasty:'+data.slug,mangaId:params.id,sourceId:'dynasty',title:$('#chapter-title,h2,h1').first().text().trim(),chapterNumber:0,publishDate:0,language:'en'});
  else $('a[href^="/chapters/"]').each((_,a)=>{const e=$(a),m=/^\/chapters\/([a-z0-9_-]+)$/.exec(e.attr('href')||'');if(!m||ignored.has(m[1]))return;const title=e.text().trim(),number=/\bch\.?\s*(\d+(?:\.\d+)?)/i.exec(title)||/\bch(\d+(?:_\d+)?)/i.exec(m[1]);
   rows.set(m[1],{id:'dynasty:'+m[1],mangaId:params.id,sourceId:'dynasty',title:strip(title),chapterNumber:number?Number(number[1].replace('_','.')):0,publishDate:timestamp(e.closest('tr,li').find('time').attr('datetime')),language:'en'});});
  if(!rows.size)throw sourceError('Dynasty chapter list unavailable');return [...rows.values()].sort((a,b)=>b.chapterNumber-a.chapterNumber||b.publishDate-a.publishDate);
 }
 if(action==='pages'){const value=String(params.id||'').slice(8);if(!String(params.id).startsWith('dynasty:')||!slug(value))throw sourceError('Invalid Dynasty chapter',400);return parseDynastyPages(await read(BASE+'chapters/'+value),params.id);}
 throw sourceError('Unsupported provider operation',400);
}};}
