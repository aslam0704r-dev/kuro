import test from 'node:test';
import assert from 'node:assert/strict';
import {createCatalogueService} from '../server/catalogue/service.mjs';
import {createMemoryCoordinator} from '../server/catalogue/cache.mjs';
import {createReadableLedger,createChapterValidator,READABLE_WINDOW_MS} from '../server/catalogue/readable.mjs';
import {createCatalogueCore} from '../client/catalogue-core.mjs';
import {metroProviders} from './helpers/metro-provider-harness.mjs';
import sharp from 'sharp';
import {catalogueSignal} from '../server/catalogue/deadline.mjs';

const MID='11111111-1111-4111-8111-111111111111',CID='22222222-2222-4222-8222-222222222222';
const manga={id:'mangadex-'+MID,sourceId:'mangadex',title:'Mountain Friends',genres:[]};
const raw=()=>({id:MID,type:'manga',attributes:{title:{en:'Mountain Friends'},contentRating:'safe',tags:[]},relationships:[]});
const proof=now=>({version:'complete-chapter-1',validation:'complete-chapter',chapterId:'mangadex:'+CID,validatedPages:3,pageCount:3,checkedAt:now,expiresAt:now+READABLE_WINDOW_MS});

test('approved list responses carry a current complete proof without checking chapters again',async()=>{
 let now=Date.now();const clock=()=>now,coordinator=createMemoryCoordinator(clock),ledger=createReadableLedger(coordinator,clock);
 await ledger.record(manga,proof(now));let requests=0;
 const service=createCatalogueService({coordinator,clock,ticketKey:Buffer.alloc(32,7),fetcher:async()=>{requests++;return {body:Buffer.from(JSON.stringify({data:[raw()]})),headers:{}};}});
 const list=await service.mangaDexMetadata('/manga?limit=20');
 assert.equal(list.data[0].kuroReadability?.ready,true);
 assert.equal(list.data[0].kuroReadability.mangaId,manga.id);
 assert.equal(list.data[0].kuroReadability.validatedPages,3);
 assert.ok(Number.isSafeInteger(list.data[0].kuroReadabilityRevision));
 assert.equal(requests,1);
 await ledger.revoke(manga.id);
 const revoked=(await service.mangaDexMetadata('/manga?limit=20')).data[0];assert.notEqual(revoked.kuroReadability?.ready,true);assert.ok(revoked.kuroReadabilityRevision>list.data[0].kuroReadabilityRevision);
 now+=READABLE_WINDOW_MS+1;
 assert.notEqual((await service.mangaDexMetadata('/manga?limit=20')).data[0].kuroReadability?.ready,true);
});

test('a forged upstream proof cannot admit an unverified list title',async()=>{
 const coordinator=createMemoryCoordinator(),now=Date.now();
 const service=createCatalogueService({coordinator,ticketKey:Buffer.alloc(32,7),fetcher:async()=>({body:Buffer.from(JSON.stringify({data:[{...raw(),kuroReadability:{...proof(now),ready:true,mangaId:manga.id}}]})),headers:{}})});
 assert.notEqual((await service.mangaDexMetadata('/manga?limit=20')).data[0].kuroReadability?.ready,true);
});

test('single-manga metadata also strips provider-supplied readiness fields',async()=>{
 const now=Date.now();
 const service=createCatalogueService({coordinator:createMemoryCoordinator(),ticketKey:Buffer.alloc(32,7),fetcher:async()=>({body:Buffer.from(JSON.stringify({data:{...raw(),kuroReadability:{...proof(now),ready:true,mangaId:manga.id,policyVersion:'strict-1'}}})),headers:{}})});
 assert.notEqual((await service.mangaDexMetadata('/manga/'+MID)).data.kuroReadability?.ready,true);
 assert.equal((await service.readableSummary()).uniqueCount,0);
});

test('a mounted collection drops its local ready card when a fresh list revokes the proof',()=>{
 const previous={location:globalThis.location,document:globalThis.document};globalThis.location={origin:'http://localhost'};globalThis.document={hidden:false};
 try {
  const core=createCatalogueCore([]),mapper={mapManga:()=>({...manga})};core.initialize(875,mapper,()=>{});const now=Date.now();
  const item=mapper.mapManga({...raw(),kuroContentApproval:{version:'strict-1',checkedAt:now},kuroReadabilityAsOf:now,kuroReadability:{...proof(now),ready:true,mangaId:manga.id,policyVersion:'strict-1'}});
  const ref={current:new Map()},React={useRef:()=>ref,useState:value=>[value,()=>{}],useEffect:()=>{},useSyncExternalStore:()=>0,useCallback:fn=>fn,useMemo:fn=>fn()},api={};
  core.initialize(1388,api,id=>id===15?React:{useFocusEffect:fn=>fn()});
  assert.equal(api.useReadyCollection([item],true).items.length,1);
  mapper.mapManga({...raw(),kuroContentApproval:{version:'strict-1',checkedAt:now},kuroReadabilityAsOf:now,kuroReadability:null});
  core.initialize(1388,api,id=>id===15?React:{useFocusEffect:()=>{}});
  assert.equal(api.useReadyCollection([item],true).items.length,0);
 }finally{if(previous.location===undefined)delete globalThis.location;else globalThis.location=previous.location;if(previous.document===undefined)delete globalThis.document;else globalThis.document=previous.document;}
});

test('an older in-flight check cannot restore readiness after a fresh negative list result',async()=>{
 const previous={location:globalThis.location,fetch:globalThis.fetch};globalThis.location={origin:'http://localhost'};
 try {
  const runtime=metroProviders(),manager=runtime(789).sourceManager;manager.register({id:'mangadex',name:'MangaDex',capabilities:{readable:true}});
  const core=createCatalogueCore([{id:'mangadex',adapter:'legacy',readable:true}]);core.initialize(789,{sourceManager:manager},runtime);core.safety.verify=async()=>({allowed:true});
  const mapper={mapManga:()=>({...manga})};core.initialize(875,mapper,()=>{});let release,requested;const started=new Promise(resolve=>{requested=resolve;});
  globalThis.fetch=()=>{requested();return new Promise(resolve=>{release=resolve;});};
  const checking=core.check(manga);await started;
  mapper.mapManga({...raw(),kuroContentApproval:{version:'strict-1',checkedAt:Date.now()},kuroReadabilityAsOf:Date.now(),kuroReadability:null});
  release({ok:true,json:async()=>({...proof(Date.now()),ready:true})});
  assert.equal((await checking).obsolete,true);assert.equal(core.cached(manga.id),undefined);
 }finally{globalThis.fetch=previous.fetch;if(previous.location===undefined)delete globalThis.location;else globalThis.location=previous.location;}
});

test('a cached pre-qualification list cannot erase a newer complete proof',async()=>{
 const previous={location:globalThis.location,fetch:globalThis.fetch};globalThis.location={origin:'http://localhost'};
 try {
  const now=Date.now(),runtime=metroProviders(),manager=runtime(789).sourceManager;manager.register({id:'mangadex',name:'MangaDex',capabilities:{readable:true}});
  const core=createCatalogueCore([{id:'mangadex',adapter:'legacy',readable:true}]);core.initialize(789,{sourceManager:manager},runtime);core.safety.verify=async()=>({allowed:true});const mapper={mapManga:()=>({...manga})};core.initialize(875,mapper,()=>{});
  const old={...raw(),kuroContentApproval:{version:'strict-1',checkedAt:now},kuroReadabilityAsOf:now,kuroReadability:null};mapper.mapManga(old);
  globalThis.fetch=async()=>({ok:true,json:async()=>({...proof(now),ready:true,asOf:now+100})});assert.equal((await core.check(manga)).ready,true);
  mapper.mapManga(old);assert.equal(core.cached(manga.id)?.ready,true);
 }finally{globalThis.fetch=previous.fetch;if(previous.location===undefined)delete globalThis.location;else globalThis.location=previous.location;}
});

test('a cached older positive list cannot resurrect a newer revoked snapshot',()=>{
 const previous=globalThis.location;globalThis.location={origin:'http://localhost'};
 try {
  const now=Date.now(),core=createCatalogueCore([]),mapper={mapManga:()=>({...manga})};core.initialize(875,mapper,()=>{});
  const old={...raw(),kuroContentApproval:{version:'strict-1',checkedAt:now},kuroReadabilityAsOf:now,kuroReadability:{...proof(now),ready:true,mangaId:manga.id,policyVersion:'strict-1'}};
  mapper.mapManga(old);assert.equal(core.cached(manga.id)?.ready,true);
  mapper.mapManga({...old,kuroReadabilityAsOf:now+100,kuroReadability:null});assert.equal(core.cached(manga.id),undefined);
  mapper.mapManga(old);assert.equal(core.cached(manga.id),undefined);
 }finally{if(previous===undefined)delete globalThis.location;else globalThis.location=previous;}
});

test('atomic inventory revision wins over inverted network-completion timestamps',()=>{
 const previous=globalThis.location;globalThis.location={origin:'http://localhost'};
 try {
  const now=Date.now(),core=createCatalogueCore([]),mapper={mapManga:()=>({...manga})};core.initialize(875,mapper,()=>{});
  const old={...raw(),kuroContentApproval:{version:'strict-1',checkedAt:now},kuroReadabilityAsOf:now+1000,kuroReadabilityRevision:1,kuroReadability:{...proof(now),ready:true,mangaId:manga.id,policyVersion:'strict-1'}};
  mapper.mapManga(old);assert.equal(core.cached(manga.id)?.ready,true);
  mapper.mapManga({...old,kuroReadabilityAsOf:now,kuroReadabilityRevision:2,kuroReadability:null});assert.equal(core.cached(manga.id),undefined);
  mapper.mapManga(old);assert.equal(core.cached(manga.id),undefined);
 }finally{if(previous===undefined)delete globalThis.location;else globalThis.location=previous;}
});

test('a direct-reader completion survives a later replay of an older null list',async()=>{
 const previous=globalThis.location;globalThis.location={origin:'http://localhost'};
 try {
  const now=Date.now(),runtime=metroProviders(),manager=runtime(789).sourceManager;manager.register({id:'mangadex',name:'MangaDex',capabilities:{readable:true}});
  const core=createCatalogueCore([{id:'mangadex',adapter:'legacy',readable:true}]);core.initialize(789,{sourceManager:manager},runtime);core.safety.verify=async()=>({allowed:true});
  manager.require('mangadex').getChapterPages=async()=>({...proof(now),verified:true,pages:[{},{},{}],inventoryRevision:2,readabilityAsOf:now+100});
  await core.checkChapter(manga,'mangadex:'+CID);assert.equal(core.cached(manga.id)?.ready,true);
  const mapper={mapManga:()=>({...manga})};core.initialize(875,mapper,()=>{});
  mapper.mapManga({...raw(),kuroContentApproval:{version:'strict-1',checkedAt:now},kuroReadabilityAsOf:now,kuroReadabilityRevision:1,kuroReadability:null});
  assert.equal(core.cached(manga.id)?.ready,true);
 }finally{if(previous===undefined)delete globalThis.location;else globalThis.location=previous;}
});

test('a warm approved list item skips per-title readiness and chapter requests in the browser',async()=>{
 const previous=globalThis.location;globalThis.location={origin:'http://localhost'};
 try {
  const runtime=metroProviders(),manager=runtime(789).sourceManager;manager.register({id:'mangadex',name:'MangaDex',capabilities:{readable:true}});
  const core=createCatalogueCore([{id:'mangadex',adapter:'legacy',readable:true}]);core.initialize(789,{sourceManager:manager},runtime);
  const now=Date.now(),api={mapManga:()=>({...manga})};core.initialize(875,api,()=>{});
  const item=api.mapManga({...raw(),kuroContentApproval:{version:'strict-1',checkedAt:now},kuroReadabilityAsOf:now,kuroReadability:{...proof(now),ready:true,mangaId:manga.id,policyVersion:'strict-1'}});
  assert.equal(core.cached(item.id)?.ready,true);
  manager.require('mangadex').getChapterList=()=>{throw new Error('Warm list should not fetch chapters');};
  assert.equal((await core.check(item)).ready,true);
  api.mapManga({...raw(),kuroContentApproval:{version:'strict-1',checkedAt:now},kuroReadabilityAsOf:now,kuroReadability:null});
  assert.equal(core.cached(item.id),undefined,'A fresh list must invalidate an older revoked readiness result');
 }finally{if(previous===undefined)delete globalThis.location;else globalThis.location=previous;}
});

test('an interrupted hosted request preserves earlier complete page pairs for retry',async()=>{
 const coordinator=createMemoryCoordinator(),bytes=await sharp({create:{width:120,height:200,channels:3,background:'#345'}}).png().toBuffer(),seen=[];let block=false;
 const fetcher=async input=>{const url=new URL(input);let value;
  if(url.pathname.startsWith('/manga/'))value={data:raw()};
  else if(url.pathname.startsWith('/chapter/'))value={data:{id:CID,type:'chapter',attributes:{title:'Beginning',chapter:'1',pages:6},relationships:[{type:'manga',id:MID}]}};
  else if(url.pathname.startsWith('/at-home/'))value={result:'ok',baseUrl:'https://uploads.mangadex.org',chapter:{hash:'test',data:Array.from({length:6},(_,i)=>i+'.png')}};
  else {const index=Number(url.pathname.split('/').at(-1).split('.')[0]);seen.push(index);if(block)await new Promise((_,reject)=>{const signal=catalogueSignal();if(signal.aborted)reject(signal.reason);else signal.addEventListener('abort',()=>reject(signal.reason),{once:true});});return {body:bytes,headers:{'content-type':'image/png'}};}
  return {body:Buffer.from(JSON.stringify(value)),headers:{'content-type':'application/json'}};
 };
 const initial=createCatalogueService({coordinator,ticketKey:Buffer.alloc(32,7),fetcher,validation:{maxPages:2}});
 assert.equal((await initial.call('mangadex','pages',{id:'mangadex:'+CID},'http://localhost')).value.validatedPages,2);
 const timed=createCatalogueService({coordinator,ticketKey:Buffer.alloc(32,7),fetcher,pageDeadlineMs:120});block=true;
 assert.equal((await timed.call('mangadex','pages',{id:'mangadex:'+CID},'http://localhost')).value.pending,true);
 await new Promise(resolve=>setTimeout(resolve,30));block=false;
 const complete=(await timed.call('mangadex','pages',{id:'mangadex:'+CID},'http://localhost')).value;
 assert.equal(complete.verified,true);assert.equal(seen.filter(index=>index===0).length,1);assert.equal(seen.filter(index=>index===1).length,1);
});

test('known corruption revokes the prior proof even when its sibling waits for a deadline',async()=>{
 let now=Date.now(),corrupt=false;const coordinator=createMemoryCoordinator(()=>now),bytes=await sharp({create:{width:120,height:200,channels:3,background:'#345'}}).png().toBuffer();
 const fetcher=async input=>{const url=new URL(input);let value;
  if(url.pathname.startsWith('/manga/'))value={data:raw()};
  else if(url.pathname.startsWith('/chapter/'))value={data:{id:CID,type:'chapter',attributes:{title:'Beginning',chapter:'1',pages:2},relationships:[{type:'manga',id:MID}]}};
  else if(url.pathname.startsWith('/at-home/'))value={result:'ok',baseUrl:'https://uploads.mangadex.org',chapter:{hash:corrupt?'changed':'first',data:['0.png','1.png']}};
  else {if(corrupt&&url.pathname.endsWith('/1.png'))await new Promise((_,reject)=>{const signal=catalogueSignal();if(signal.aborted)reject(signal.reason);else signal.addEventListener('abort',()=>reject(signal.reason),{once:true});});return {body:corrupt?Buffer.from('<html>broken</html>'):bytes,headers:{'content-type':'image/png'}};}
  return {body:Buffer.from(JSON.stringify(value)),headers:{'content-type':'application/json'}};
 };
 const service=createCatalogueService({coordinator,clock:()=>now,ticketKey:Buffer.alloc(32,7),fetcher,pageDeadlineMs:1600});
 await service.call('mangadex','pages',{id:'mangadex:'+CID},'http://localhost');assert.equal((await service.readableSummary()).uniqueCount,1);
 const lock=coordinator.lock.bind(coordinator);coordinator.lock=async(key,task)=>{try{return await lock(key,task);}catch(error){if(key.includes(':progress:'))await new Promise(resolve=>setTimeout(resolve,1800));throw error;}};
 now+=120001;corrupt=true;
 try {const result=await service.call('mangadex','pages',{id:'mangadex:'+CID},'http://localhost');assert.deepEqual(result.value.pages,[]);}catch(error){assert.equal(error.status,422);}
 await new Promise(resolve=>setTimeout(resolve,30));assert.equal((await service.readableSummary()).uniqueCount,0);
});

const clean=count=>({chapterId:'mangadex:'+CID,pages:Array.from({length:count},(_,index)=>({index,url:'https://uploads.mangadex.org/data/test/'+index+'.png'}))});
const checked=()=>({sha256:'a'.repeat(64),width:120,height:200,mime:'image/png',validatedAt:Date.now()});

test('a fast complete chapter needs one validation call rather than one call per two pages',async()=>{
 let active=0,peak=0;const seen=[];
 const validator=createChapterValidator(createMemoryCoordinator(),async(_provider,url)=>{active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,2));seen.push(url);active--;return checked();});
 const result=await validator.check('mangadex',clean(12),{});
 assert.equal(result.verified,true);assert.equal(result.validatedPages,12);assert.equal(new Set(seen).size,12);assert.ok(peak<=2);
});

test('large chapters remain bounded and resume without fetching completed pages',async()=>{
 const seen=[];const validator=createChapterValidator(createMemoryCoordinator(),async(_p,url)=>{seen.push(url);return checked();});
 const first=await validator.check('mangadex',clean(20),{});
 assert.equal(first.pending,true);assert.equal(first.validatedPages,16);
 const second=await validator.check('mangadex',clean(20),{});
 assert.equal(second.verified,true);assert.equal(second.validatedPages,20);assert.equal(seen.length,20);
});

test('slow validation stops starting batches and resumes all remaining pages',async()=>{
 const validator=createChapterValidator(createMemoryCoordinator(),async()=>{await new Promise(resolve=>setTimeout(resolve,15));return checked();},Date.now,{maxDurationMs:5});
 const first=await validator.check('mangadex',clean(4),{});assert.equal(first.pending,true);assert.equal(first.validatedPages,2);
 assert.equal((await validator.check('mangadex',clean(4),{})).verified,true);
});

test('a corrupt later batch never produces a complete proof',async()=>{
 const validator=createChapterValidator(createMemoryCoordinator(),async(_p,url)=>{if(url.endsWith('/5.png'))throw new Error('Corrupt image');return checked();});
 await assert.rejects(validator.check('mangadex',clean(8),{}),/Corrupt image/);
});

test('initial availability checks choose a small complete chapter without changing reading order',async()=>{
 const previous=globalThis.location;globalThis.location={origin:'http://localhost'};
 try {
  const runtime=metroProviders(),manager=runtime(789).sourceManager;manager.register({id:'mangadex',name:'MangaDex',capabilities:{readable:true}});
  const core=createCatalogueCore([{id:'mangadex',adapter:'legacy',readable:true}]);core.initialize(789,{sourceManager:manager},runtime);core.safety.verify=async()=>({allowed:true});
  const chapters=[{id:'long',pages:80,chapterNumber:2},{id:'small',pages:8,chapterNumber:1}],seen=[];
  manager.require('mangadex').getChapterList=async()=>chapters;
  manager.require('mangadex').getChapterPages=async id=>{seen.push(id);return {verified:true,validation:'complete-chapter',validatedPages:1,pageCount:1,pages:[{}]};};
  assert.equal((await core.check(manga)).ready,true);assert.deepEqual(seen,['small']);assert.equal(chapters[0].id,'long');
 }finally{if(previous===undefined)delete globalThis.location;else globalThis.location=previous;}
});
