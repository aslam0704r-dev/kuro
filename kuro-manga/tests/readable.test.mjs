import test from 'node:test';import assert from 'node:assert/strict';import sharp from 'sharp';import {randomUUID} from 'node:crypto';
import {createCatalogueService} from '../server/catalogue/service.mjs';
import {createMemoryCoordinator,createRedisCoordinator} from '../server/catalogue/cache.mjs';
import {redisFixture} from './helpers/redis-fixture.mjs';
const MID='11111111-1111-4111-8111-111111111111',CID='22222222-2222-4222-8222-222222222222';
async function fixture({count=5,corrupt=-1,coordinator=createMemoryCoordinator(),clock=Date.now,seedInventory=[],pageDeadlineMs,chapterId=CID,groups=[]}={}) {
 const bytes=await sharp({create:{width:120,height:200,channels:3,background:'#246'}}).png().toBuffer(),seen=[];
 const fetcher=async input=>{const u=new URL(input);let value;
  if(u.pathname.startsWith('/manga/'))value={data:{id:MID,type:'manga',attributes:{title:{en:'Mountain Friends'},contentRating:'safe',tags:[],links:{mal:'123'}},relationships:[]}};
  else if(u.pathname.startsWith('/chapter/'))value={data:{id:chapterId,type:'chapter',attributes:{chapter:'1',title:'Beginning',pages:count},relationships:[{type:'manga',id:MID},...groups.map(id=>({type:'scanlation_group',id}))]}};
  else if(u.pathname.startsWith('/at-home/'))value={result:'ok',baseUrl:'https://uploads.mangadex.org',chapter:{hash:'proof',data:Array.from({length:count},(_,i)=>i+'.png')}};
  else {const index=Number(u.pathname.split('/').at(-1).split('.')[0]);seen.push(index);return {body:index===corrupt?Buffer.from('<html>gone</html>'):bytes,headers:{'content-type':'image/png'}};}
  return {body:Buffer.from(JSON.stringify(value)),headers:{'content-type':'application/json'}};
 };
 return {service:createCatalogueService({coordinator,ticketKey:Buffer.alloc(32,4),fetcher,clock,usage:'noncommercial',seedInventory,pageDeadlineMs}),seen,chapterId,breakPage:index=>{corrupt=index;}};
}
const pages=f=>f.service.call('mangadex','pages',{id:'mangadex:'+f.chapterId},'http://localhost').then(x=>x.value);
test('a corrupt middle page never qualifies a title or yields reading tickets',async()=>{
 const f=await fixture({count:3,corrupt:1});await assert.rejects(pages(f),/signature|decode|image/i);
 assert.equal((await f.service.readableSummary()).uniqueCount,0);assert.ok(f.seen.includes(1));
});
test('bounded requests resume all pages and publish exactly one complete proof',async()=>{
 const f=await fixture();const first=await pages(f);assert.equal(first.verified,false);assert.equal(first.pending,true);assert.equal(first.validatedPages,2);assert.deepEqual(first.pages,[]);
 assert.equal((await f.service.readableSummary()).uniqueCount,0);
 const second=await pages(f);assert.equal(second.verified,false);assert.equal(second.validatedPages,4);
 const third=await pages(f);assert.equal(third.verified,true);assert.equal(third.validation,'complete-chapter');assert.equal(third.validatedPages,5);assert.equal(third.pages.length,5);
 assert.equal((await f.service.readableSummary()).uniqueCount,1);assert.deepEqual([...f.seen].sort(),[0,1,2,3,4]);
 const again=await pages(f);assert.equal(again.verified,true);assert.equal((await f.service.readableSummary()).uniqueCount,1);assert.equal(f.seen.length,5);
});
test('completed remote inventory expires and does not include metadata-only sources',async()=>{
 let now=100000;const f=await fixture({count:1,clock:()=>now,coordinator:createMemoryCoordinator(()=>now)});await pages(f);assert.equal((await f.service.readableSummary()).uniqueCount,1);
 now+=6*3600000+1;assert.equal((await f.service.readableSummary()).uniqueCount,0);
 await assert.rejects(f.service.readableCheck('anilist','anilist-1'),/read|page|provider/i);
});
test('readable inventory is independent of ordinary cache eviction',async()=>{
 const coordinator=createMemoryCoordinator(),f=await fixture({count:1,coordinator});await pages(f);
 for(let i=0;i<2100;i++)await coordinator.set('cache-test:'+i,{i},60000);
 assert.equal((await f.service.readableSummary()).uniqueCount,1);
});
test('known failures cannot be resurrected by completed progress or cold-start seeds',async()=>{
 let now=100000;const coordinator=createMemoryCoordinator(()=>now),f=await fixture({count:1,coordinator,clock:()=>now});const manifest=await pages(f),seedInventory=await f.service.readableSnapshot(),ticket=new URL(manifest.pages[0].url).searchParams.get('ticket');
 now+=300001;f.breakPage(0);await assert.rejects(f.service.servePage(ticket));assert.equal((await f.service.readableSummary()).uniqueCount,0);
 await assert.rejects(pages(f));assert.equal((await f.service.readableSummary()).uniqueCount,0);
 const cold=await fixture({count:1,coordinator,clock:()=>now,seedInventory});assert.equal((await cold.service.readableSummary()).uniqueCount,0);
 now+=1;f.breakPage(-1);assert.equal((await pages(f)).verified,true);assert.equal((await f.service.readableSummary()).uniqueCount,1);
});
test('cold chapter initialization returns pending within its whole-request deadline',async()=>{
 const f=await fixture({pageDeadlineMs:80});const started=Date.now(),result=await pages(f);assert.equal(result.pending,true);assert.equal(result.verified,false);assert.equal(result.stage,'preparing');assert.deepEqual(result.pages,[]);assert.ok(Date.now()-started<1000);assert.equal((await f.service.readableSummary()).uniqueCount,0);
});
test('two valid chapters remain readable when the newest per-title counting proof is different',async()=>{
 let now=100000;const coordinator=createMemoryCoordinator(()=>now),a=await fixture({count:3,coordinator,clock:()=>now});await pages(a);const initial=await pages(a),oldTicket=new URL(initial.pages[0].url).searchParams.get('ticket');
 now=400001;a.breakPage(0);await assert.rejects(a.service.servePage(oldTicket));a.breakPage(-1);now=400002;assert.equal((await pages(a)).pending,true);
 now=401003;const b=await fixture({count:1,chapterId:'33333333-3333-4333-8333-333333333333',coordinator,clock:()=>now});assert.equal((await pages(b)).verified,true);
 now=402000;const freshA=await pages(a);assert.equal(freshA.verified,true);assert.equal((await a.service.readableSnapshot())[0].chapterId,'mangadex:'+b.chapterId);
 const ticket=new URL(freshA.pages[0].url).searchParams.get('ticket');assert.equal((await a.service.servePage(ticket)).mime,'image/png');assert.equal((await a.service.readableSummary()).uniqueCount,1);
});
test('deployment usage and scanlation opt-out restrictions also constrain the count',async()=>{
 const group='44444444-4444-4444-8444-444444444444',f=await fixture({count:1,groups:[group]});await pages(f);const seeds=await f.service.readableSnapshot();assert.deepEqual(seeds[0].groups,[group]);
 const commercial=createCatalogueService({coordinator:createMemoryCoordinator(),ticketKey:Buffer.alloc(32,4),usage:'commercial',seedInventory:seeds});assert.equal((await commercial.readableSummary()).uniqueCount,0);await assert.rejects(commercial.readableCheck('mangadex','mangadex-'+MID),/non-commercial/);
 const removed=createCatalogueService({coordinator:createMemoryCoordinator(),ticketKey:Buffer.alloc(32,4),seedInventory:seeds,excludedGroups:[group]});assert.equal((await removed.readableSummary()).uniqueCount,0);
 const unknown=createCatalogueService({coordinator:createMemoryCoordinator(),ticketKey:Buffer.alloc(32,4),seedInventory:seeds.map(({groups,...row})=>row),excludedGroups:[group]});assert.equal((await unknown.readableSummary()).uniqueCount,0);
 const unconfigured=createCatalogueService({coordinator:createMemoryCoordinator(),ticketKey:null,seedInventory:seeds});assert.equal((await unconfigured.readableSummary()).uniqueCount,0);assert.equal((await unconfigured.readableSummary()).readingConfigured,false);await assert.rejects(unconfigured.readableCheck('mangadex','mangadex-'+MID),/configure|key/i);
});
test('shared Redis instances see the same complete proof and count',{skip:!process.env.TEST_REDIS_URL},async()=>{
 const fixtureRedis=await redisFixture(process.env.TEST_REDIS_URL),prefix='kuro:readable:test:'+randomUUID();
 try {const a=await fixture({count:3,coordinator:createRedisCoordinator(fixtureRedis.url,'fixture-only-token',prefix)}),b=await fixture({count:3,coordinator:createRedisCoordinator(fixtureRedis.url,'fixture-only-token',prefix)});
  assert.equal((await pages(a)).pending,true);assert.equal((await pages(b)).verified,true);assert.equal((await a.service.readableSummary()).uniqueCount,1);assert.equal((await b.service.readableSummary()).uniqueCount,1);
 } finally {const keys=await fixtureRedis.command(['KEYS',prefix+':*']);if(keys.length)await fixtureRedis.command(['DEL',...keys]);await fixtureRedis.close();}
});
