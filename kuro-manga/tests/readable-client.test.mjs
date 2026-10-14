import test from 'node:test';import assert from 'node:assert/strict';
import {completeManifest,createCatalogueCore} from '../client/catalogue-core.mjs';
import {metroProviders} from './helpers/metro-provider-harness.mjs';
test('first/last samples and partial manifests never qualify in the browser',()=>{
 assert.equal(completeManifest({verified:true,pages:[{url:'a'},{url:'b'}],sampledPages:2}),false);
 assert.equal(completeManifest({verified:true,validation:'complete-chapter',validatedPages:2,pageCount:3,pages:[{},{},{}]}),false);
 assert.equal(completeManifest({verified:false,pending:true,validation:'complete-chapter',validatedPages:2,pageCount:3,pages:[]}),false);
 assert.equal(completeManifest({verified:true,validation:'complete-chapter',validatedPages:3,pageCount:3,pages:[{},{},{}]}),true);
 assert.equal(completeManifest({verified:true,validation:'device',pages:[{}]},true),true);
});
test('the compiled edition-grouping setting cannot turn duplicate cards back on',()=>{
 const core=createCatalogueCore([]),api={};core.initialize(794,api,()=>{});const rows=[{id:'a',title:'Hero',sourceId:'a',identityKeys:['mal:1']},{id:'b',title:'Hero',sourceId:'b',identityKeys:['mal:1']}];assert.equal(api.groupEditions(rows,false).length,1);
});
test('Ready to read off still hides rows without a complete proof',()=>{
 const previous=globalThis.location;globalThis.location={origin:'http://localhost'};
 try {const core=createCatalogueCore([]),api={},React={useRef:value=>({current:value}),useState:value=>[value,()=>{}],useEffect:()=>{},useSyncExternalStore:()=>0,useCallback:fn=>fn,useMemo:fn=>fn()};
  core.initialize(1388,api,id=>id===15?React:{useFocusEffect:()=>{}});
  const row={id:'mangadex-11111111-1111-4111-8111-111111111111',sourceId:'mangadex',title:'Hero',contentApproval:{version:'strict-1',checkedAt:Date.now()}};core.safety.remember(row);
  const result=api.useReadyCollection([row],false);assert.deepEqual(result.items,[]);assert.equal(result.pending,1);
 }finally{if(previous===undefined)delete globalThis.location;else globalThis.location=previous;}
});
test('a failed newest chapter does not hide a title with another complete chapter',async()=>{
 const previous=globalThis.location;globalThis.location={origin:'http://localhost'};
 try {const runtime=metroProviders(),manager=runtime(789).sourceManager;manager.register({id:'mangadex',name:'MangaDex',capabilities:{readable:true}});
  const core=createCatalogueCore([{id:'mangadex',adapter:'legacy',readable:true}]);core.initialize(789,{sourceManager:manager},runtime);core.safety.verify=async()=>({allowed:true});
  const adapter=manager.require('mangadex'),checked=[];adapter.getChapterList=async()=>[{id:'broken'},{id:'working'}];adapter.getChapterPages=async id=>{checked.push(id);if(id==='broken')throw new Error('Corrupt image');return {verified:true,validation:'complete-chapter',validatedPages:2,pageCount:2,pages:[{},{}]};};
  assert.equal((await core.check({id:'mangadex-11111111-1111-4111-8111-111111111111',sourceId:'mangadex'})).ready,true);assert.deepEqual(checked,['broken','working']);
 }finally{if(previous===undefined)delete globalThis.location;else globalThis.location=previous;}
});
test('browser readiness expires with its server proof rather than two minutes later',async()=>{
 const old={now:Date.now,fetch:globalThis.fetch,location:globalThis.location};let now=1800000000000,calls=0;Date.now=()=>now;globalThis.location={origin:'http://localhost'};
 try {globalThis.fetch=async()=>({ok:true,json:async()=>{calls++;return {ready:calls===1,validation:'complete-chapter',validatedPages:1,pageCount:1,expiresAt:1800000000500};}});
  const runtime=metroProviders(),manager=runtime(789).sourceManager;manager.register({id:'mangadex',name:'MangaDex',capabilities:{readable:true}});const core=createCatalogueCore([{id:'mangadex',adapter:'legacy',readable:true}]);core.initialize(789,{sourceManager:manager},runtime);core.safety.verify=async()=>({allowed:true});manager.require('mangadex').getChapterList=async()=>[];
  const manga={id:'mangadex-11111111-1111-4111-8111-111111111111',sourceId:'mangadex'};assert.equal((await core.check(manga)).ready,true);now+=501;assert.equal(core.cached(manga.id),undefined);assert.equal((await core.check(manga)).ready,false);assert.equal(calls,2);
 }finally{Date.now=old.now;globalThis.fetch=old.fetch;if(old.location===undefined)delete globalThis.location;else globalThis.location=old.location;}
});
