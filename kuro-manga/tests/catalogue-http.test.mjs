import test,{beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
const module=await import('../client/catalogue-http.mjs').catch(()=>({}));
const originalFetch=globalThis.fetch;
beforeEach(()=>{});afterEach(()=>{globalThis.fetch=originalFetch;});
function client(options={}){assert.equal(typeof module.createCatalogueHttp,'function','metadata requests need a backoff-aware transport');return module.createCatalogueHttp({requestText:async()=> 'original',requestJson:async()=>({original:true}),clearHttpCache:()=>{}},url=>'http://localhost/api/catalogue/mangadex?path='+encodeURIComponent(new URL(url).pathname),options);}
const url='https://api.mangadex.org/manga';
test('metadata 429 honors Retry-After across different manga URLs without rapid retries',async()=>{
 let requests=0,now=1000;globalThis.fetch=async()=>{requests++;return {ok:false,status:429,headers:{get:()=> '60'},text:async()=> '{}'};};const http=client({clock:()=>now});await assert.rejects(http.requestJson(url),error=>error.status===429&&error.retryAt===61000);await assert.rejects(http.requestJson(url+'/other'),error=>error.retryAt===61000);assert.equal(requests,1);
});
test('metadata GET callers share one in-flight response',async()=>{
 let release,requests=0;const gate=new Promise(resolve=>{release=resolve;});globalThis.fetch=async()=>{requests++;await gate;return {ok:true,text:async()=>'{"data":[]}'};};const http=client();const a=http.requestJson(url),b=http.requestJson(url);release();assert.deepEqual(await a,{data:[]});assert.deepEqual(await b,{data:[]});assert.equal(requests,1);
});
test('metadata body cache expires before content approval and clears on source refresh',async()=>{
 let now=1000,requests=0;globalThis.fetch=async()=>({ok:true,text:async()=>JSON.stringify({request:++requests})});const http=client({clock:()=>now});assert.equal((await http.requestJson(url)).request,1);now+=9000;assert.equal((await http.requestJson(url)).request,1);now+=2000;assert.equal((await http.requestJson(url)).request,2);http.clearHttpCache();assert.equal((await http.requestJson(url)).request,3);
});
test('account and non-MangaDex request helpers retain their original implementation',async()=>{
 globalThis.fetch=()=>{throw new Error('Unexpected network request');};const http=client();assert.deepEqual(await http.requestJson('/api/auth/session'),{original:true});assert.equal(await http.requestText('https://example.test/'),'original');
});
test('a numeric or HTTP-date Retry-After becomes a bounded retry date',async()=>{
 const now=Date.parse('2026-10-15T10:00:00Z');globalThis.fetch=async()=>({ok:false,status:503,headers:{get:()=>new Date(now+120000).toUTCString()},text:async()=> '{}'});const http=client({clock:()=>now});await assert.rejects(http.requestJson(url),error=>error.status===503&&error.retryAt===now+120000);
});
