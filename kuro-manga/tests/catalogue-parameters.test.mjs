import test from 'node:test';import assert from 'node:assert/strict';import {canonicalParameters} from '../server/catalogue/parameters.mjs';
test('ignored parameters cannot multiply the cache keys for a single feed or chapter',()=>{
 assert.deepEqual(canonicalParameters('latest',{page:1,q:'random',id:'random',filters:{random:42}}),{page:1});
 assert.deepEqual(canonicalParameters('pages',{id:'guya:H~1~7',q:'random',page:99}),{id:'guya:H~1~7'});
});
test('equivalent supported filters normalize and malformed filters fail before adapters',()=>{
 assert.deepEqual(canonicalParameters('search',{q:' Hero ',filters:{genres:['Action','Action'],status:['ONGOING','COMPLETED'],ignored:'a'}}),{page:1,q:'Hero',filters:{genres:['Action'],status:['COMPLETED','ONGOING']}});
 for(const filters of [{genres:[{}]},{status:['made up']},{kind:'novel'},{sort:'SQL'},[]])assert.throws(()=>canonicalParameters('search',{q:'a',filters}),/filter/i);
});
