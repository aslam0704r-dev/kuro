import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import path from 'node:path';import {randomBytes} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createCatalogueService} from '../server/catalogue/service.mjs';
import {createMemoryCoordinator} from '../server/catalogue/cache.mjs';
import {classifyMangaDex,CONTENT_POLICY_VERSION} from '../client/content-policy.mjs';
import {READABLE_VERSION} from '../server/catalogue/readable.mjs';
export const auditSummary=state=>{const rows=Object.values(state.results||{}),pending=Object.keys(state.pending||{}).length,finished=state.finished===true&&pending===0;return {startedAt:state.startedAt,updatedAt:Date.now(),candidateTotalReported:state.candidateTotalReported??null,checkedCandidates:rows.filter(x=>x.state!=='pending').length,pendingCandidates:pending,approvedCandidates:rows.filter(x=>!['content-restricted','pending'].includes(x.state)).length,qualifiedEditions:rows.filter(x=>x.state==='qualified').length,excludedOrUnverified:rows.filter(x=>!['qualified','pending'].includes(x.state)).length,entireProviderAudited:finished,scope:finished?'completed candidate sweep':'partial candidate sweep',qualification:'at least one complete chapter; every page fetched and decoded'};};
async function atomicJSON(file,value){await mkdir(path.dirname(file),{recursive:true});const temp=file+'.tmp';await writeFile(temp,JSON.stringify(value,null,2)+'\n');await rename(temp,file);}
export async function runReadableAudit({limit=100,checkpoint='work/readable-checkpoint.json',snapshot='data/readable-audit.json',service,fetchCandidates=fetch,signal,onProgress=value=>console.log(JSON.stringify(value)),retryLimit=4}={}) {
 if(!Number.isSafeInteger(limit)||limit<0)throw new Error('Use a non-negative limit; zero means the full sweep.');checkpoint=path.resolve(checkpoint);snapshot=path.resolve(snapshot);
 let state;try{state=JSON.parse(await readFile(checkpoint,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;state={schemaVersion:1,policyVersion:CONTENT_POLICY_VERSION,readabilityVersion:READABLE_VERSION,startedAt:Date.now(),offset:0,since:null,results:{},proofs:[],chapterEvidence:{},finished:false};}
 if(state.policyVersion!==CONTENT_POLICY_VERSION||state.readabilityVersion!==READABLE_VERSION)throw new Error('Checkpoint policy changed; start a new checkpoint.');
 state.pending||={};state.chapterEvidence||={};
 service||=createCatalogueService({coordinator:createMemoryCoordinator(),ticketKey:randomBytes(32),usage:'noncommercial',seedInventory:state.proofs||[]});
 const pause=ms=>new Promise(resolve=>{if(signal?.aborted)return resolve();const timer=setTimeout(finish,ms);function finish(){clearTimeout(timer);signal?.removeEventListener('abort',finish);resolve();}signal?.addEventListener('abort',finish,{once:true});});
 const temporary=status=>!status||status===429||status>=500&&status<600;
 async function retry(task){for(let attempt=0;;attempt++){if(signal?.aborted)throw Object.assign(new Error('Audit interrupted'),{status:503});try{return await task();}catch(error){if(temporary(error.status)&&attempt<retryLimit){onProgress({state:'waiting',reason:error.message,retrySeconds:60});await pause(60000);continue;}throw error;}}}
 async function save(){state.proofs=await service.readableSnapshot();const coverage=auditSummary(state),summary={...await service.readableSummary(),...coverage};await atomicJSON(checkpoint,state);await atomicJSON(snapshot,{schemaVersion:1,summary,inventory:state.proofs,chapterEvidence:state.chapterEvidence});onProgress({checked:summary.checkedCandidates,pending:summary.pendingCandidates,unique:summary.uniqueCount,qualified:summary.qualifiedEditions,excluded:summary.excludedOrUnverified,finished:summary.entireProviderAudited});return summary;}
 let checkedThisRun=0;const attempted=new Set();
 async function check(raw){
  attempted.add(raw.id);checkedThisRun++;state.pending[raw.id]=raw;state.results[raw.id]={state:'pending',checkedAt:Date.now()};await save();
  if(!classifyMangaDex(raw).allowed){state.results[raw.id]={state:'content-restricted',checkedAt:Date.now()};delete state.pending[raw.id];await save();return;}
  const mangaId='mangadex-'+raw.id,failures=[];let qualified=false,pending=false,restricted=false,chapters=[];
  try {
   chapters=(await retry(()=>service.call('mangadex','chapters',{id:mangaId}))).value;
   for(const chapter of chapters) {
    try {let manifest;do{if(signal?.aborted){pending=true;break;}manifest=(await retry(()=>service.call('mangadex','pages',{id:chapter.id},'https://kuro-manga.vercel.app'))).value;}while(manifest?.pending&&!signal?.aborted);
     if(manifest?.verified===true){qualified=true;state.chapterEvidence[raw.id]={chapterId:chapter.id,pageCount:manifest.pageCount,checkedAt:manifest.checkedAt,pages:manifest.pageEvidence};break;}
     if(signal?.aborted||manifest?.pending){pending=true;break;}
    }catch(error){failures.push({chapterId:chapter.id,status:error.status||502,error:error.message});if(temporary(error.status)){pending=true;break;}
     if(error.status===403)try{await service.contentCheck('mangadex',mangaId);}catch(parentError){if(temporary(parentError.status))pending=true;else restricted=parentError.status===403;break;}
    }
   }
   if(signal?.aborted&&!qualified)pending=true;
   state.results[raw.id]={state:qualified?'qualified':pending?'pending':restricted?'content-restricted':'unverified',checkedAt:Date.now(),title:raw.attributes.title?.en||Object.values(raw.attributes.title||{})[0],chaptersOffered:chapters.length,failures};
  }catch(error){state.results[raw.id]={state:[403,404,410,422].includes(error.status)?'unverified':'pending',checkedAt:Date.now(),status:error.status||502,error:error.message};}
  if(state.results[raw.id].state!=='pending')delete state.pending[raw.id];await save();
 }
 // Resume queued interruptions before advancing candidate pagination. Pending
 // entries are neither terminal checks nor permanently skipped title failures.
 for(const raw of Object.values(state.pending)){if(signal?.aborted||limit!==0&&checkedThisRun>=limit)break;await check(raw);}
 while(!signal?.aborted&&!state.finished&&(limit===0||checkedThisRun<limit)) {
  const params=new URLSearchParams({'limit':'100','offset':String(state.offset),'contentRating[]':'safe','hasAvailableChapters':'true','availableTranslatedLanguage[]':'en','includes[]':'cover_art','order[createdAt]':'asc'});params.append('includes[]','author');params.append('includes[]','artist');if(state.since)params.set('createdAtSince',state.since);
  // Candidate enumeration is fixed to the public API. Never use its total as
  // a verified count. The service forces positive ratings on subsequent reads.
  const response=await fetchCandidates('https://api.mangadex.org/manga?'+params,{headers:{Accept:'application/json','User-Agent':'KURO-readable-audit/4.4'},signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error('Candidate API returned '+response.status);const batch=await response.json();if(batch.result!=='ok'||!Array.isArray(batch.data))throw new Error('Invalid candidate list');
  if(state.candidateTotalReported===undefined)state.candidateTotalReported=batch.total;
  for(const raw of batch.data) {
   if(signal?.aborted||limit!==0&&checkedThisRun>=limit)break;if(state.results[raw.id]||attempted.has(raw.id))continue;await check(raw);
  }
  const remaining=batch.data.some(raw=>!state.results[raw.id]);if(remaining)break;
  if(batch.data.length<100||state.offset+100>=batch.total){state.finished=true;break;}
  state.offset+=100;
  if(state.offset>=9900){const date=batch.data.at(-1)?.attributes?.createdAt;if(!date||date===state.since)throw new Error('Pagination could not advance safely. Checkpoint saved; do not report a complete sweep.');state.since=date;state.offset=0;}
 }
 return save();
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
 const options=Object.fromEntries(process.argv.slice(2).map(arg=>arg.replace(/^--/,'').split('=')));
 if(Object.hasOwn(options,'help'))console.log('node scripts/audit-readable.mjs --limit=100 --checkpoint=work/readable-checkpoint.json --snapshot=data/readable-audit.json\nUse --limit=0 for a full sweep; rerun with the same checkpoint to resume. Pending interruptions are retried. No private keys needed.');
 else {const controller=new AbortController(),stop=()=>controller.abort();process.once('SIGINT',stop);process.once('SIGTERM',stop);runReadableAudit({limit:Number(options.limit??100),checkpoint:options.checkpoint,snapshot:options.snapshot,signal:controller.signal}).catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>{process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);});}
}
