import test from 'node:test';import assert from 'node:assert/strict';
import {createCatalogueCore} from '../client/catalogue-core.mjs';import {metroProviders} from './helpers/metro-provider-harness.mjs';
test('an obsolete pending readiness success cannot overwrite a fresh failed check',async()=>{
 const previous=globalThis.location;globalThis.location={origin:'http://localhost'};
 try{const runtime=metroProviders(),manager=runtime(789).sourceManager;let resolve,calls=0;
  manager.register({id:'mangadex',name:'MangaDex',capabilities:{readable:true,languages:['en']}});
  const core=createCatalogueCore([{id:'mangadex',adapter:'legacy',readable:true}]);core.initialize(789,{sourceManager:manager},runtime);
  // Isolate the readiness epoch race from the separately tested production
  // content verifier. This stub exists only in this in-process unit test.
  core.safety.verify=async()=>({allowed:true});const adapter=manager.require('mangadex');adapter.getChapterList=async()=>[{id:'mangadex:11111111-1111-4111-8111-111111111111'}];adapter.getChapterPages=async()=>{calls++;if(calls===1)return new Promise(r=>{resolve=r;});throw new Error('Image could not decode');};
  const row={id:'mangadex-22222222-2222-4222-8222-222222222222',sourceId:'mangadex'},old=core.check(row);for(let i=0;!resolve&&i<200;i++)await new Promise(r=>setTimeout(r,1));assert.ok(resolve);core.notify();
  const current=await core.check(row);assert.equal(current.ready,false);resolve({verified:true,pages:[{url:'https://example.test/page'}]});
  assert.equal((await old).obsolete,true);assert.equal(core.cached(row.id).ready,false);assert.equal(calls,2);
 }finally{if(previous===undefined)delete globalThis.location;else globalThis.location=previous;}
});
