import test from 'node:test';import assert from 'node:assert/strict';
test('a hosted deadline waits for registered integrity cleanup with an independent signal',async()=>{
 const {withCatalogueDeadline,catalogueSignal,catalogueCleanup}=await import('../server/catalogue/deadline.mjs');
 assert.equal(typeof catalogueCleanup,'function');let cleaned=false,parent;
 await assert.rejects(withCatalogueDeadline(async()=>{parent=catalogueSignal();catalogueCleanup(async()=>{assert.notEqual(catalogueSignal(),parent);await new Promise(resolve=>setTimeout(resolve,30));assert.equal(catalogueSignal().aborted,false);cleaned=true;});await new Promise(resolve=>parent.addEventListener('abort',resolve,{once:true}));},5),/deadline/);
 assert.equal(cleaned,true);
});
test('catalogue deadlines abort public work without leaking into sibling calls',async()=>{
 const {withCatalogueDeadline,catalogueSignal}=await import('../server/catalogue/deadline.mjs');let aborted=false;
 assert.equal(catalogueSignal(),undefined);
 await assert.rejects(withCatalogueDeadline(async()=>{const signal=catalogueSignal();await new Promise(resolve=>signal.addEventListener('abort',()=>{aborted=true;resolve();},{once:true}));},50),/deadline/i);
 assert.equal(aborted,true);assert.equal(catalogueSignal(),undefined);
 assert.equal(await withCatalogueDeadline(async()=>7,100),7);
});
test('refresh advances selected batch before its provider work and obeys a whole-run deadline',async()=>{
 const {createCatalogueService}=await import('../server/catalogue/service.mjs');const {createMemoryCoordinator}=await import('../server/catalogue/cache.mjs');let scheduled=0;
 const c=createMemoryCoordinator(),set=c.set;c.set=async function(key,value,ttl){if(key==='refresh-cursor')scheduled++;return set.call(c,key,value,ttl);};
 const fetcher=async(_url,_policy,options)=>{assert.ok(scheduled>0);await new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Object.assign(new Error('Deadline stopped source'),{status:503})),{once:true}));};
 const service=createCatalogueService({coordinator:c,ticketKey:Buffer.alloc(32,5),fetcher});const start=Date.now(),result=await service.refresh({deadlineMs:100});
 assert.equal(result.deadlineExceeded,true);assert.ok(Date.now()-start<1500);assert.equal(scheduled,1);assert.equal(result.totalSources,1);
});
test('a reader request does not inherit cancellation from an identical background cache load',async()=>{
 const {withCatalogueDeadline,catalogueSignal}=await import('../server/catalogue/deadline.mjs');const {createCatalogueCache,createMemoryCoordinator}=await import('../server/catalogue/cache.mjs');
 const cache=createCatalogueCache(createMemoryCoordinator());let started;
 const ready=new Promise(resolve=>{started=resolve;});
 const background=withCatalogueDeadline(()=>cache.getOrLoad('same',1000,async()=>{const signal=catalogueSignal();started();await new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Object.assign(new Error('Cancelled background'),{status:503})),{once:true}));}),80).catch(()=>{});
 await ready;const reader=cache.getOrLoad('same',1000,async()=>({value:'reader success'}));await background;assert.deepEqual((await reader).value,{value:'reader success'});
});
test('cancelled shared catalogue work releases its lock with an independent bounded cleanup signal',async()=>{
 const {withCatalogueDeadline,catalogueSignal}=await import('../server/catalogue/deadline.mjs');const {createRedisCoordinator}=await import('../server/catalogue/cache.mjs');
 const original=globalThis.fetch,locks=new Set();globalThis.fetch=async(_url,options)=>{const cmd=JSON.parse(options.body);if(options.signal.aborted)throw options.signal.reason;
  let result;if(cmd[0]==='SET'){locks.add(cmd[1]);result='OK';}else if(cmd[0]==='EVAL'){locks.delete(cmd[3]);result=1;}
  return {ok:true,json:async()=>({result})};};
 try{const c=createRedisCoordinator('https://redis.fixture.test/','fixture-only-token','kuro:test:cleanup');await assert.rejects(withCatalogueDeadline(()=>c.lock('held',()=>new Promise((_,reject)=>catalogueSignal().addEventListener('abort',()=>reject(Object.assign(new Error('Cancelled'),{status:503})),{once:true}))),50),/deadline/);
  await new Promise(resolve=>setTimeout(resolve,10));assert.equal(locks.size,0);
 }finally{globalThis.fetch=original;}
});
