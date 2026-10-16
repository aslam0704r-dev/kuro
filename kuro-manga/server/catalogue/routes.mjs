import { timingSafeEqual, createHash, randomBytes } from 'node:crypto';
import { clientAddress, send } from '../managed/http.mjs';
import { origin as accountOrigin } from '../managed/config.mjs';
import { createMemoryCoordinator, createRedisCoordinator } from './cache.mjs';
import { createCatalogueService } from './service.mjs';
import { sourceError } from './transport.mjs';
import {readFile} from 'node:fs/promises';

function validSecret(actual,expected){return !!expected&&timingSafeEqual(createHash('sha256').update(actual).digest(),createHash('sha256').update('Bearer '+expected).digest());}
async function bodyOf(req){
 let raw;if(req.body!==undefined)raw=Buffer.isBuffer(req.body)?req.body:Buffer.from(typeof req.body==='string'?req.body:JSON.stringify(req.body));
 else{const chunks=[];let size=0;for await(const value of req){const chunk=Buffer.isBuffer(value)?value:Buffer.from(value);size+=chunk.length;if(size>256*1024)throw sourceError('Manifest request too large',413);chunks.push(chunk);}raw=Buffer.concat(chunks);}
 if(raw.length>256*1024)throw sourceError('Manifest request too large',413);let body;try{body=JSON.parse(raw.toString());}catch{throw sourceError('Invalid manifest JSON',400);}
 if(!body||typeof body!=='object'||Array.isArray(body))throw sourceError('Invalid manifest JSON',400);return body;
}
export function createCatalogueRoutes(service,{origin=accountOrigin,cronSecret=process.env.CRON_SECRET||''}={}){
 return async function catalogueRoute(req,res,url){
  if(!url.pathname.startsWith('/api/catalogue/'))return false;
  try{
   if(url.pathname==='/api/catalogue/refresh'){
    if(req.method!=='GET')throw sourceError('Method not allowed',405);
    if(!validSecret(String(req.headers.authorization||''),cronSecret))throw sourceError('Refresh authorization required',401);
    send(res,200,{result:await service.refresh()});return true;
   }
   const pageRequest=url.pathname==='/api/catalogue/page',coverRequest=url.pathname==='/api/catalogue/cover';
   if(!await service.budget(clientAddress(req),pageRequest||coverRequest?'image':'catalogue'))throw sourceError('Too many requests. Retry shortly.',429,60);
   if(url.pathname==='/api/catalogue/content/check'){
    if(req.method!=='GET')throw sourceError('Method not allowed',405);
    if([...url.searchParams.keys()].some(k=>!['provider','id','chapter'].includes(k)))throw sourceError('Send only manga and chapter identity',400);
    send(res,200,await service.contentCheck(url.searchParams.get('provider'),url.searchParams.get('id'),url.searchParams.get('chapter')||undefined));return true;
   }
   if(url.pathname==='/api/catalogue/readable/count'){
    if(req.method!=='GET')throw sourceError('Method not allowed',405);if(url.search)throw sourceError('Count accepts no parameters',400);send(res,200,await service.readableSummary());return true;
   }
   if(url.pathname==='/api/catalogue/readable/check'){
    if(req.method!=='GET')throw sourceError('Method not allowed',405);
    if([...url.searchParams.keys()].some(k=>!['provider','id'].includes(k)))throw sourceError('Send only manga identity',400);
    send(res,200,await service.readableCheck(url.searchParams.get('provider'),url.searchParams.get('id')));return true;
   }
   if(url.pathname==='/api/catalogue/readable/qualify'){
    if(req.method!=='GET')throw sourceError('Method not allowed',405);
    if([...url.searchParams.keys()].some(k=>!['provider','id'].includes(k)))throw sourceError('Send only manga identity',400);
    send(res,200,await service.qualify(url.searchParams.get('provider'),url.searchParams.get('id'),origin(req)));return true;
   }
   if(url.pathname==='/api/catalogue/providers'){
    if(req.method!=='GET')throw sourceError('Method not allowed',405);send(res,200,await service.directory());return true;
   }
   if(url.pathname==='/api/catalogue/mangadex'){
    if(req.method!=='GET')throw sourceError('Method not allowed',405);send(res,200,await service.mangaDexMetadata(url.searchParams.get('path')||''));return true;
   }
   if(url.pathname==='/api/catalogue/manifest'){
    if(req.method!=='POST')throw sourceError('Method not allowed',405);
    if(req.headers.origin!==origin(req)||req.headers['sec-fetch-site']==='cross-site')throw sourceError('Origin not allowed',403);
    if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw sourceError('Send JSON',415);
    const body=await bodyOf(req);
    if(Object.keys(body).some(key=>!['provider','chapterId'].includes(key))||typeof body.provider!=='string'||typeof body.chapterId!=='string')throw sourceError('Send only provider and chapter identity',400);
    send(res,200,{result:await service.prepare(body.provider,{chapterId:body.chapterId},origin(req))});return true;
   }
   if(pageRequest||coverRequest){
    if(!['GET','HEAD'].includes(req.method))throw sourceError('Method not allowed',405);
    if(coverRequest&&[...url.searchParams.keys()].some(k=>!['provider','id'].includes(k)))throw sourceError('Cover URLs are derived from approved manga identity',400);
    const data=coverRequest?await service.cover(url.searchParams.get('provider'),url.searchParams.get('id')):await service.servePage(url.searchParams.get('ticket'));
    res.writeHead(200,{'Content-Type':data.mime,'Content-Length':data.body.length,'Cache-Control':'private, no-store',
     'Content-Security-Policy':"sandbox; default-src 'none'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});
    res.end(req.method==='HEAD'?undefined:data.body);return true;
   }
   const match=/^\/api\/catalogue\/provider\/([a-z0-9]{1,40})\/(search|popular|latest|details|chapters|pages)$/.exec(url.pathname);
   if(!match)throw sourceError('Catalogue route not found',404);if(req.method!=='GET')throw sourceError('Method not allowed',405);
   const q=url.searchParams.get('q')||'',id=url.searchParams.get('id')||'',page=Number(url.searchParams.get('page')||1);let filters={};
   if(q.length>120||id.length>1400||!Number.isSafeInteger(page)||page<1||page>100)throw sourceError('Invalid catalogue parameters',400);
   const rawFilters=url.searchParams.get('filters');if(rawFilters){if(rawFilters.length>2000)throw sourceError('Invalid source filters',400);try{filters=JSON.parse(rawFilters);}catch{throw sourceError('Invalid source filters',400);}if(!filters||typeof filters!=='object'||Array.isArray(filters))throw sourceError('Invalid source filters',400);}
   const result=await service.call(match[1],match[2],{q,id,page,filters},origin(req));send(res,200,{result:result.value,checkedAt:result.checkedAt,stale:result.stale});return true;
  }catch(error){const status=Number.isInteger(error.status)?error.status:502;if(error.retryAfter)res.setHeader('Retry-After',String(error.retryAfter));send(res,status,{error:error.status?error.message:'Source service temporarily unavailable. Retry later.'});return true;}
 };
}
let routes;
export async function catalogueRoute(req,res,url){
 if(!url.pathname.startsWith('/api/catalogue/'))return false;
 if(!routes){
  const production=process.env.NODE_ENV==='production'||process.env.VERCEL==='1',redisUrl=process.env.UPSTASH_REDIS_REST_URL||'',token=process.env.UPSTASH_REDIS_REST_TOKEN||'';
  let coordinator;
  if(redisUrl&&token){const parsed=new URL(redisUrl);const localFixture=!production&&process.env.AUTH_TEST_MODE==='1'&&parsed.protocol==='http:'&&parsed.hostname==='127.0.0.1';
   if((!localFixture&&(parsed.protocol!=='https:'||!/^[a-z0-9-]+\.upstash\.io$/.test(parsed.hostname)))||parsed.username||parsed.password||parsed.search||parsed.hash||parsed.pathname!=='/')throw sourceError('Catalogue coordination configuration is invalid',503);
   coordinator=createRedisCoordinator(redisUrl,token);
  }else if(production){send(res,503,{error:'Configure the existing server Redis connection for catalogue limits and cache.'});return true;}
  else coordinator=createMemoryCoordinator();
  const encoded=process.env.AUTH_ENCRYPTION_KEY||'';let key=encoded?Buffer.from(encoded,'base64'):production?null:randomBytes(32);
  if(key&&(key.length!==32||encoded&&key.toString('base64')!==encoded))key=null;
  const seed=JSON.parse(await readFile(new URL('../../data/readable-audit.json',import.meta.url),'utf8'));
  routes=createCatalogueRoutes(createCatalogueService({coordinator,ticketKey:key,usage:process.env.CATALOG_USAGE||'',excludedGroups:(process.env.MANGADEX_EXCLUDED_GROUPS||'').split(',').map(x=>x.trim()).filter(Boolean),seedInventory:seed.inventory||[],auditCoverage:seed.summary||null}));
 }
 return routes(req,res,url);
}
