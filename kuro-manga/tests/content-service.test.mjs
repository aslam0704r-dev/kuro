import test from 'node:test';import assert from 'node:assert/strict';import sharp from 'sharp';import {createHmac} from 'node:crypto';
import {createCatalogueService} from '../server/catalogue/service.mjs';import {createMemoryCoordinator} from '../server/catalogue/cache.mjs';import {proxy} from '../server/proxy.mjs';
import {registry} from '../server/catalogue/policy.mjs';import {providerContentPolicy} from '../client/content-policy.mjs';
const manga='11111111-1111-4111-8111-111111111111',chapter='22222222-2222-4222-8222-222222222222';
const record=rating=>({id:manga,type:'manga',attributes:{contentRating:rating,title:{en:'The mountain friends'},description:{en:'An adventure.'},tags:[],status:'ongoing'},relationships:[{type:'cover_art',id:'33333333-3333-4333-8333-333333333333',attributes:{fileName:'44444444-4444-4444-8444-444444444444.png'}}]});
async function fixture(rating='safe'){
 let now=100000,contentRating=rating;const requests=[],bytes=await sharp({create:{width:100,height:200,channels:3,background:'#123456'}}).png().toBuffer();
 const fetcher=async input=>{const url=new URL(input);requests.push(url.href);let value;
  if(url.pathname==='/manga')value={data:[record('safe'),{...record('pornographic'),id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},{...record(undefined),id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'}],total:3};
  else if(url.pathname==='/manga/'+manga)value={data:record(contentRating)};
  else if(url.pathname==='/chapter/'+chapter)value={data:{id:chapter,type:'chapter',attributes:{title:'Beginning',chapter:'1',pages:1},relationships:[{type:'manga',id:manga}]}};
  else if(url.pathname==='/manga/'+manga+'/feed')value={data:[{id:chapter,type:'chapter',attributes:{chapter:'1',pages:1},relationships:[{type:'manga',id:manga}]}]};
  else if(url.pathname.includes('/at-home/'))value={result:'ok',baseUrl:'https://uploads.mangadex.org',chapter:{hash:'publichash',data:['1.png'],dataSaver:[]}};
  else if(url.hostname==='uploads.mangadex.org')return {body:bytes,headers:{'content-type':'image/png'}};
  else throw new Error('Unexpected fixture URL '+url.href);
  return {body:Buffer.from(JSON.stringify(value)),headers:{'content-type':'application/json'}};
 };
 const key=Buffer.alloc(32,5),service=createCatalogueService({coordinator:createMemoryCoordinator(()=>now),ticketKey:key,usage:'noncommercial',fetcher,clock:()=>now});
 return {service,requests,key,change:rating=>{contentRating=rating;now+=31000;}};
}
test('every unverified provider is refused before any upstream fetch',async()=>{
 const f=await fixture();for(const id of ['asurascans','guya','jikan','toonily','webtoon'])await assert.rejects(f.service.call(id,'search',{q:'hero'}),/content|rating|approved/i);assert.equal(f.requests.length,0);
});
test('all 1,234 restricted registry providers refuse catalogue and reader calls without upstream acquisition',async()=>{
 const f=await fixture(),restricted=registry.providers.filter(p=>providerContentPolicy(p).state!=='eligible');assert.equal(restricted.length,1234);
 for(const p of restricted)for(const action of ['search','details','chapters','pages'])await assert.rejects(f.service.call(p.id,action,{q:'Hero',id:p.id+'-unknown'}),error=>error.status===403,p.id+' '+action);
 assert.equal(f.requests.length,0);
});
test('MangaDex lists force safe-only rating and remove unsafe or unrated upstream rows',async()=>{
 const f=await fixture();const result=await f.service.mangaDexMetadata('/manga?contentRating[]=pornographic&contentRating=suggestive');
 assert.deepEqual(result.data.map(x=>x.id),[manga]);const url=new URL(f.requests[0]);assert.deepEqual(url.searchParams.getAll('contentRating[]'),['safe']);assert.equal(url.searchParams.has('contentRating'),false);
});
test('adult detail, feed, chapter, at-home and cover requests fail before image acquisition',async()=>{
 const f=await fixture('pornographic');for(const path of ['/manga/'+manga,'/manga/'+manga+'/feed','/chapter/'+chapter,'/at-home/server/'+chapter])await assert.rejects(f.service.mangaDexMetadata(path),/content|approved/i);
 await assert.rejects(f.service.cover('mangadex','mangadex-'+manga),/content|approved/i);await assert.rejects(f.service.call('mangadex','pages',{id:'mangadex:'+chapter},'http://localhost'),/content|approved/i);
 assert.equal(f.requests.some(x=>x.includes('/at-home/')||new URL(x).hostname==='uploads.mangadex.org'),false);
});
test('approved chapter relationship binds manifest and tickets to its canonical manga',async()=>{
 const f=await fixture();const result=(await f.service.call('mangadex','pages',{id:'mangadex:'+chapter},'http://localhost')).value;
 assert.equal(result.contentApproval.mangaId,'mangadex-'+manga);const ticket=new URL(result.pages[0].url).searchParams.get('ticket');const value=JSON.parse(Buffer.from(ticket.split('.')[0],'base64url').toString());assert.equal(value.m,'mangadex-'+manga);assert.equal(value.v,'strict-1');
 await f.service.servePage(ticket);f.change('suggestive');await assert.rejects(f.service.servePage(ticket),/content|approved/i);
});
test('known adult rating changes revoke the readable count on every canonical entry point',async()=>{
 for(const action of ['pages','cover','metadata','content']){const f=await fixture();await f.service.call('mangadex','pages',{id:'mangadex:'+chapter},'http://localhost');assert.equal((await f.service.readableSummary()).uniqueCount,1);f.change('pornographic');
  const task=action==='pages'?()=>f.service.call('mangadex','pages',{id:'mangadex:'+chapter},'http://localhost'):action==='cover'?()=>f.service.cover('mangadex','mangadex-'+manga):action==='metadata'?()=>f.service.mangaDexMetadata('/manga/'+manga):()=>f.service.contentCheck('mangadex','mangadex-'+manga);
  await assert.rejects(task);assert.equal((await f.service.readableSummary()).uniqueCount,0,action);
 }
});
test('browser supplied safe flags, manga IDs and cover URLs do not authorize content',async()=>{
 const f=await fixture('pornographic');await assert.rejects(f.service.contentCheck('mangadex','mangadex-'+manga,'mangadex:'+chapter,{safe:true}),/content|approved/i);
 await assert.rejects(f.service.cover('guya','guya-Hero'),/content|rating|approved/i);assert.equal(f.requests.some(x=>new URL(x).hostname==='uploads.mangadex.org'),false);
});
test('v1 page tickets are invalidated at the strict policy upgrade',async()=>{
 const f=await fixture();const value=Buffer.from(JSON.stringify({p:'mangadex',u:'https://uploads.mangadex.org/data/old/1.png',c:'mangadex:'+chapter,e:100000+86400000,g:[],h:'uploads.mangadex.org'})).toString('base64url');
 const token=value+'.'+createHmac('sha256',f.key).update('kuro:public-page:v1\0'+value).digest('base64url');await assert.rejects(f.service.servePage(token),/ticket/i);assert.equal(f.requests.length,0);
});
test('safe cover delivery derives its image from canonical metadata',async()=>{
 const f=await fixture();const response=await f.service.cover('mangadex','mangadex-'+manga);assert.equal(response.mime,'image/png');assert.ok(f.requests.at(-1).includes('/covers/'+manga+'/44444444-4444-4444-8444-444444444444.png'));
});
test('legacy proxy is closed with no upstream connection',async()=>{
 const res={headersSent:false,writeHead(status,headers){this.status=status;this.headers=headers;},end(message){this.message=message;}};
 await proxy({method:'GET'},res,new URL('http://localhost/__proxy?url=https://uploads.mangadex.org/covers/'+manga+'/old.jpg'));assert.equal(res.status,403);assert.match(res.message,/content|approved/i);
});
