import test from 'node:test';import assert from 'node:assert/strict';import { EventEmitter } from 'node:events';import { Readable } from 'node:stream';import sharp from 'sharp';
import { fetchPublic } from '../server/catalogue/transport.mjs';import { createCatalogueService } from '../server/catalogue/service.mjs';import { createMemoryCoordinator } from '../server/catalogue/cache.mjs';
import { parseMadaraPages } from '../server/catalogue/adapters/madara.mjs';import { groupSeries } from '../dist/catalogue-model.mjs';import { createMetadataAdapter } from '../server/catalogue/adapters/metadata.mjs';

test('malformed asynchronous redirects reject the request without throwing out of the callback',async()=>{
 const request=(_url,_options,callback)=>{const req=new EventEmitter();req.destroy=()=>{};req.end=()=>queueMicrotask(()=>{const res=Readable.from([]);res.statusCode=302;res.headers={location:'http://['};callback(res);});return req;};
 await assert.rejects(fetchPublic('https://source.test/',{hosts:['source.test']},{lookup:async()=>[{address:'8.8.8.8',family:4}],request}),/redirect/);
});
test('a bad middle page fails the entire manifest rather than deleting part of the chapter',()=>{
 assert.throws(()=>parseMadaraPages('<html><div class="reading-content"><img src="https://source.test/1.png"><img src="http://source.test/2.png"><img src="https://source.test/3.png"></div></html>',{id:'source',website:'https://source.test/'},'source:a'),/page URL/i);
});
test('shared generic aliases cannot group distinct explicit parts or volumes',()=>{
 for(const label of ['Part','Volume','Season'])assert.equal(groupSeries([{id:'a-1',sourceId:'a',title:'Hero '+label+' 1',altTitles:['Hero'],author:'A'},
 {id:'b-2',sourceId:'b',title:'Hero '+label+' 2',altTitles:['Hero'],author:'A'}]).length,2);
});
test('metadata respects explicit status/genre filters and reports local page filtering',async()=>{
 const adapter=createMetadataAdapter({id:'jikan'},async()=>({data:[{mal_id:1,title:'Hero',status:'Publishing',genres:[{name:'Action'}],authors:[]}],pagination:{has_next_page:true}}));
 const value=await adapter.call('search',{q:'Hero',page:1,filters:{status:['COMPLETED'],genres:['Romance']}});assert.equal(value.items.length,0);assert.ok(value.notice);
});
test('canonical MangaDex pages ignore browser URLs and tickets enforce later group removal',async()=>{
 const bytes=await sharp({create:{width:200,height:300,channels:3,background:'#334455'}}).png().toBuffer();const chapter='11111111-1111-4111-8111-111111111111',group='22222222-2222-4222-8222-222222222222';
 const fetcher=async url=>url.includes('/at-home/')?{body:Buffer.from(JSON.stringify({result:'ok',baseUrl:'https://uploads.mangadex.org',chapter:{hash:'publichash',data:['1.png'],dataSaver:[]}})),headers:{'content-type':'application/json'}}:
  url.includes('/chapter/')?{body:Buffer.from(JSON.stringify({data:{id:chapter,type:'chapter',attributes:{pages:1},relationships:[{type:'manga',id:'33333333-3333-4333-8333-333333333333'},{type:'scanlation_group',id:group,attributes:{name:'Team'}}]}})),headers:{'content-type':'application/json'}}:
  url.includes('/manga/')?{body:Buffer.from(JSON.stringify({data:{id:'33333333-3333-4333-8333-333333333333',type:'manga',attributes:{title:{en:'Hero'},contentRating:'safe',tags:[]},relationships:[]}})),headers:{'content-type':'application/json'}}:{body:bytes,headers:{'content-type':'image/png'}};
 const coordinator=createMemoryCoordinator(),ticketKey=Buffer.alloc(32,6),original=createCatalogueService({coordinator,ticketKey,usage:'noncommercial',fetcher});
 const value=await original.prepare('mangadex',{chapterId:'mangadex:'+chapter,pages:[{url:'https://uploads.mangadex.org/unrelated.png'}]},'http://localhost');
 const ticket=new URL(value.pages[0].url).searchParams.get('ticket');const encoded=JSON.parse(Buffer.from(ticket.split('.')[0],'base64url').toString());
 assert.equal(encoded.u,'https://uploads.mangadex.org/data/publichash/1.png');assert.equal(encoded.c,'mangadex:'+chapter);assert.deepEqual(encoded.g,[group]);
 const updated=createCatalogueService({coordinator,ticketKey,usage:'noncommercial',fetcher,excludedGroups:[group]});await assert.rejects(updated.servePage(ticket),/removal/);
});
