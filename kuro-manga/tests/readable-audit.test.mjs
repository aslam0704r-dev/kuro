import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,readFile,rm} from 'node:fs/promises';import {fileURLToPath} from 'node:url';import path from 'node:path';
import {runReadableAudit} from '../scripts/audit-readable.mjs';
const raw={id:'11111111-1111-4111-8111-111111111111',type:'manga',attributes:{title:{en:'Mountain Friends'},contentRating:'safe',tags:[],createdAt:'2026-01-01T00:00:00+00:00'},relationships:[]};
async function fixture(){const directory=await mkdtemp(fileURLToPath(new URL('./.readable-audit-',import.meta.url)));return {directory,checkpoint:path.join(directory,'checkpoint.json'),snapshot:path.join(directory,'snapshot.json'),fetchCandidates:async()=>({ok:true,json:async()=>({result:'ok',data:[raw],total:1})}),onProgress:()=>{}};}
function service(pages){return {call:async(_provider,action,params)=>action==='chapters'?{value:[{id:'mangadex:22222222-2222-4222-8222-222222222222'}]}:pages(params),readableSnapshot:async()=>[],readableSummary:async()=>({uniqueCount:0})};}
test('interrupted pending title is retried on resume and never counted as a terminal check',async()=>{
 const f=await fixture(),controller=new AbortController();try {
  const first=await runReadableAudit({...f,limit:1,signal:controller.signal,service:service(async()=>{controller.abort();return {value:{verified:false,pending:true,pageCount:3,validatedPages:2,pages:[]}};})});
  assert.equal(first.checkedCandidates,0);assert.equal(first.pendingCandidates,1);assert.equal(first.entireProviderAudited,false);
  let calls=0;const resumed=await runReadableAudit({...f,limit:1,service:service(async()=>{calls++;return {value:{verified:true,pending:false,pageCount:3,validatedPages:3,checkedAt:Date.now(),pageEvidence:[{index:0},{index:1},{index:2}]}};})});
  assert.equal(calls,1);assert.equal(resumed.checkedCandidates,1);assert.equal(resumed.pendingCandidates,0);assert.equal(JSON.parse(await readFile(f.checkpoint,'utf8')).results[raw.id].state,'qualified');
 }finally{await rm(f.directory,{recursive:true,force:true});}
});
test('temporary provider failures stay queued for the next audit run',async()=>{
 for(const status of [429,500,502,503,504]){const f=await fixture();try {const first=await runReadableAudit({...f,limit:1,retryLimit:0,service:service(async()=>{throw Object.assign(new Error('Temporary unavailable'),{status});})});assert.equal(first.pendingCandidates,1);assert.equal(first.checkedCandidates,0);assert.equal(first.entireProviderAudited,false);
  let calls=0;await runReadableAudit({...f,limit:1,service:service(async()=>{calls++;return {value:{verified:true,pending:false,pageCount:1,validatedPages:1,checkedAt:Date.now(),pageEvidence:[{}]}};})});assert.equal(calls,1);
 }finally{await rm(f.directory,{recursive:true,force:true});}}
});
test('chapter-specific restrictions try the next chapter while parent restrictions stop',async()=>{
 for(const parentAllowed of [true,false]){const f=await fixture(),tried=[];try {const s=service(async params=>{tried.push(params.id);if(params.id==='bad')throw Object.assign(new Error('This chapter is restricted'),{status:403});return {value:{verified:true,pending:false,pageCount:1,checkedAt:Date.now(),pageEvidence:[{}]}};});
  s.call=async(_provider,action,params)=>action==='chapters'?{value:[{id:'bad'},{id:'good'}]}:(()=>{tried.push(params.id);if(params.id==='bad')throw Object.assign(new Error('This chapter is restricted'),{status:403});return {value:{verified:true,pending:false,pageCount:1,checkedAt:Date.now(),pageEvidence:[{}]}};})();
  s.contentCheck=async()=>{if(!parentAllowed)throw Object.assign(new Error('The parent rating is restricted'),{status:403});return {allowed:true};};
  const result=await runReadableAudit({...f,limit:1,service:s});assert.deepEqual(tried,parentAllowed?['bad','good']:['bad']);assert.equal(result.qualifiedEditions,parentAllowed?1:0);assert.equal(result.pendingCandidates,0);
 }finally{await rm(f.directory,{recursive:true,force:true});}}
});
