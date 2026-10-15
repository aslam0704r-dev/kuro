import test,{beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {createCatalogueCore} from '../client/catalogue-core.mjs';
import {metroProviders} from './helpers/metro-provider-harness.mjs';
const original={location:globalThis.location,fetch:globalThis.fetch};
const MID='11111111-1111-4111-8111-111111111111',CID='22222222-2222-4222-8222-222222222222';
const row={id:'mangadex-'+MID,sourceId:'mangadex',title:'Mountain Friends'};
beforeEach(()=>{globalThis.location={origin:'http://localhost'};});
afterEach(()=>{globalThis.fetch=original.fetch;if(original.location===undefined)delete globalThis.location;else globalThis.location=original.location;});
function setup(pageReply){
 const runtime=metroProviders(),manager=runtime(789).sourceManager;manager.register({id:'mangadex',name:'MangaDex',capabilities:{readable:true,languages:['en']}});
 const core=createCatalogueCore([{id:'mangadex',adapter:'legacy',readable:true}]);core.initialize(789,{sourceManager:manager},runtime);core.safety.verify=async()=>({allowed:true});
 manager.require('mangadex').getChapterList=async()=>[{id:'mangadex:'+CID,pages:3}];let calls=0;
 globalThis.fetch=async url=>String(url).includes('/readable/check')?{ok:true,json:async()=>({ready:false,asOf:Date.now(),inventoryRevision:1})}:pageReply(++calls);
 assert.equal(typeof core.checkListing,'function','listing checks must yield after each hosted step');
 return {core,calls:()=>calls,manager};
}
const reply=value=>({ok:true,json:async()=>({result:value})});
const pending=()=>({chapterId:'mangadex:'+CID,verified:false,pending:true,validation:'complete-chapter',contentApproval:{version:'strict-1',mangaId:row.id},validatedPages:2,pageCount:3,pages:[]});
const complete=()=>({...pending(),verified:true,pending:false,validatedPages:3,expiresAt:Date.now()+3600000,readabilityAsOf:Date.now(),inventoryRevision:2,pages:[0,1,2].map(i=>({index:i,url:'http://localhost/api/catalogue/page?ticket=fixture'+i}))});
test('a short complete chapter can qualify in its first turn without waiting for every title metadata request',async()=>{
 const {core,calls}=setup(()=>reply(complete()));assert.equal((await core.checkListing(row)).ready,true);assert.equal(calls(),1);
});
test('one pending batch yields without poisoning the negative readiness cache',async()=>{
 const {core,calls}=setup(()=>reply(pending()));assert.equal((await core.checkListing(row)).pending,true);assert.equal(calls(),1);
 assert.equal((await core.checkListing(row)).pending,true);assert.equal(calls(),2);assert.equal(core.cached(row.id),undefined);
});
test('a later listing step completes the same chapter and shares its canonical readiness',async()=>{
 const {core,calls}=setup(n=>reply(n===1?pending():complete()));await core.checkListing(row);await core.checkListing(row);assert.equal((await core.checkListing(row)).ready,true);assert.equal(calls(),2);assert.equal(core.cached(row.id).ready,true);
});
test('rate-limit retry dates survive the HTTP boundary and prevent premature retry',async()=>{
 const {core,calls}=setup(()=>({ok:false,status:429,headers:{get:()=> '60'},json:async()=>({error:'Source rate limit reached'})}));
 await core.checkListing(row);const first=await core.checkListing(row);assert.equal(first.pending,true);assert.ok(first.retryAt>=Date.now()+59000);const again=await core.checkListing(row);assert.equal(again.retryAt,first.retryAt);assert.equal(calls(),1);assert.equal(core.cached(row.id),undefined);
});
test('a complete manifest bound to another chapter cannot qualify this title',async()=>{
 const {core}=setup(()=>reply({...complete(),chapterId:'mangadex:33333333-3333-4333-8333-333333333333'}));await core.checkListing(row);assert.equal((await core.checkListing(row)).ready,false);assert.equal(core.cached(row.id).ready,false);
});
test('an incomplete manifest claiming verification still cannot qualify',async()=>{
 const {core}=setup(()=>reply({...complete(),validatedPages:2}));await core.checkListing(row);assert.equal((await core.checkListing(row)).ready,false);assert.equal(core.cached(row.id).ready,false);
});
test('parallel watchers share one in-flight listing step',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});const {core,calls}=setup(async()=>{await gate;return reply(pending());});
 const a=core.checkListing(row),b=core.checkListing(row);for(let i=0;i<4&&!calls();i++)await new Promise(resolve=>setImmediate(resolve));assert.equal(calls(),1);release();assert.equal((await a).pending,true);assert.equal((await b).pending,true);
});
test('the initial readiness check respects an HTTP-date Retry-After',async()=>{
 const {core}=setup(()=>reply(complete())),until=Date.now()+300000;globalThis.fetch=async()=>({ok:false,status:429,headers:{get:()=>new Date(until).toUTCString()},json:async()=>({error:'Source rate limit reached'})});const result=await core.checkListing(row);assert.equal(result.pending,true);assert.ok(result.retryAt>=until-1000);
});
test('a non-JSON rate-limit body retains the page retry status',async()=>{
 const {core}=setup(()=>({ok:false,status:429,headers:{get:()=> '60'},json:async()=>{throw new SyntaxError('HTML rate-limit body');}}));const result=await core.checkListing(row);assert.equal(result.pending,true);assert.ok(result.retryAt>=Date.now()+59000);assert.equal(core.cached(row.id),undefined);
});
test('a non-JSON readiness rate-limit body does not classify a title as unreadable',async()=>{
 const {core}=setup(()=>reply(complete()));globalThis.fetch=async()=>({ok:false,status:429,headers:{get:()=> '60'},json:async()=>{throw new SyntaxError('HTML rate-limit body');}});const result=await core.checkListing(row);assert.equal(result.pending,true);assert.ok(result.retryAt>=Date.now()+59000);assert.equal(core.cached(row.id),undefined);
});
test('a temporary network failure keeps the pending chapter available for retry',async()=>{
 const {core}=setup(n=>{if(n===1)return reply(pending());throw new TypeError('fetch failed');});await core.checkListing(row);const result=await core.checkListing(row);assert.equal(result.pending,true);assert.ok(result.retryAt>Date.now());assert.equal(core.cached(row.id),undefined);
});
test('a page timeout keeps progress pending rather than recording an unreadable title',async()=>{
 const {core}=setup(n=>{if(n===1)return reply(pending());throw new DOMException('Aborted','AbortError');});await core.checkListing(row);const result=await core.checkListing(row);assert.equal(result.pending,true);assert.ok(result.retryAt>Date.now());assert.equal(core.cached(row.id),undefined);
});

test('a native readiness timeout remains pending without a negative cache entry',async()=>{
 const {core}=setup(()=>reply(complete()));globalThis.fetch=async()=>{throw new DOMException('The operation was aborted due to timeout','TimeoutError');};const result=await core.checkListing(row);assert.equal(result.pending,true);assert.ok(result.retryAt>Date.now());assert.equal(core.cached(row.id),undefined);
});

test('concurrent rate-limit replies cannot shorten the active source retry window',async()=>{
 const {core}=setup(()=>reply(complete())),replies=[];globalThis.fetch=async()=>new Promise(resolve=>replies.push(resolve));const first=core.checkListing(row),second=core.checkListing({...row,id:'mangadex-33333333-3333-4333-8333-333333333333'});while(replies.length<2)await new Promise(resolve=>setImmediate(resolve));
 const limited=seconds=>({ok:false,status:429,headers:{get:()=>String(seconds)},json:async()=>({error:'Source rate limit reached'})});replies[0](limited(300));const long=await first;replies[1](limited(30));await second;const third=await core.checkListing({...row,id:'mangadex-44444444-4444-4444-8444-444444444444'});assert.equal(third.pending,true);assert.ok(third.retryAt>=long.retryAt);
});

test('legacy adapter error wrapping cannot turn a shared metadata cooldown into an unreadable title',async()=>{
 const {core,manager}=setup(()=>reply(complete())),http=core.initialize(861,{},()=>({resolveFetchUrl:url=>url}));globalThis.fetch=async url=>String(url).includes('/readable/check')?{ok:true,json:async()=>({ready:false,asOf:Date.now(),inventoryRevision:1})}:{ok:false,status:429,headers:{get:()=> '60'}};
 manager.require('mangadex').getChapterList=async()=>{try{return await http.requestJson('https://api.mangadex.org/manga/'+MID+'/feed');}catch(error){throw new Error('[mangadex] Failed to load chapters — '+error.message);}};
 const result=await core.checkListing(row);assert.equal(result.pending,true);assert.ok(result.retryAt>=Date.now()+59000);assert.equal(core.cached(row.id),undefined);
});
