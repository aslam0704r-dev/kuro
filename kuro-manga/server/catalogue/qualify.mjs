import {CONTENT_POLICY_VERSION} from '../../client/content-policy.mjs';
import {withCatalogueDeadline,catalogueSignal} from './deadline.mjs';
import {sourceError} from './transport.mjs';

// One hosted request replaces the browser's rating -> inventory -> chapters ->
// pages waterfall. All identities, ratings and candidate chapters originate on
// the server. A pending result contains counts, never reader tickets.
export function createTitleQualifier({coordinator,clock,content,readable,call,deadlineMs=20000}){
 return async function qualify(provider,id,origin){
  if(provider!=='mangadex')throw sourceError('This source has no approved reader connection.',409);
  let manga;
  const pending=()=>({ready:false,pending:true,stage:'preparing',policyVersion:CONTENT_POLICY_VERSION,...manga?{manga}:{}});
  try{return await withCatalogueDeadline(async()=>{
   const approval=await content.manga(provider,id);manga=approval.manga;id=manga.id;
   const key=CONTENT_POLICY_VERSION+':qualification:'+id;
   return coordinator.lock(key,async()=>{
    const rows=await readable.getMany([id]),proof=rows.get(id);
    const result=(proof,revision,manifest)=>({ready:true,pending:false,policyVersion:CONTENT_POLICY_VERSION,manga,asOf:clock(),inventoryRevision:revision,
     chapterId:proof.chapterId,validation:'complete-chapter',validatedPages:proof.validatedPages,pageCount:proof.pageCount,checkedAt:proof.checkedAt,expiresAt:proof.expiresAt,...manifest?{manifest}:{}});
    if(proof){manga=(await content.manga(provider,id)).manga;return result(proof,rows.revision);}
    let progress=await coordinator.get(key);
    if(!progress){
     const chapters=(await call(provider,'chapters',{id},origin)).value;
     const cost=row=>Number.isInteger(row.pages)&&row.pages>0?row.pages:Infinity;
     progress={chapters:[...chapters].sort((a,b)=>cost(a)-cost(b)).slice(0,10).map(row=>row.id),index:0};
     await coordinator.set(key,progress,120000);
    }
    if(progress.index>=progress.chapters.length)return {ready:false,pending:false,policyVersion:CONTENT_POLICY_VERSION,manga,asOf:clock(),inventoryRevision:rows.revision,error:'No complete readable chapter could be verified.'};
    try{
     const manifest=(await call(provider,'pages',{id:progress.chapters[progress.index]},origin)).value;
     if(manifest.verified===true&&manifest.validation==='complete-chapter'&&manifest.contentApproval?.mangaId===id&&manifest.pages?.length>0&&manifest.validatedPages===manifest.pageCount&&manifest.pageCount===manifest.pages.length){
      manga=(await content.manga(provider,id)).manga;
      return result(manifest,manifest.inventoryRevision,manifest);
     }
     return {...pending(),chapterId:manifest.chapterId,validatedPages:manifest.validatedPages||0,pageCount:manifest.pageCount||null};
    }catch(error){
     if(![403,404,410,422].includes(error.status)||catalogueSignal()?.aborted)throw error;
     progress.index++;await coordinator.set(key,progress,120000);
     return {...pending(),attemptedChapters:progress.index};
    }
   });
  },Math.min(20000,Math.max(1,deadlineMs)));}
  catch(error){if(/deadline/i.test(error.message))return pending();throw error;}
 };
}
