import { load } from 'cheerio';
import { sourceError } from '../transport.mjs';
import { httpsURL } from './common.mjs';

export function legacyChapterURL(provider,id){
 let match;
 if(provider==='mangaread'&&(match=/^mangaread:([a-z0-9_-]{1,300})~([a-z0-9_-]{1,200})$/.exec(id)))return 'https://www.mangaread.org/manga/'+match[1]+'/'+match[2]+'/?style=list';
 if(provider==='mgeko'&&(match=/^mgeko:([a-z0-9-]{1,500})$/.exec(id)))return 'https://www.mgeko.cc/reader/en/'+match[1]+'/';
 if(provider==='weebcentral'&&(match=/^weebcentral:([0-9A-Z]{26})$/.exec(id)))return 'https://weebcentral.com/chapters/'+match[1]+'/images?is_prev=False&current_page=1&reading_style=long_strip';
 if(provider==='mangakatana'&&(match=/^mangakatana:([a-z0-9-]{1,300})~(\d{1,12})~(c\d+(?:_\d+)?)$/.exec(id)))return 'https://mangakatana.com/manga/'+match[1]+'.'+match[2]+'/'+match[3].replace('_','.');
 if(provider==='mangapill'&&(match=/^mangapill:(\d+-\d+)~([a-z0-9-]{1,300})$/.exec(id)))return 'https://mangapill.com/chapters/'+match[1]+'/'+match[2];
 if(provider==='mangadex'&&(match=/^mangadex:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.exec(id)))return 'https://api.mangadex.org/at-home/server/'+match[1]+'?forcePort443=true';
 throw sourceError('Invalid provider chapter identity',400);
}
export function parseLegacyPages(provider,id,html){
 const $=load(html);let urls=[];
 if(provider==='mangakatana'){
  const list=/var\s+thzq\s*=\s*\[([\s\S]*?)\]\s*;/.exec(html)?.[1];if(!list)throw sourceError('No public MangaKatana image manifest');
  const parts=[...list.matchAll(/['"]([^'"\s]+)['"]/g)].map(x=>x[1]);if(parts.some(x=>!/^https:\/\/i\d+\.mangakatana\.com\//.test(x)))throw sourceError('Invalid MangaKatana page URL',422);urls=parts;
 }else{
  const selector=provider==='mangaread'?'.reading-content img':provider==='mgeko'?'#chapter-reader img[id^="image-"]':provider==='mangapill'?'img.js-page':provider==='weebcentral'?'img':null;
  if(!selector)throw sourceError('Unsupported legacy page parser',400);
  $(selector).each((_,e)=>{const raw=$(e).attr('data-src')||$(e).attr('src');const url=httpsURL(raw,legacyChapterURL(provider,id));if(!url||/broken_image|placeholder|loading\.gif/i.test(url))throw sourceError('Source returned an invalid or placeholder reading page',422);urls.push(url);});
 }
 if(!urls.length)throw sourceError('No public chapter pages. The source may have removed or restricted this chapter.');
 return {chapterId:id,pages:urls.map((url,index)=>({index,url}))};
}
export function createLegacyPageAdapter(provider,read){return {async call(action,params){
 if(action!=='pages')throw sourceError('This legacy catalogue uses its existing KURO browser adapter',409);
 const url=legacyChapterURL(provider.id,params.id);
 if(provider.id!=='mangadex')return {...parseLegacyPages(provider.id,params.id,await read(url)),credits:[{name:provider.name,url:provider.website}]};
 const reply=await read(url,{json:true});if(reply.result!=='ok'||!reply.chapter?.hash||!Array.isArray(reply.chapter.data))throw sourceError('MangaDex reading access is unavailable');
 const base=new URL(reply.baseUrl);if(base.protocol!=='https:'||base.username||base.password||(base.port&&base.port!=='443')||base.pathname!=='/'||base.search||base.hash)throw sourceError('Invalid MangaDex image server');
 if(!/^[a-zA-Z0-9_-]{1,200}$/.test(reply.chapter.hash))throw sourceError('Invalid MangaDex image hash');
 const pages=[];for(const [path,files]of [['data',reply.chapter.data],['data-saver',reply.chapter.dataSaver||[]]]){
  if(!Array.isArray(files)||files.length>500||files.some(file=>typeof file!=='string'||!/^[a-zA-Z0-9_.-]+$/.test(file)||file.includes('..')))throw sourceError('Invalid MangaDex image filenames');
  if(path==='data')files.forEach(file=>pages.push({index:pages.length,url:new URL(path+'/'+reply.chapter.hash+'/'+file,base).href}));
 }
 if(!pages.length)throw sourceError('MangaDex chapter has no public pages');
 return {chapterId:params.id,pages,allowedImageHosts:[base.hostname]};
}};}
