import test from 'node:test';
import assert from 'node:assert/strict';
import {createCatalogueService} from '../server/catalogue/service.mjs';
import {createMemoryCoordinator} from '../server/catalogue/cache.mjs';
import {refreshProviderDirectory} from '../dist/provider-directory.js';
import {createMetadataAdapter,mapMetadata} from '../server/catalogue/adapters/metadata.mjs';

test('hosted directory distinguishes missing code, unsupported ratings and usable readers without probing upstream',async()=>{
 let pulls=0;const service=createCatalogueService({coordinator:createMemoryCoordinator(),ticketKey:Buffer.alloc(32,7),usage:'noncommercial',fetcher:async()=>{pulls++;throw new Error('Unexpected upstream');}});
 const data=await service.directory(),find=id=>data.providers.find(p=>p.id===id);
 assert.equal(find('comix').connection.reason,'missing-connection');assert.equal(find('guya').connection.reason,'rating-unsupported');
 assert.equal(find('mangadex').connection.reading,true);assert.equal(find('anilist').connection.usable,true);assert.equal(find('anilist').connection.reading,false);
 assert.deepEqual(data.connections,{readers:1,metadata:1,unavailable:1234});assert.equal(pulls,0);
});
test('a hosted reader without a signing key is unavailable, while metadata stays usable',async()=>{
 const service=createCatalogueService({coordinator:createMemoryCoordinator(),ticketKey:null,usage:'noncommercial'}),data=await service.directory();
 const md=data.providers.find(p=>p.id==='mangadex');assert.equal(md.available,false);assert.equal(md.connection.reason,'setup-required');assert.equal(data.connections.readers,0);assert.equal(data.connections.metadata,1);
});
test('commercial usage cannot advertise a MangaDex reading connection',async()=>{
 const service=createCatalogueService({coordinator:createMemoryCoordinator(),ticketKey:Buffer.alloc(32,7),usage:'commercial'}),data=await service.directory();
 assert.equal(data.providers.find(p=>p.id==='mangadex').connection.usable,false);assert.equal(data.connections.readers,0);
});
test('directory refresh is bounded and updates status without fetching feeds or discarding reading proofs',async()=>{
 const data={providers:[{id:'mangadex',available:true}]},calls=[];
 const bridge={registry:{old:true},refresh:()=>{throw new Error('Expensive feed refresh must not run');},core:{preferences:value=>{calls.push(value);bridge.core.registry=value;}}};
 const result=await refreshProviderDirectory(bridge,async(path,options)=>{assert.equal(path,'/api/catalogue/providers');assert.equal(options.cache,'no-store');assert.equal(options.credentials,'same-origin');assert.ok(options.signal instanceof AbortSignal);return {ok:true,json:async()=>data};});
 assert.equal(result,data);assert.equal(bridge.registry,data);assert.deepEqual(calls,[data]);
});
test('failed and malformed directory refreshes preserve source choices and the prior registry',async()=>{
 for(const response of [{ok:false},{ok:true,json:async()=>({providers:[]})},{ok:true,json:async()=>({providers:[null]})}]){
  const before={providers:[{id:'mangadex'}]},bridge={registry:before,core:{preferences:()=>{throw new Error('Preferences must remain unchanged');}}};
  await assert.rejects(refreshProviderDirectory(bridge,async()=>response),/refresh|directory/);assert.equal(bridge.registry,before);
 }
});
test('MangaBaka v2 metadata uses current covers and multilingual titles without inventing reading pages',async()=>{
 const raw={id:1,titles:[{language:'ko',is_primary:true,title:'Original'},{language:'en',is_primary:true,title:'DICE'}],cover:{x250:'https://cdn.mangabaka.dev/imgproxy/plain/x250@1/image'},authors:['Author'],rating:70,source:{my_anime_list:{id:147443}},tags:[{is_genre:true,name:'Adventure'}]};
 const row=mapMetadata('mangabaka',raw);assert.equal(row.title,'DICE');assert.equal(row.coverUrl,raw.cover.x250);assert.deepEqual(row.genres,['Adventure']);assert.equal(row.catalogueOnly,true);assert.ok(row.identityKeys.includes('mal:147443'));
 const urls=[],adapter=createMetadataAdapter({id:'mangabaka'},async url=>{urls.push(new URL(url));return {data:[raw],pagination:{next:null}};});
 const result=await adapter.call('search',{q:'dice',page:1});assert.equal(result.items[0].title,'DICE');assert.equal(urls[0].pathname,'/v2/series/search');assert.equal(urls[0].searchParams.get('content_rating'),'safe');assert.equal(result.items[0].contentApproval,undefined);
});
