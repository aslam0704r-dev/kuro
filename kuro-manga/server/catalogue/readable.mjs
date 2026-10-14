import {createHash} from 'node:crypto';
import {groupSeries} from '../../dist/catalogue-model.mjs';
import {CONTENT_POLICY_VERSION,UUID,blockedIdentity,forbiddenText} from '../../client/content-policy.mjs';
import {sourceError} from './transport.mjs';
import {editionAliases} from '../../client/edition-aliases.mjs';
export const READABLE_VERSION='complete-chapter-1',READABLE_WINDOW_MS=6*3600000;
const digest=value=>createHash('sha256').update(value).digest('hex'),bucketFor=id=>digest(id).slice(0,2);
const pickManga=m=>({id:m.id,sourceId:m.sourceId,title:m.title,author:m.author||'',identityKeys:m.identityKeys||[],genres:m.genres||[]});
export function createReadableLedger(coordinator,clock=Date.now,seeds=[],{excludedGroups=[]}={}) {
 const valid=(row,at=clock())=>row?.sourceId==='mangadex'&&/^mangadex-/.test(row.id)&&UUID.test(String(row.id).slice(9))&&/^mangadex:/.test(row.chapterId)&&UUID.test(row.chapterId.slice(9))&&row.version===READABLE_VERSION&&row.policyVersion===CONTENT_POLICY_VERSION&&row.expiresAt>at&&row.checkedAt<=at+5000&&row.checkedAt+READABLE_WINDOW_MS>=row.expiresAt&&Number.isInteger(row.validatedPages)&&row.validatedPages>0&&row.validatedPages<=500&&row.validatedPages===row.pageCount&&(!excludedGroups.length||Array.isArray(row.groups)&&!row.groups.some(id=>excludedGroups.includes(id)))&&!blockedIdentity(row.sourceId,row.id,row.chapterId)&&!forbiddenText(row.title)&&!(row.genres||[]).some(forbiddenText);
 const normalize=row=>({...row,identityKeys:[...new Set((row.identityKeys||[]).map(key=>key.startsWith('mdx:')?'mdx:'+(editionAliases[key.slice(4)]||key.slice(4)):key))]});
 const failureAt=(rows,id,chapter,at=clock())=>Math.max(0,...['failure:'+id,'failure:'+chapter].map(key=>rows[key]?.until>at?rows[key].invalidatedAt:0));
 const stored=rows=>Object.fromEntries(Object.entries(rows||{}).filter(([key,row])=>key.startsWith('failure:')?row.until>clock():valid(row)));
 const prune=(rows,at=clock())=>Object.fromEntries(Object.entries(rows||{}).filter(([key,row])=>!key.startsWith('failure:')&&valid(row,at)&&row.checkedAt>failureAt(rows,row.id,row.chapterId,at)).map(([key,row])=>[key,normalize(row)]));
 async function put(row,seed=false) {if(!valid(row))throw sourceError('A complete chapter proof is required',403);const bucket=bucketFor(row.id);return coordinator.lock('readable-inventory:'+bucket,async()=>{const rows=stored(await coordinator.inventoryGet(bucket));
   if(row.checkedAt<=failureAt(rows,row.id,row.chapterId)){if(seed)return false;throw sourceError('This chapter requires a fresh complete check after a known failure',409);}
   if(rows[row.id]?.checkedAt>row.checkedAt)return true;rows[row.id]=normalize(row);await coordinator.inventorySet(bucket,rows,READABLE_WINDOW_MS);return true;});}
 let init;
 const initialize=()=>init||=Promise.all(seeds.filter(row=>valid(row)).map(row=>put(row,true)));
 async function revoke(id,chapter) {await initialize();const bucket=bucketFor(id);await coordinator.lock('readable-inventory:'+bucket,async()=>{const rows=stored(await coordinator.inventoryGet(bucket));if(rows[id]&&(!chapter||rows[id].chapterId===chapter))delete rows[id];rows['failure:'+(chapter||id)]={invalidatedAt:clock(),until:clock()+READABLE_WINDOW_MS};await coordinator.inventorySet(bucket,rows,READABLE_WINDOW_MS);});}
 async function snapshot(){await initialize();const buckets=await coordinator.inventoryAll(),asOf=clock();return {items:buckets.flatMap(bucket=>Object.values(prune(bucket,asOf))),asOf};}
 async function rows(){return (await snapshot()).items;}
 return {
  async record(manga,proof){await initialize();if(proof.validation!== 'complete-chapter'||proof.version!==READABLE_VERSION)throw sourceError('A complete chapter proof is required',403);
   const row={...pickManga(manga),version:READABLE_VERSION,policyVersion:CONTENT_POLICY_VERSION,chapterId:proof.chapterId,pageCount:proof.pageCount,validatedPages:proof.validatedPages,checkedAt:proof.checkedAt,expiresAt:proof.expiresAt,manifestDigest:proof.manifestDigest,groups:proof.groups||[]};await put(row);return row;},
  async get(id){await initialize();return prune(await coordinator.inventoryGet(bucketFor(id)))[id];},
  async failure(id,chapter){await initialize();return failureAt(await coordinator.inventoryGet(bucketFor(id)),id,chapter);},revoke,rows,
  async summary(){const {items,asOf}=await snapshot(),groups=groupSeries(items,true),times=items.map(x=>x.checkedAt);
   return {uniqueCount:groups.length,verifiedEditions:items.length,duplicatesGrouped:items.length-groups.length,qualification:'at least one complete chapter; every page fetched and decoded',scope:'KURO verified remote inventory',windowMs:READABLE_WINDOW_MS,asOf,oldestCheckAt:times.length?Math.min(...times):null,latestCheckAt:times.length?Math.max(...times):null,entireProviderAudited:false,deviceImportsIncluded:false,policyVersion:CONTENT_POLICY_VERSION,readabilityVersion:READABLE_VERSION};}
 };
}
export function createChapterValidator(coordinator,image,clock=Date.now) {
 return {async check(provider,clean,policy,invalidatedAt=0) {
  const manifestDigest=digest(JSON.stringify(clean)),key=READABLE_VERSION+':progress:'+provider+':'+manifestDigest;
  return coordinator.lock(key,async()=>{
   let row=await coordinator.get(key);if(!row||row.expiresAt<=clock()||row.checkedAt<=invalidatedAt)row={chapterId:clean.chapterId,manifestDigest,pageCount:clean.pages.length,evidence:[],expiresAt:clock()+READABLE_WINDOW_MS};
   // Two image requests per hosted call bound the maximum upstream wait. A
   // pending result contains no tickets; the client repeats with the same ID.
   const batch=clean.pages.slice(row.evidence.length,row.evidence.length+2);
   if(batch.length){const settled=await Promise.allSettled(batch.map(async page=>{const checked=await image(provider,page.url,policy,page.transform,invalidatedAt);return {index:page.index,sha256:checked.sha256,width:checked.width,height:checked.height,mime:checked.mime,checkedAt:checked.validatedAt};}));
    const failure=settled.find(x=>x.status==='rejected');if(failure)throw failure.reason;
    row.evidence.push(...settled.map(x=>x.value));row.expiresAt=Math.min(...row.evidence.map(x=>x.checkedAt))+READABLE_WINDOW_MS;
   }
   row={...row,version:READABLE_VERSION,validation:'complete-chapter',validatedPages:row.evidence.length,checkedAt:row.evidence.length?Math.min(...row.evidence.map(x=>x.checkedAt)):clock()};
   await coordinator.set(key,row,Math.max(1,row.expiresAt-clock()));
   return {...row,verified:row.validatedPages===row.pageCount,pending:row.validatedPages!==row.pageCount};
  });
 }};
}
