import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryCoordinator, createRedisCoordinator, createCatalogueCache } from '../server/catalogue/cache.mjs';
import { redisFixture } from './helpers/redis-fixture.mjs';
import { randomUUID } from 'node:crypto';

test('fresh cache coalesces identical reads but refreshes expired data',async()=>{
 let now=0,calls=0;const cache=createCatalogueCache(createMemoryCoordinator(()=>now),()=>now);
 const loader=async()=>{calls++;return ['chapter '+calls];};
 const values=await Promise.all([cache.getOrLoad('a',100,loader),cache.getOrLoad('a',100,loader)]);
 assert.equal(calls,1); assert.deepEqual(values[0].value,['chapter 1']);
 now=101;assert.deepEqual((await cache.getOrLoad('a',100,loader)).value,['chapter 2']);
});
test('atomic budgets reject the excess request and reset after the window',async()=>{
 let now=0;const store=createMemoryCoordinator(()=>now);
 assert.equal(await store.budget('provider',2,100),true);assert.equal(await store.budget('provider',2,100),true);
 assert.equal(await store.budget('provider',2,100),false);now=101;assert.equal(await store.budget('provider',2,100),true);
});
test('failed cache loads are backed off instead of stored as an empty success',async()=>{
 let calls=0;const cache=createCatalogueCache(createMemoryCoordinator());
 const failure=async()=>{calls++;throw Object.assign(new Error('Source rate limit reached'),{status:429,retryAfter:120});};
 await assert.rejects(cache.getOrLoad('a',1000,failure),/rate limit/);await assert.rejects(cache.getOrLoad('a',1000,failure),/rate limit/);assert.equal(calls,1);
});
test('Redis coordinates cache and budgets between independent server instances',{skip:!process.env.TEST_REDIS_URL},async()=>{
 const fixture=await redisFixture(process.env.TEST_REDIS_URL);const prefix='kuro:catalogue:test:'+randomUUID();
 try{const a=createRedisCoordinator(fixture.url,'fixture-only-token',prefix),b=createRedisCoordinator(fixture.url,'fixture-only-token',prefix);
  await a.set('result',{value:['ok']},2000);assert.deepEqual(await b.get('result'),{value:['ok']});
  const allowed=await Promise.all(Array.from({length:12},(_,i)=>(i%2?a:b).budget('provider',5,1000)));assert.equal(allowed.filter(Boolean).length,5);
  let calls=0;const ca=createCatalogueCache(a),cb=createCatalogueCache(b);const load=async()=>{calls++;await new Promise(r=>setTimeout(r,50));return [42];};
  const values=await Promise.all([ca.getOrLoad('shared',1000,load),cb.getOrLoad('shared',1000,load)]);assert.equal(calls,1);assert.deepEqual(values[0].value,[42]);assert.deepEqual(values[1].value,[42]);
 }finally{const keys=await fixture.command(['KEYS',prefix+':*']);if(keys.length)await fixture.command(['DEL',...keys]);await fixture.close();}
});
