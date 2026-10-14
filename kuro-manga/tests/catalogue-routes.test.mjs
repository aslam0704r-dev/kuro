import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import sharp from 'sharp';
import { createCatalogueService } from '../server/catalogue/service.mjs';
import { createCatalogueRoutes } from '../server/catalogue/routes.mjs';
import { createMemoryCoordinator } from '../server/catalogue/cache.mjs';

async function fixture({corrupt=false}={}){
 const coordinator=createMemoryCoordinator();const bytes=await sharp({create:{width:200,height:300,channels:3,background:'#234567'}}).png().toBuffer();
 let pulls=0;
 const service=createCatalogueService({coordinator,ticketKey:Buffer.alloc(32,3),usage:'noncommercial',fetcher:async url=>{pulls++;
  if(url.includes('/chapter/'))return {body:Buffer.from(JSON.stringify({data:{id:'22222222-2222-4222-8222-222222222222',type:'chapter',attributes:{pages:2},relationships:[{type:'manga',id:'11111111-1111-4111-8111-111111111111'}]}})),headers:{'content-type':'application/json'}};
  if(url.includes('/manga/'))return {body:Buffer.from(JSON.stringify({data:{id:'11111111-1111-4111-8111-111111111111',type:'manga',attributes:{contentRating:'safe',title:{en:'Hero'},tags:[]},relationships:[]}})),headers:{'content-type':'application/json'}};
  if(url.includes('/at-home/'))return {body:Buffer.from(JSON.stringify({result:'ok',baseUrl:'https://uploads.mangadex.org',chapter:{hash:'publichash',data:['1.png','2.png'],dataSaver:[]}})),headers:{'content-type':'application/json'}};
  if(corrupt)return {body:Buffer.from('<html>unavailable</html>'),headers:{'content-type':'image/png'}};return {body:bytes,headers:{'content-type':'image/png'}};}});
 let origin;const routes=createCatalogueRoutes(service,{origin:()=>origin,cronSecret:'fixture-cron-secret-32-characters'});
 const server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');try{if(!await routes(req,res,url)){res.writeHead(404);res.end();}}catch{res.writeHead(500);res.end();}});
 server.listen(0,'127.0.0.1');await once(server,'listening');origin='http://127.0.0.1:'+server.address().port;
 return {origin,service,pulls:()=>pulls,close:()=>new Promise(r=>server.close(r))};
}
const payload={provider:'mangadex',chapterId:'mangadex:22222222-2222-4222-8222-222222222222'};
test('same-origin manifest preparation checks image bytes and serves only signed page URLs',async()=>{
 const f=await fixture();try{
  const response=await fetch(f.origin+'/api/catalogue/manifest',{method:'POST',headers:{'Content-Type':'application/json',Origin:f.origin},body:JSON.stringify(payload)});assert.equal(response.status,200);
  const json=await response.json();assert.equal(json.result.verified,true);assert.equal(json.result.pages.length,2);assert.ok(json.result.pages[0].url.startsWith(f.origin+'/api/catalogue/page?ticket='));
  const image=await fetch(json.result.pages[0].url);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');assert.deepEqual(Buffer.from(await image.arrayBuffer()).subarray(0,8),Buffer.from('89504e470d0a1a0a','hex'));
  const tampered=await fetch(json.result.pages[0].url+'x');assert.equal(tampered.status,403);
 }finally{await f.close();}
});
test('CSRF, arbitrary providers and arbitrary URLs fail before network access',async()=>{
 const f=await fixture();try{
  const call=(body,headers={})=>fetch(f.origin+'/api/catalogue/manifest',{method:'POST',headers:{'Content-Type':'application/json',Origin:f.origin,...headers},body:JSON.stringify(body)});
  assert.equal((await call(payload,{Origin:'https://evil.test'})).status,403);
  assert.equal((await call(payload,{'Content-Type':'text/plain'})).status,415);
  assert.equal((await call({...payload,provider:'doesnotexist'})).status,404);
  assert.equal((await call({...payload,pages:[{url:'https://example.com/a.png'}]})).status,400);
  assert.equal(f.pulls(),0);
 }finally{await f.close();}
});
test('corrupt pages are rejected rather than prepared as readable',async()=>{
 const f=await fixture({corrupt:true});try{
  const response=await fetch(f.origin+'/api/catalogue/manifest',{method:'POST',headers:{'Content-Type':'application/json',Origin:f.origin},body:JSON.stringify(payload)});
  assert.equal(response.status,422);const json=await response.json();assert.match(json.error,/signature/i);assert.equal(json.result,undefined);
 }finally{await f.close();}
});
test('refresh requires the configured bearer secret and has no browser-visible credential',async()=>{
 const f=await fixture();try{
  assert.equal((await fetch(f.origin+'/api/catalogue/refresh')).status,401);
  assert.equal((await fetch(f.origin+'/api/catalogue/refresh',{headers:{Authorization:'Bearer wrong'}})).status,401);
  const publicConfig=await(await fetch(f.origin+'/api/catalogue/providers')).text();assert.ok(!publicConfig.includes('fixture-cron-secret'));
  // Exercise authorization without invoking live external providers.
  f.service.refresh=async()=>({checkedAt:1,reports:[{provider:'guya',ok:true}]});
  const result=await fetch(f.origin+'/api/catalogue/refresh',{headers:{Authorization:'Bearer fixture-cron-secret-32-characters'}});assert.equal(result.status,200);assert.equal((await result.json()).result.reports[0].ok,true);
 }finally{await f.close();}
});
test('directory distinguishes installed readers, metadata, external links and unresolved names',async()=>{
 const f=await fixture();try{
  const data=await(await fetch(f.origin+'/api/catalogue/providers')).json();assert.ok(data.providers.length>1200);assert.equal(data.requestedNames,1254);
  assert.equal(data.providers.find(x=>x.id==='guya').readable,true);assert.equal(data.providers.find(x=>x.id==='mangabaka').readable,false);
  assert.equal(data.providers.find(x=>x.id==='vizmanga').mode,'external');assert.equal(data.providers.find(x=>x.name==='AnzMangasHd').mode,'unresolved');
 }finally{await f.close();}
});
test('metadata relay cannot access private APIs or change the fixed upstream host',async()=>{
 const f=await fixture();try{for(const path of ['https://evil.test/manga','/auth/check','/user','/manga/../../auth']){
  const response=await fetch(f.origin+'/api/catalogue/mangadex?path='+encodeURIComponent(path));assert.equal(response.status,403);
 }assert.equal(f.pulls(),0);}finally{await f.close();}
});
