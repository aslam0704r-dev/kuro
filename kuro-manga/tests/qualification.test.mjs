import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {once} from 'node:events';
import sharp from 'sharp';
import {createCatalogueService} from '../server/catalogue/service.mjs';
import {createCatalogueRoutes} from '../server/catalogue/routes.mjs';
import {createMemoryCoordinator,createRedisCoordinator,createCatalogueCache} from '../server/catalogue/cache.mjs';
import {randomUUID} from 'node:crypto';
import {redisFixture} from './helpers/redis-fixture.mjs';
import {createCatalogueCore} from '../client/catalogue-core.mjs';
import {createReadableLedger} from '../server/catalogue/readable.mjs';

const MID='11111111-1111-4111-8111-111111111111',CID='22222222-2222-4222-8222-222222222222',LONG='33333333-3333-4333-8333-333333333333';
const raw=()=>({id:MID,type:'manga',attributes:{title:{en:'Mountain Friends'},contentRating:'safe',tags:[]},relationships:[]});
async function fixture(options={}){
 const coordinator=options.coordinator||createMemoryCoordinator(),seen=[],count=options.pageCount||2,bytes=await sharp({create:{width:120,height:200,channels:3,background:'#345'}}).png().toBuffer();
 const service=createCatalogueService({coordinator,ticketKey:Buffer.alloc(32,7),...options,fetcher:async input=>{
  const url=new URL(input);seen.push(url.pathname);let data;
  if(url.pathname.endsWith('/feed'))data={data:[{id:LONG,type:'chapter',attributes:{pages:80,chapter:'2'},relationships:[{type:'manga',id:MID}]},{id:CID,type:'chapter',attributes:{pages:count,chapter:'1'},relationships:[{type:'manga',id:MID}]}]};
  else if(url.pathname.startsWith('/manga/'))data={data:raw()};
  else if(url.pathname.startsWith('/chapter/'))data={data:{id:CID,type:'chapter',attributes:{pages:count,chapter:'1'},relationships:[{type:'manga',id:MID}]}};
  else if(url.pathname.startsWith('/at-home/'))data={result:'ok',baseUrl:'https://uploads.mangadex.org',chapter:{hash:'public',data:Array.from({length:count},(_,i)=>i+'.png')}};
  else return {body:options.corrupt?Buffer.from('bad image'):bytes,headers:{'content-type':'image/png'}};
  return {body:Buffer.from(JSON.stringify(data)),headers:{'content-type':'application/json'}};
 }});
 let origin;const route=createCatalogueRoutes(service,{origin:()=>origin});
 const server=http.createServer(async(req,res)=>{if(!await route(req,res,new URL(req.url,'http://localhost'))){res.writeHead(404);res.end();}});
 server.listen(0,'127.0.0.1');await once(server,'listening');origin='http://127.0.0.1:'+server.address().port;
 return {service,coordinator,seen,origin,close:()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);})};
}

test('a cold title qualifies through one browser request with every page decoded',async()=>{
 const f=await fixture();try{
  const response=await fetch(f.origin+'/api/catalogue/readable/qualify?provider=mangadex&id=mangadex-'+MID),proof=await response.json();
  assert.equal(response.status,200);assert.equal(proof.ready,true);assert.equal(proof.validatedPages,2);assert.equal(proof.manga.id,'mangadex-'+MID);assert.equal(proof.chapterId,'mangadex:'+CID);
  assert.equal(f.seen.some(path=>path.includes(LONG)),false,'The smaller qualifying chapter must be selected');
  assert.equal(f.seen.filter(path=>path.startsWith('/data/')).length,2);
  assert.equal((await fetch(proof.manifest.pages[0].url)).status,200);
  const before=f.seen.length,next=await f.service.qualify('mangadex','mangadex-'+MID,f.origin);
  assert.equal(next.ready,true);assert.equal(f.seen.length,before,'A current proof must skip chapter and image work');
 }finally{await f.close();}
});
test('qualification cannot accept browser URLs or bypass content and configuration checks',async()=>{
 const f=await fixture();try{
  const base=f.origin+'/api/catalogue/readable/qualify?provider=mangadex&id=mangadex-'+MID;
  assert.equal((await fetch(base+'&url=https://evil.test')).status,400);
  assert.equal((await fetch(base,{method:'POST'})).status,405);
  assert.equal((await fetch(f.origin+'/api/catalogue/readable/qualify?provider=comix&id=comix-test')).status,409);
  assert.equal(f.seen.length,0);
  const disabled=await fixture({ticketKey:null});try{await assert.rejects(async()=>disabled.service.qualify('mangadex','mangadex-'+MID,disabled.origin),error=>error.status===503);assert.equal(disabled.seen.length,0);}finally{await disabled.close();}
 }finally{await f.close();}
});
test('pending qualification resumes a long chapter without downloading completed pages again',async()=>{
 const f=await fixture({pageCount:6,validation:{maxPages:2}});try{
  const first=await f.service.qualify('mangadex','mangadex-'+MID,f.origin);assert.equal(first.pending,true);assert.equal(first.validatedPages,2);assert.equal(first.manifest,undefined);
  const second=await f.service.qualify('mangadex','mangadex-'+MID,f.origin);assert.equal(second.pending,true);assert.equal(second.validatedPages,4);
  const final=await f.service.qualify('mangadex','mangadex-'+MID,f.origin);assert.equal(final.ready,true);assert.equal(final.validatedPages,6);
  assert.equal(f.seen.filter(path=>path.startsWith('/data/')).length,6);
 }finally{await f.close();}
});
test('concurrent cold qualifiers share the complete-chapter result',async()=>{
 const f=await fixture();try{
  const results=await Promise.all([f.service.qualify('mangadex','mangadex-'+MID,f.origin),f.service.qualify('mangadex','mangadex-'+MID,f.origin)]);
  assert.ok(results.every(proof=>proof.ready));assert.equal(f.seen.filter(path=>path.startsWith('/data/')).length,2);
 }finally{await f.close();}
});
test('independent hosted instances reuse Redis proofs and observe shared revocation',{skip:!process.env.TEST_REDIS_URL},async()=>{
 const redis=await redisFixture(process.env.TEST_REDIS_URL),prefix='kuro:qualification:test:'+randomUUID();let first,second;
 try{
  first=await fixture({coordinator:createRedisCoordinator(redis.url,'fixture-only-token',prefix)});
  second=await fixture({coordinator:createRedisCoordinator(redis.url,'fixture-only-token',prefix)});
  assert.equal((await first.service.qualify('mangadex','mangadex-'+MID,first.origin)).ready,true);
  assert.equal((await second.service.qualify('mangadex','mangadex-'+MID,second.origin)).ready,true);
  assert.equal(second.seen.filter(path=>path.startsWith('/data/')).length,0);
  await createReadableLedger(first.coordinator).revoke('mangadex-'+MID,'mangadex:'+CID);
  assert.equal((await second.service.qualify('mangadex','mangadex-'+MID,second.origin)).ready,true);
  assert.equal(second.seen.filter(path=>path.startsWith('/data/')).length,2);
 }finally{
  await first?.close();await second?.close();const keys=await redis.command(['KEYS',prefix+':*']);if(keys.length)await redis.command(['DEL',...keys]);await redis.close();
 }
});
test('a corrupt qualifying chapter returns no page tickets or readable proof',async()=>{
 const f=await fixture({corrupt:true});try{
  const proof=await f.service.qualify('mangadex','mangadex-'+MID,f.origin);
  assert.equal(proof.ready,false);assert.equal(proof.pending,true);assert.equal(proof.manifest,undefined);assert.equal(proof.pages,undefined);
  assert.equal((await f.service.readableSummary()).uniqueCount,0);
 }finally{await f.close();}
});
test('revoking a shared proof is observed despite warm metadata caches',async()=>{
 const f=await fixture();try{
  assert.equal((await f.service.qualify('mangadex','mangadex-'+MID,f.origin)).ready,true);
  const ledger=createReadableLedger(f.coordinator);await ledger.revoke('mangadex-'+MID,'mangadex:'+CID);
  // Requalification may perform a fresh full decode; it must not reuse the
  // revoked proof or the old decoded-page cache across that failure marker.
  const before=f.seen.filter(path=>path.startsWith('/data/')).length;
  const next=await f.service.qualify('mangadex','mangadex-'+MID,f.origin);
  assert.equal(next.ready,true);assert.equal(f.seen.filter(path=>path.startsWith('/data/')).length,before+2);
 }finally{await f.close();}
});
test('warm immutable results eliminate repeated coordination reads without extending expiry',async()=>{
 let now=0,reads=0,loads=0;const coordinator=createMemoryCoordinator(()=>now),get=coordinator.get.bind(coordinator);
 coordinator.get=async key=>{reads++;return get(key);};const cache=createCatalogueCache(coordinator,()=>now),load=async()=>({rating:'safe',sequence:++loads});
 const first=await cache.getOrLoad('rating',30,load),initial=reads;first.value.rating='unsafe mutation';
 for(let i=0;i<50;i++)assert.equal((await cache.getOrLoad('rating',30,load)).value.rating,'safe');
 assert.equal(reads,initial);assert.equal(loads,1);now=31;await cache.getOrLoad('rating',30,load);assert.equal(loads,2);assert.ok(reads>initial);
});

const browserProof=()=>{const now=Date.now();return {ready:true,pending:false,policyVersion:'strict-1',manga:{id:'mangadex-'+MID,sourceId:'mangadex',title:'Mountain Friends',contentApproval:{version:'strict-1',checkedAt:now}},chapterId:'mangadex:'+CID,validation:'complete-chapter',validatedPages:2,pageCount:2,checkedAt:now,expiresAt:now+21600000,asOf:now,inventoryRevision:1};};
test('the advertised browser fast path uses one request and rejects incomplete proofs',async()=>{
 const previous={fetch:globalThis.fetch,location:globalThis.location};globalThis.location={origin:'http://localhost'};
 try{
  const provider={id:'mangadex',adapter:'legacy',readable:true,qualificationVersion:1},core=createCatalogueCore([provider]);let calls=0;
  globalThis.fetch=async url=>{calls++;assert.ok(String(url).includes('/readable/qualify?'));return {ok:true,json:async()=>browserProof()};};
  const manga=browserProof().manga;assert.equal((await core.checkListing(manga)).ready,true);assert.equal(calls,1);
  const invalid=createCatalogueCore([provider]);globalThis.fetch=async()=>({ok:true,json:async()=>({...browserProof(),validatedPages:1})});
  assert.equal((await invalid.checkListing(manga)).ready,false);
  const pending=createCatalogueCore([provider]);globalThis.fetch=async()=>({ok:true,json:async()=>({ready:false,pending:true,policyVersion:'strict-1',validatedPages:1,pageCount:2})});
  assert.equal((await pending.checkListing(manga)).pending,true);assert.equal(pending.cached(manga.id),undefined);
 }finally{globalThis.fetch=previous.fetch;if(previous.location===undefined)delete globalThis.location;else globalThis.location=previous.location;}
});
