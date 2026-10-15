import { createHash } from 'node:crypto';
import { createCatalogueCache } from './cache.mjs';
import { fetchPublic, sourceError } from './transport.mjs';
import { sanitizeManifest, deliveryImage, imageSignatureType,restoreTiles } from './images.mjs';
import { createTickets } from './tickets.mjs';
import { registry, installedProviders, providerFor, textPolicy, imagePolicy, licensingAllowed } from './policy.mjs';
import { createMadaraAdapter } from './adapters/madara.mjs';
import { createGuyaAdapter } from './adapters/guya.mjs';
import { createDynastyAdapter } from './adapters/dynasty.mjs';
import { createMetadataAdapter } from './adapters/metadata.mjs';
import { createLegacyPageAdapter } from './adapters/legacy.mjs';
import {createFamilyAdapter} from './adapters/families.mjs';
import {createFlameAdapter} from './adapters/flame.mjs';
import {createAsuraAdapter} from './adapters/asura.mjs';
import {createIkenAdapter} from './adapters/iken.mjs';
import {createBloggerAdapter} from './adapters/blogger.mjs';
import {createMangaBoxAdapter} from './adapters/mangabox.mjs';
import { canonicalParameters } from './parameters.mjs';
import {withCatalogueDeadline,catalogueSignal,catalogueCleanup} from './deadline.mjs';
import {CONTENT_POLICY_VERSION,RATING_TTL_MS,classifyMangaDex,providerContentPolicy,forbiddenText,blockedIdentity} from '../../client/content-policy.mjs';
import {createContentService,requireContentProvider} from './content.mjs';
import {createReadableLedger,createChapterValidator} from './readable.mjs';

const digest=value=>createHash('sha256').update(value).digest('hex');
const upstreamLimits={anilist:25,jikan:50,shikimori:60,mangabaka:25,guya:60,mangadex:240};
export function createCatalogueService({coordinator,ticketKey,usage='',fetcher=fetchPublic,clock=Date.now,excludedGroups=[],seedInventory=[],auditCoverage=null,pageDeadlineMs=20000,validation}){
 const cache=createCatalogueCache(coordinator,clock),tickets=ticketKey?createTickets(ticketKey):null;
 const adapters=new Map(),images=new Map(),upstreamQueues=new Map();let imageBytes=0,activeImages=0;const pending=[];
 async function pace(id){
  const queue=upstreamQueues.get(id)||{tail:Promise.resolve(),last:0,count:0};upstreamQueues.set(id,queue);
  if(queue.count>=8)throw sourceError('Source is busy. Retry shortly.',503);queue.count++;
  const gap=['asurascans','flamecomics'].includes(id)?1100:id==='mangadex'?280:550;
  const task=queue.tail.catch(()=>{}).then(async()=>{const signal=catalogueSignal();if(signal?.aborted)throw sourceError('Catalogue refresh deadline reached',503);
   const delay=queue.last+gap-Date.now();if(delay>0)await new Promise((resolve,reject)=>{const finish=()=>{signal?.removeEventListener('abort',abort);resolve();},timer=setTimeout(finish,delay),abort=()=>{clearTimeout(timer);reject(sourceError('Catalogue refresh deadline reached',503));};signal?.addEventListener('abort',abort,{once:true});});
   if(signal?.aborted)throw sourceError('Catalogue refresh deadline reached',503);queue.last=Date.now();});queue.tail=task;
  try{await task;}finally{queue.count--;}
 }
 async function withImageSlot(task){
  if(activeImages>=2){if(pending.length>=16)throw sourceError('Image service is busy. Retry shortly.',503);await new Promise(resolve=>pending.push(resolve));}
  else activeImages++;
  try{return await task();}finally{const next=pending.shift();if(next)next();else activeImages--;}
 }
 function requireLicense(id){if(!licensingAllowed(id,usage))throw sourceError(id==='mangabaka'?'MangaBaka needs a configured usage license. See provider setup.':'This provider requires non-commercial use.',503);}
 async function request(id,url,options={}){
  requireLicense(id);const response=await cache.getOrLoad(CONTENT_POLICY_VERSION+':upstream:'+id+':'+digest(JSON.stringify([url,options])),options.contentEvidence?RATING_TTL_MS:options.json?120000:60000,async()=>{
   await pace(id);
   if(!await coordinator.budget('upstream-minute:'+id,upstreamLimits[id]||90,60000)||!await coordinator.budget('upstream-second:'+id,id==='mangadex'?4:2,1000))throw sourceError('Source rate limit reached',429,60);
   const response=await fetcher(url,textPolicy(id),{...options,accept:options.json?'application/json':'text/html',timeoutMs:9000,signal:catalogueSignal()});
   const text=response.body.toString('utf8');if(options.json){try{return JSON.parse(text);}catch{throw sourceError('Source returned invalid JSON');}}
   return text;
  });return options.contentEvidence&&response.value&&typeof response.value==='object'?{...response.value,kuroContentCheckedAt:response.checkedAt}:response.value;
 }
 const readable=createReadableLedger(coordinator,clock,seedInventory,{excludedGroups}),validator=createChapterValidator(coordinator,image,clock,validation);
 const content=createContentService({read:request,clock,onReject:(id,chapter)=>readable.revoke(id,chapter)});
 for(const p of installedProviders){const read=(url,options)=>request(p.id,url,options);
  if(p.adapter==='guya')adapters.set(p.id,createGuyaAdapter(p,read));
  if(p.adapter==='dynasty')adapters.set(p.id,createDynastyAdapter(p,read));
  if(p.adapter==='madara')adapters.set(p.id,createMadaraAdapter(providerFor(p.id),read));
  if(['themesia','keyoapp'].includes(p.adapter))adapters.set(p.id,createFamilyAdapter(providerFor(p.id),read));
  if(p.adapter==='flame')adapters.set(p.id,createFlameAdapter(providerFor(p.id),read));
  if(p.adapter==='asura')adapters.set(p.id,createAsuraAdapter(providerFor(p.id),read));
  if(p.adapter==='iken')adapters.set(p.id,createIkenAdapter(providerFor(p.id),read));
  if(p.adapter==='blogger')adapters.set(p.id,createBloggerAdapter(providerFor(p.id),read));
  if(p.adapter==='mangabox')adapters.set(p.id,createMangaBoxAdapter(providerFor(p.id),read));
  if(p.adapter==='metadata')adapters.set(p.id,createMetadataAdapter(p,read));
  if(p.adapter==='legacy'&&p.readable)adapters.set(p.id,createLegacyPageAdapter(p,read));
 }
 async function image(id,url,policy=imagePolicy(id),transform,invalidatedAt=0){
  const key=id+':'+digest(JSON.stringify([url,transform])),hit=images.get(key);if(hit&&hit.expires>clock()&&hit.validatedAt>invalidatedAt)return hit;
  return withImageSlot(async()=>{
   const again=images.get(key);if(again&&again.expires>clock()&&again.validatedAt>invalidatedAt)return again;
   if(!await coordinator.budget('image:'+id,360,60000))throw sourceError('Source image rate limit reached',429,60);
   const res=await fetcher(url,policy,{accept:'image/jpeg,image/png,image/webp,image/avif,image/gif',maxBytes:8*1024*1024,timeoutMs:12000,signal:catalogueSignal()});
   if(catalogueSignal()?.aborted)throw sourceError('Catalogue refresh deadline reached',503);
   const mime=policy.inferMime?imageSignatureType(res.body):res.headers['content-type'];
   const restored=transform?await restoreTiles(res.body,mime,transform):res.body;
   const metadata=await deliveryImage(restored,transform?'image/webp':mime);
   if(catalogueSignal()?.aborted)throw sourceError('Catalogue refresh deadline reached',503);
   if(metadata.width<64||metadata.height<32)throw sourceError('Source returned a placeholder instead of a reading page',422);
   const row={...metadata,sha256:digest(res.body),validatedAt:clock(),expires:clock()+300000};
   for(const [oldKey,old]of images)if(old.expires<=clock()){images.delete(oldKey);imageBytes-=old.body.length;}
   if(images.has(key)){imageBytes-=images.get(key).body.length;images.delete(key);}
   while(images.size&&(imageBytes+row.body.length>32*1024*1024||images.size>=128)){const first=images.keys().next().value;imageBytes-=images.get(first).body.length;images.delete(first);}
   images.set(key,row);imageBytes+=row.body.length;return row;
  });
 }
 async function health(id,update){const previous=await coordinator.get('health:'+id)||{};await coordinator.set('health:'+id,{...previous,...update,checkedAt:clock()},3600000).catch(()=>{});}
 const service={
  async budget(address,kind){return coordinator.budget('client:'+digest(address)+':'+kind,kind==='image'?240:120,60000);},
  async mangaDexMetadata(path){
   let parsed;try{parsed=new URL(path,'https://api.mangadex.org');}catch{throw sourceError('Invalid metadata API path',400);}
   const uuid='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
   const allowed=new RegExp('^/(?:manga(?:/'+uuid+'(?:/feed)?)?|chapter(?:/'+uuid+')?|statistics/manga|at-home/server/'+uuid+')$','i');
   if(parsed.origin!=='https://api.mangadex.org'||parsed.username||parsed.password||parsed.hash||!allowed.test(parsed.pathname)||parsed.href.length>4096)throw sourceError('Metadata API path is not permitted',403);
   // Every rating variant supplied by a browser is replaced, never merged.
   for(const key of [...parsed.searchParams.keys()])if(/^contentRating(?:\[.*\])?$/i.test(key))parsed.searchParams.delete(key);
   parsed.searchParams.set('contentRating[]','safe');
   const mangaPath=/^\/manga\/([0-9a-f-]{36})(\/feed)?$/i.exec(parsed.pathname),chapterPath=/^\/(?:chapter|at-home\/server)\/([0-9a-f-]{36})$/i.exec(parsed.pathname);
   if(mangaPath){const row=await content.manga('mangadex',mangaPath[1]);if(!mangaPath[2])return {result:'ok',data:row.raw};}
   if(chapterPath){const row=await content.chapter(chapterPath[1]);if(parsed.pathname.startsWith('/chapter/'))return {result:'ok',data:row.rawChapter};}
   if(parsed.pathname==='/chapter'){
    const parent=parsed.searchParams.get('manga');if(!parent)throw sourceError('An approved manga identity is required for chapters.',403);await content.manga('mangadex',parent);
   }
   if(parsed.pathname==='/statistics/manga'){
    const ids=parsed.searchParams.getAll('manga[]');if(ids.length>100)throw sourceError('Too many manga identities',400);
    for(const id of ids)await content.manga('mangadex',id);
   }
   const reply=await request('mangadex',parsed.href,{json:true,contentEvidence:true});
   if(parsed.pathname==='/manga'){
    const rows=(Array.isArray(reply.data)?reply.data:[]).filter(raw=>classifyMangaDex(raw).allowed).map(raw=>content.seed(raw,reply.kuroContentCheckedAt)?.raw).filter(Boolean);
    const asOf=clock(),proofs=tickets?await readable.getMany(rows.map(raw=>'mangadex-'+raw.id.toLowerCase())):new Map();
    return {...reply,data:rows.map(raw=>{const proof=proofs.get('mangadex-'+raw.id.toLowerCase());return {...raw,kuroReadabilityAsOf:asOf,kuroReadabilityRevision:proofs.revision||0,kuroReadability:proof?{ready:true,mangaId:proof.id,chapterId:proof.chapterId,version:proof.version,policyVersion:proof.policyVersion,validation:'complete-chapter',validatedPages:proof.validatedPages,pageCount:proof.pageCount,checkedAt:proof.checkedAt,expiresAt:proof.expiresAt}:null};}),total:undefined};
   }
   if(mangaPath?.[2]||parsed.pathname==='/chapter'){
    const parent=(mangaPath?.[1]||parsed.searchParams.get('manga')).toLowerCase();return {...reply,data:(Array.isArray(reply.data)?reply.data:[]).filter(raw=>raw?.type==='chapter'&&!blockedIdentity('mangadex','mangadex-'+parent,'mangadex:'+raw.id)&&raw.relationships?.filter(x=>x.type==='manga').length===1&&raw.relationships.some(x=>x.type==='manga'&&x.id?.toLowerCase()===parent)&&!raw.attributes?.externalUrl&&(!raw.attributes?.contentRating||raw.attributes.contentRating==='safe')&&!forbiddenText(raw.attributes?.title))};
   }
   return reply;
  },
  async directory(){const ids=installedProviders.map(p=>'health:'+p.id),values=coordinator.getMany?await coordinator.getMany(ids):await Promise.all(ids.map(id=>coordinator.get(id))),health=new Map(installedProviders.map((p,i)=>[p.id,values[i]]));
   return {...registry,contentPolicy:{version:CONTENT_POLICY_VERSION,strict:true,unknown:'blocked'},refreshIntervalMs:300000,usageReady:licensingAllowed('mangabaka',usage),providers:registry.providers.map(p=>({...p,contentPolicy:providerContentPolicy(p),available:providerContentPolicy(p).state==='eligible'&&licensingAllowed(p.id,usage),health:health.get(p.id)||null}))};},
  contentCheck:(provider,id,chapter)=>content.check(provider,id,chapter),
  async readableCheck(provider,id){if(provider!=='mangadex')throw sourceError('This provider does not supply approved reading pages',409);requireLicense(provider);if(!tickets)throw sourceError('Configure the server page ticket key using the existing account encryption key.',503);await service.contentCheck(provider,id);const asOf=clock(),rows=await readable.getMany([id]),row=rows.get(id);return {ready:!!row,asOf,inventoryRevision:rows.revision,...row?{chapterId:row.chapterId,checkedAt:row.checkedAt,expiresAt:row.expiresAt,validation:'complete-chapter',validatedPages:row.validatedPages,pageCount:row.pageCount}:{}};},
  async readableSummary(){const summary=await readable.summary(),readingConfigured=!!tickets&&licensingAllowed('mangadex',usage);return {...summary,...!readingConfigured?{uniqueCount:0,verifiedEditions:0,duplicatesGrouped:0,oldestCheckAt:null,latestCheckAt:null}:{},readingConfigured,auditCoverage};},
  readableSnapshot:()=>readable.rows(),
  async cover(provider,id){const row=await content.manga(provider,id);if(!row.coverUrl)throw sourceError('Approved cover is unavailable',404);return image(provider,row.coverUrl,row.coverPolicy);},
  async call(id,action,params={},origin){
   if(action==='pages'&&!catalogueSignal())try{return await withCatalogueDeadline(()=>service.call(id,action,params,origin),Math.min(20000,Math.max(1,pageDeadlineMs)));}catch(error){if(/deadline/i.test(error.message))return {value:{chapterId:params.id,verified:false,pending:true,stage:'preparing',validation:'complete-chapter',contentApproval:{version:CONTENT_POLICY_VERSION,pending:true},validatedPages:0,pageCount:null,pages:[]},checkedAt:clock(),stale:false};throw error;}
   requireContentProvider(providerFor(id));requireLicense(id);const adapter=adapters.get(id);if(!adapter)throw sourceError('This provider has no installed KURO catalogue adapter.',409);
   params=canonicalParameters(action,params);
   if(id==='mangadex'&&action==='pages')await content.chapter(params.id);
   else if(action==='details'||action==='chapters')await content.manga(id,params.id);
   const ttl=['search','popular','latest','chapters'].includes(action)?120000:action==='pages'?60000:300000;
   const result=await cache.getOrLoad(CONTENT_POLICY_VERSION+':operation:'+id+':'+action+':'+digest(JSON.stringify(params)),Math.min(ttl,RATING_TTL_MS),async()=>{
    try{let value;
     if(id==='mangadex'&&['search','popular','latest'].includes(action)){
      const q=new URLSearchParams({'limit':'24','offset':String((params.page-1)*24),'hasAvailableChapters':'true','availableTranslatedLanguage[]':'en','includes[]':'cover_art'});q.append('includes[]','author');q.append('includes[]','artist');q.set('order['+(action==='popular'?'followedCount':action==='latest'?'latestUploadedChapter':'relevance')+']','desc');if(params.q)q.set('title',params.q);
      const reply=await service.mangaDexMetadata('/manga?'+q);value={items:reply.data.map(raw=>content.seed(raw,reply.kuroContentCheckedAt).manga),...reply.data.length===24?{nextPage:params.page+1}:{}};
     }else if(id==='mangadex'&&action==='details')value=(await content.manga(id,params.id)).manga;
     else if(id==='mangadex'&&action==='chapters') {
      const parent=params.id.replace(/^mangadex-/,''),q=new URLSearchParams({'limit':'500','translatedLanguage[]':'en','order[chapter]':'desc','order[readableAt]':'desc','includeExternalUrl':'0'});
      const reply=await service.mangaDexMetadata('/manga/'+parent+'/feed?'+q);value=reply.data.map(raw=>({id:'mangadex:'+raw.id,mangaId:'mangadex-'+parent,sourceId:id,title:raw.attributes?.title||'Chapter '+(raw.attributes?.chapter||'0'),chapterNumber:Number(raw.attributes?.chapter)||0,publishDate:Date.parse(raw.attributes?.readableAt||raw.attributes?.publishAt)||0,pages:raw.attributes?.pages}));
     }
     else value=await adapter.call(action,params);
     await health(id,{status:'connected',operation:action,error:null});return value;}
    catch(error){await health(id,{status:'unavailable',operation:action,error:error.message});throw error;}
   });
   if(action==='pages')return {...result,value:await prepareTrusted(id,result.value,origin)};
   if(['search','latest','popular'].includes(action)&&Array.isArray(result.value?.items))return {...result,value:{...result.value,items:result.value.items.filter(row=>!blockedIdentity(id,row.id))}};
   return result;
  },
  async prepare(id,manifest,origin){
   if(!manifest?.chapterId||typeof manifest.chapterId!=='string')throw sourceError('Invalid chapter identity',400);
   // Browser-supplied URLs never authorize a fetch or a ticket. Reconstruct the
   // manifest from the fixed provider adapter and its validated chapter ID.
   return (await service.call(id,'pages',{id:manifest.chapterId},origin)).value;
  },
  async servePage(ticket){if(!tickets)throw sourceError('Page service not configured',503);const page=tickets.verify(ticket,clock(),(id,data)=>id==='mangadex'&&data.c?.startsWith('mangadex:')?{...imagePolicy(id),hosts:[data.h]}:imagePolicy(id));requireContentProvider(providerFor(page.provider));requireLicense(page.provider);
   if(page.provider!=='mangadex'||!page.mangaId)throw sourceError('Page has no approved manga relationship',403);
   const failure=await readable.failure(page.mangaId,page.chapterId);if(page.proofCheckedAt<=failure)throw sourceError('This chapter requires a fresh complete check',409);
   try{await content.chapter(page.chapterId,page.mangaId);}catch(error){if(error.status===403)await readable.revoke(page.mangaId).catch(()=>{});throw error;}
   if(page.groups.some(id=>excludedGroups.includes(id)))throw sourceError('The scanlation group has requested removal from KURO.',410);
   try{return await image(page.provider,page.url,page.provider==='mangadex'?{...imagePolicy(page.provider),hosts:[page.host]}:imagePolicy(page.provider),page.transform);}catch(error){await readable.revoke(page.mangaId,page.chapterId).catch(()=>{});throw error;}},
  async refresh({deadlineMs=42000}={}){
   const sources=installedProviders.filter(x=>providerContentPolicy(x).state==='eligible'&&adapters.has(x.id)&&x.readable&&licensingAllowed(x.id,usage));const reports=[];
   let deadlineExceeded=false,scheduled=0;
   try{await withCatalogueDeadline(async()=>{
    const cursor=await coordinator.get('refresh-cursor')||0;
    const selected=Array.from({length:Math.min(6,sources.length)},(_,i)=>sources[(cursor+i)%sources.length]);
    for(let i=0;i<selected.length;i+=3){const batch=selected.slice(i,i+3);
     // Commit each selected wave before its I/O. A interrupted hosted run then
     // rotates past slow sources instead of repeatedly pinning the same wave.
     await coordinator.set('refresh-cursor',(cursor+i+batch.length)%Math.max(1,sources.length),7*86400000);scheduled+=batch.length;
     await Promise.all(batch.map(async p=>{try{const data=await service.call(p.id,'latest',{page:1});reports.push({provider:p.id,ok:true,count:data.value.items.length,checkedAt:data.checkedAt});}catch(error){reports.push({provider:p.id,ok:false,error:error.message});}}));
     if(catalogueSignal()?.aborted)break;
    }
   },Math.min(42000,Math.max(1,deadlineMs)));}catch(error){if(/deadline/i.test(error.message))deadlineExceeded=true;else throw error;}
   return {checkedAt:clock(),scope:'rotating batch of up to 6 public feeds; all feeds also refresh on demand',totalSources:sources.length,scheduled,deadlineExceeded,reports:[...reports]};
  }
 };return service;
 async function prepareTrusted(id,manifest,origin){
   const provider=providerFor(id);requireContentProvider(provider);requireLicense(id);if(!provider.readable)throw sourceError('Provider does not supply KURO reading pages',409);
   if(!tickets)throw sourceError('Configure the server page ticket key using the existing account encryption key.',503);
   if(!manifest?.chapterId?.startsWith(id+':'))throw sourceError('Chapter identity does not match its provider',400);
   const approved=await content.chapter(manifest.chapterId);
   const policy=id==='mangadex'?{...imagePolicy(id),hosts:manifest.allowedImageHosts||imagePolicy(id).hosts}:imagePolicy(id);
   const clean=sanitizeManifest(manifest,policy);
   const declared=approved.rawChapter.attributes?.pages;if(Number.isInteger(declared)&&declared>0&&declared!==clean.pages.length){await readable.revoke(approved.manga.id,clean.chapterId);throw sourceError('Chapter manifest has missing or duplicate pages',422);}
   let credits=Array.isArray(manifest.credits)?manifest.credits.filter(x=>x&&typeof x.name==='string'&&typeof x.url==='string'&&x.url.startsWith('https://')).slice(0,10):[{name:provider.name,url:provider.website}];
   let groupIds=[];if(id==='mangadex'){
    const chapter=manifest.chapterId.slice(9);if(!/^[0-9a-f-]{36}$/i.test(chapter))throw sourceError('Invalid MangaDex chapter',400);
    const groups=approved.rawChapter.relationships?.filter(x=>x.type==='scanlation_group')||[];
    groupIds=groups.map(x=>x.id).filter(x=>/^[0-9a-f-]{36}$/i.test(x));
    if(groups.some(x=>excludedGroups.includes(x.id)))throw sourceError('The scanlation group has requested removal from KURO.',410);
    credits=[{name:'MangaDex',url:'https://mangadex.org/'},...groups.filter(x=>/^[0-9a-f-]{36}$/i.test(x.id)).map(x=>({name:x.attributes?.name||'MangaDex scanlation group',url:'https://mangadex.org/group/'+x.id}))];
   }
   let revocation;const invalidate=error=>{if([403,404,410,422].includes(error.status)||!catalogueSignal()?.aborted)return revocation||=catalogueCleanup(()=>readable.revoke(approved.manga.id,clean.chapterId)).catch(()=>{});};
   // Register integrity cleanup at image failure, before a shared progress
   // lock's asynchronous release can race the outer hosted deadline.
   let proof;try{proof=await validator.check(id,clean,policy,await readable.failure(approved.manga.id,clean.chapterId),invalidate);}catch(error){
    // A hosted deadline says nothing about page corruption. Retain completed
    // pairs for retry; the pending response still contains no reader tickets.
    await invalidate(error);
    await health(id,{status:'unavailable',operation:'pages',error:error.message});throw error;
   }
   const details={chapterId:clean.chapterId,verified:proof.verified,pending:proof.pending,validation:'complete-chapter',contentApproval:{version:CONTENT_POLICY_VERSION,mangaId:approved.manga.id},checkedAt:proof.checkedAt,expiresAt:proof.expiresAt,validatedPages:proof.validatedPages,pageCount:proof.pageCount,pageEvidence:proof.evidence,credits};
   if(!proof.verified)return {...details,pages:[]};
   const recorded=await readable.record(approved.manga,{...proof,groups:groupIds});await health(id,{status:'chapter-verified',completeChapterVerifiedAt:proof.checkedAt,operation:'pages',error:null});
   return {...details,readabilityAsOf:clock(),inventoryRevision:recorded.inventoryRevision,
    pages:clean.pages.map(page=>({index:page.index,url:new URL('/api/catalogue/page?ticket='+tickets.issue({provider:id,url:page.url,chapterId:clean.chapterId,mangaId:approved.manga.id,proofCheckedAt:proof.checkedAt,proofExpiresAt:proof.expiresAt,groups:groupIds,transform:page.transform},clock(),policy),origin).href}))};
  }
}
