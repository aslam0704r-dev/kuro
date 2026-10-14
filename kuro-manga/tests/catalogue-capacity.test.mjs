import test from 'node:test';import assert from 'node:assert/strict';
import {createMemoryCoordinator,createRedisCoordinator} from '../server/catalogue/cache.mjs';
import {redisFixture} from './helpers/redis-fixture.mjs';import {randomUUID} from 'node:crypto';
test('local catalogue capacity evicts public data while preserving exhausted budgets',async()=>{
 const c=createMemoryCoordinator();await c.budget('preserved',1,60000);
 for(let i=0;i<2100;i++)await c.set('data:'+i,{i},60000);
 assert.equal(await c.budget('preserved',1,60000),false);assert.deepEqual(await c.get('data:2099'),{i:2099});assert.equal(await c.get('data:0'),null);
 assert.deepEqual(await c.getMany(['data:2099','missing']),[{i:2099},null]);
});
test('shared cache evicts old public results without resetting source counters',{skip:!process.env.TEST_REDIS_URL},async()=>{
 const f=await redisFixture(process.env.TEST_REDIS_URL),prefix='kuro:catalogue:test:'+randomUUID(),c=createRedisCoordinator(f.url,'fixture-only-token',prefix);
 try{await c.budget('preserved',1,60000);for(let i=0;i<1002;i++)await c.set('data:'+i,{i},60000);
 assert.equal(await c.budget('preserved',1,60000),false);assert.equal(await c.get('data:0'),null);
 assert.deepEqual(await c.getMany(['data:1001','missing']),[{i:1001},null]);
 assert.equal(await f.command(['ZCARD',prefix+':cache-entries']),1000);
 }finally{const keys=await f.command(['KEYS',prefix+':*']);if(keys.length)await f.command(['DEL',...keys]);await f.close();}
});
