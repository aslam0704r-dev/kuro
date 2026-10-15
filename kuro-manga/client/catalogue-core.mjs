import { installAdapters, installIdentity, checkedManifest } from '../dist/catalogue-runtime.mjs';
import { groupSeries, uniqueChapters } from '../dist/catalogue-model.mjs';
import {createLocalRuntime} from './local/runtime.mjs';
import {libraryExtension} from './local/ui.mjs';
import {artworkExtension} from './mobile-artwork.mjs';
import {createContentRuntime} from './content-runtime.mjs';
import {emailAuthExtension} from './email-auth.mjs';
import {createListingQueue} from './listing-queue.mjs';
import {progressiveDiscovery} from './progressive-discovery.mjs';
import {createCatalogueHttp,retryDate} from './catalogue-http.mjs';
import {providerState} from '../dist/provider-state.mjs';
import {sourceScreen,sourceSettingsCard} from './source-notice.mjs';
import {CONTENT_MESSAGE,CONTENT_POLICY_VERSION,classifyMangaDex,policyProvider,providerContentPolicy} from './content-policy.mjs';
export const completeManifest=(manifest,local=false)=>manifest?.verified===true&&Array.isArray(manifest.pages)&&manifest.pages.length>0&&(local?manifest.validation==='device':manifest.validation==='complete-chapter'&&manifest.validatedPages===manifest.pages.length&&manifest.pageCount===manifest.pages.length);
export const readinessFresh=value=>!!value&&Date.now()-value.checkedAt<120000&&value.expiresAt>Date.now();
const temporaryFailure=error=>!!error.retryAt||[408,425,429].includes(error.status)||error.status>=500||['AbortError','TimeoutError'].includes(error.name)||/timed out|timeout|fetch|network/i.test(error.message);
async function jsonBody(response){let value;try{value=await response.json();}catch{}if(value&&typeof value==='object'&&!Array.isArray(value))return value;if(!response.ok)return {};const error=new Error('Source returned invalid JSON. Retry later.');error.status=502;throw error;}

// This trusted local bootstrap runs before Metro starts the exported app. The
// immutable export's factory interface is intercepted only at the listed IDs.
// Upstream scripts and data are never evaluated here.
export function createCatalogueCore(providers){
 providers=providers.map(policyProvider);const registry={providers},subscribers=new Set(),readiness=new Map(),checks=new Map(),manifests=new Map(),snapshots=new Map(),listingProgress=new Map(),sourceRetryAt=new Map();let epoch=0,manager,store,activeChapter;
 let runtimeEligible=new Set(providers.filter(p=>providerState(p,{},true).canEnable).map(p=>p.id));
 const local=typeof window!=='undefined'?createLocalRuntime():null;
 const safety=createContentRuntime(local),admitted=row=>row?.sourceId==='local'?local?.books.some(b=>b.id===row.id):!!safety.current(row?.sourceId,row?.id);
 async function request(id,action,params={}){
  if(action==='pages') {
   // A long chapter is validated across bounded hosted calls. Never forward a
   // pending manifest to the reader or let an old sampled result qualify.
   for(let attempt=0;attempt<260;attempt++) {
    const value=await requestOnce(id,action,params);
    if(completeManifest(value)) {manifests.set(params.id,value);while(manifests.size>64)manifests.delete(manifests.keys().next().value);emitCredits();return value;}
    if(value?.pending!==true||value.verified!==false||value.pages?.length||value.stage!=='preparing'&&(!Number.isInteger(value.pageCount)||value.pageCount<1||value.validatedPages>=value.pageCount))throw new Error('The complete chapter could not be verified.');
    await new Promise(resolve=>setTimeout(resolve,600));
   }throw new Error('Chapter verification is still pending. Retry shortly.');
  }
  return requestOnce(id,action,params);
 }
 async function requestOnce(id,action,params={}){
  if((sourceRetryAt.get(id)||0)>Date.now()){const error=new Error('Source rate limit reached. Retry later.');error.status=429;error.retryAt=sourceRetryAt.get(id);throw error;}
  const query=new URLSearchParams();for(const [name,value]of Object.entries(params))if(value!==undefined)query.set(name,typeof value==='object'?JSON.stringify(value):String(value));
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);try{
   const response=await fetch('/api/catalogue/provider/'+id+'/'+action+'?'+query,{credentials:'same-origin',headers:{Accept:'application/json'},signal:controller.signal});
   const data=await jsonBody(response);if(!response.ok){const error=new Error(data.error||'Provider unavailable. Retry later.');error.status=response.status;if(response.status===429||response.status===503){error.retryAt=Math.max(sourceRetryAt.get(id)||0,retryDate(response.headers?.get('Retry-After')));sourceRetryAt.set(id,error.retryAt);}throw error;}
   if(action==='pages'&&data.result?.contentApproval?.version!==CONTENT_POLICY_VERSION)throw new Error(CONTENT_MESSAGE);return data.result;
  }catch(error){if(error.name==='AbortError'){const failure=new Error('Provider request timed out. Retry later.');failure.status=503;failure.retryAt=Date.now()+30000;throw failure;}throw error;}finally{clearTimeout(timer);}
 }
 const emitCredits=()=>{if(typeof window!=='undefined'&&activeChapter&&manifests.has(activeChapter))window.dispatchEvent(new CustomEvent('kuro:active-chapter-manifest',{detail:manifests.get(activeChapter)}));};
 function notify(){epoch++;readiness.clear();listingProgress.clear();for(const fn of subscribers)fn();listing.resume();if(typeof window!=='undefined')window.dispatchEvent(new Event('kuro:catalogue-updated'));}
 const cached=id=>{const value=readiness.get(id);return readinessFresh(value)?value:undefined;};
 const olderSnapshot=(id,at,revision)=>{const previous=snapshots.get(id);return previous&&(revision<previous.revision||revision===previous.revision&&at<previous.at);};
 function rememberSnapshot(id,at,ready,revision=0){const previous=snapshots.get(id);if(!Number.isFinite(at)||at>Date.now()+5000||!Number.isSafeInteger(revision)||revision<0||previous&&(revision<previous.revision||revision===previous.revision&&(at<previous.at||at===previous.at&&(ready||!previous.ready))))return false;snapshots.delete(id);snapshots.set(id,{at,ready,revision});while(snapshots.size>2400)snapshots.delete(snapshots.keys().next().value);return true;}
 async function check(manga){
  const hit=cached(manga.id);if(hit){if(hit.ready)try{await safety.verify(manga);}catch{return {ready:false,checkedAt:Date.now(),expiresAt:Date.now()+120000,error:CONTENT_MESSAGE};}if(cached(manga.id)===hit)return hit;}const started=epoch,key=started+':'+manga.id;if(checks.has(key))return checks.get(key).promise;
  const record={id:manga.id,invalidated:false,promise:null};
  const task=(async()=>{let ready=false,error,observedAt,inventoryRevision=0,expiresAt=Date.now()+120000;try{
   await safety.verify(manga);
   const adapter=manager.require(manga.sourceId);if(adapter.capabilities.readable!==false&&!manga.catalogueOnly&&!manga.publisherUrl){
    if(manga.sourceId==='mangadex')try{const response=await fetch('/api/catalogue/readable/check?'+new URLSearchParams({provider:manga.sourceId,id:manga.id}),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)}),proof=await response.json();if(response.ok){observedAt=proof.asOf;inventoryRevision=proof.inventoryRevision||0;}ready=response.ok&&proof.ready===true&&proof.validation==='complete-chapter'&&proof.validatedPages>0&&proof.validatedPages===proof.pageCount&&proof.expiresAt>Date.now();if(ready){expiresAt=Math.min(Date.now()+120000,proof.expiresAt);observedAt=proof.asOf;inventoryRevision=proof.inventoryRevision||0;}}catch{}
    if(!ready){const chapters=await adapter.getChapterList(manga.id),cost=chapter=>Number.isInteger(chapter.pages)&&chapter.pages>0?chapter.pages:Infinity;
     // Any complete chapter qualifies a title. Check the smaller candidates
     // first; the reader's chapter list and selected chapter stay unchanged.
     for(const chapter of [...chapters].sort((a,b)=>cost(a)-cost(b)).slice(0,10)){try{const manifest=await adapter.getChapterPages(chapter.id);ready=completeManifest(manifest,manga.sourceId==='local');if(ready){expiresAt=Math.min(Date.now()+120000,manifest.expiresAt||Date.now()+120000);observedAt=manifest.readabilityAsOf;inventoryRevision=manifest.inventoryRevision||0;break;}}catch(e){error=e.message;}}}
   }
   if(ready)await safety.verify(manga,undefined,true);
  }catch(e){ready=false;error=e.message;}
   if(started!==epoch||record.invalidated)return {ready:false,checkedAt:0,obsolete:true};
   const snapshotAt=Number.isFinite(observedAt)?observedAt:Date.now();if(olderSnapshot(manga.id,snapshotAt,inventoryRevision))return {ready:false,checkedAt:0,obsolete:true};rememberSnapshot(manga.id,snapshotAt,ready,inventoryRevision);
   const result={ready:ready&&expiresAt>Date.now(),checkedAt:Date.now(),expiresAt,error};readiness.set(manga.id,result);while(readiness.size>2000)readiness.delete(readiness.keys().next().value);
   core.lastCheck={...result,id:manga.id};safety.changed();if(ready&&typeof window!=='undefined')window.dispatchEvent(new Event('kuro:readable-updated'));return result;
  })();record.promise=task;checks.set(key,record);task.finally(()=>{if(checks.get(key)===record)checks.delete(key);});return task;
 }
 async function checkListing(manga){
  const hit=cached(manga.id);if(hit){if(hit.ready)try{await safety.verify(manga);}catch{return {ready:false,checkedAt:Date.now(),expiresAt:Date.now()+120000,error:CONTENT_MESSAGE};}if(cached(manga.id)===hit)return hit;}
  if(manga.sourceId!=='mangadex')return check(manga);
  if((sourceRetryAt.get(manga.sourceId)||0)>Date.now())return {pending:true,retryAt:sourceRetryAt.get(manga.sourceId)};
  const started=epoch,key='listing:'+started+':'+manga.id;if(checks.has(key))return checks.get(key).promise;
  let progress=listingProgress.get(manga.id);if(!progress||progress.epoch!==started||progress.expiresAt<=Date.now())progress={epoch:started,expiresAt:Date.now()+300000,index:0,attempts:0};
  if(progress.retryAt>Date.now())return {pending:true,retryAt:progress.retryAt};
  const record={id:manga.id,invalidated:false,promise:null},obsolete=()=>started!==epoch||record.invalidated;
  const task=(async()=>{let ready=false,error;
   try{
    await safety.verify(manga);
    if(!progress.chapters){
     const response=await fetch('/api/catalogue/readable/check?'+new URLSearchParams({provider:manga.sourceId,id:manga.id}),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)}),proof=await jsonBody(response);
     if(!response.ok){const failure=new Error(proof.error||'Source check is unavailable.');failure.status=response.status;if(response.status===429||response.status===503){failure.retryAt=Math.max(sourceRetryAt.get(manga.sourceId)||0,retryDate(response.headers?.get('Retry-After')));sourceRetryAt.set(manga.sourceId,failure.retryAt);}throw failure;}
     progress.observedAt=proof.asOf;progress.inventoryRevision=proof.inventoryRevision||0;
     ready=proof.ready===true&&proof.validation==='complete-chapter'&&proof.validatedPages>0&&proof.validatedPages===proof.pageCount&&proof.expiresAt>Date.now();
     if(ready)progress.proof=proof;
     else {const chapters=await manager.require(manga.sourceId).getChapterList(manga.id),cost=chapter=>Number.isInteger(chapter.pages)&&chapter.pages>0?chapter.pages:Infinity;
      progress.chapters=[...chapters].sort((a,b)=>cost(a)-cost(b)).slice(0,10);
      if(progress.chapters.length){if(obsolete())return {obsolete:true};listingProgress.set(manga.id,progress);while(listingProgress.size>2000)listingProgress.delete(listingProgress.keys().next().value);}
     }
    }
    if(!ready&&progress.chapters&&progress.index<progress.chapters.length){
     const chapter=progress.chapters[progress.index];let value;
     try{value=await requestOnce('mangadex','pages',{id:chapter.id});
      if(completeManifest(value)){checkedManifest(value,chapter.id,location.origin);if(value.contentApproval?.mangaId!==manga.id)throw new Error('Chapter does not belong to this title.');ready=true;progress.proof={expiresAt:value.expiresAt,asOf:value.readabilityAsOf,inventoryRevision:value.inventoryRevision||0};manifests.set(chapter.id,value);while(manifests.size>64)manifests.delete(manifests.keys().next().value);emitCredits();}
      else if(value?.chapterId===chapter.id&&value.pending===true&&value.verified===false&&!value.pages?.length&&(value.stage==='preparing'||Number.isInteger(value.pageCount)&&value.pageCount>0&&Number.isInteger(value.validatedPages)&&value.validatedPages>=0&&value.validatedPages<value.pageCount)){
       if(++progress.attempts>=260)throw new Error('Chapter verification did not complete.');if(obsolete())return {obsolete:true};listingProgress.set(manga.id,progress);return {pending:true};
      }else throw new Error('The complete chapter could not be verified.');
     }catch(failure){if(temporaryFailure(failure))throw failure;error=failure.message;progress.index++;progress.attempts=0;if(progress.index<progress.chapters.length){if(obsolete())return {obsolete:true};listingProgress.set(manga.id,progress);return {pending:true};}}
    }
    if(ready)await safety.verify(manga,undefined,true);
   }catch(failure){error=failure.message;if(obsolete())return {obsolete:true};if(temporaryFailure(failure)||(sourceRetryAt.get(manga.sourceId)||0)>Date.now()){progress.retryAt=Math.max(sourceRetryAt.get(manga.sourceId)||0,failure.retryAt||Date.now()+30000);listingProgress.set(manga.id,progress);sourceRetryAt.set(manga.sourceId,Math.max(sourceRetryAt.get(manga.sourceId)||0,progress.retryAt));return {pending:true,retryAt:progress.retryAt,error};}ready=false;}
   if(obsolete())return {obsolete:true};listingProgress.delete(manga.id);
   const observation=progress.proof||{asOf:progress.observedAt,inventoryRevision:progress.inventoryRevision},at=Number.isFinite(observation.asOf)?observation.asOf:Date.now(),revision=observation.inventoryRevision||0;
   if(olderSnapshot(manga.id,at,revision))return {obsolete:true};rememberSnapshot(manga.id,at,ready,revision);
   const result={ready:ready&&observation.expiresAt>Date.now(),checkedAt:Date.now(),expiresAt:ready?Math.min(Date.now()+120000,observation.expiresAt):Date.now()+120000,error};readiness.set(manga.id,result);while(readiness.size>2000)readiness.delete(readiness.keys().next().value);
   core.lastCheck={...result,id:manga.id};safety.changed();if(result.ready&&typeof window!=='undefined')window.dispatchEvent(new Event('kuro:readable-updated'));return result;
  })();record.promise=task;checks.set(key,record);task.finally(()=>{if(checks.get(key)===record)checks.delete(key);});return task;
 }
 const listing=createListingQueue({step:checkListing,isVisible:()=>typeof document==='undefined'||!document.hidden});
 function preferences(currentRegistry=core.registry){
  if(!store||!manager)return;const old=store.getState().sourcePreferences,next={...old};let changed=false;
  currentRegistry={...currentRegistry,providers:currentRegistry.providers.map(policyProvider)};
  core.registry=currentRegistry;const eligible=new Set(currentRegistry.providers.filter(p=>providerState(p,{},!!manager.get(p.id)).canEnable).map(p=>p.id));if([...eligible].sort().join('|')!==[...runtimeEligible].sort().join('|'))changed=true;runtimeEligible=eligible;
  // On is reserved for usable connections. Retain a reason for an old unusable
  // selection, without restoring it or silently enabling a different reader.
  for(const p of currentRegistry.providers){const previous=next[p.id],usable=providerState(p,previous,!!manager.get(p.id)).canEnable;
   const enabled=usable&&(typeof previous?.enabled==='boolean'?previous.enabled:['mangadex','anilist'].includes(p.id)),unavailableSelection=!usable&&(previous?.unavailableSelection===true||previous?.enabled===true);
   if(previous?.selectionVersion===2&&previous.enabled===enabled&&previous.unavailableSelection===unavailableSelection)continue;
   next[p.id]={...previous,enabled,unavailableSelection,selectionVersion:2,language:previous?.language||p.language||'en',readingMode:previous?.readingMode||(p.id==='guya'?'RTL':undefined)};changed=true;}
  if(manager.get('local')&&next.local?.selectionVersion!==2){next.local={...next.local,enabled:typeof next.local?.enabled==='boolean'?next.local.enabled:true,selectionVersion:2,language:next.local?.language||'en'};changed=true;}
  if(changed)store.setState({sourcePreferences:next});
 }
 async function checkChapter(manga,chapter){await safety.verify(manga,chapter,true);const manifest=await manager.require(manga.sourceId).getChapterPages(chapter);if(!completeManifest(manifest,manga.sourceId==='local'))throw new Error('The complete chapter could not be verified.');const expiresAt=Math.min(Date.now()+120000,manifest.expiresAt||Date.now()+120000);if(expiresAt<=Date.now())throw new Error('Chapter proof expired. Retry.');const at=Number.isFinite(manifest.readabilityAsOf)?manifest.readabilityAsOf:Date.now(),revision=manifest.inventoryRevision||0;if(olderSnapshot(manga.id,at,revision))throw new Error('Chapter verification changed. Retry.');rememberSnapshot(manga.id,at,true,revision);readiness.set(manga.id,{ready:true,checkedAt:Date.now(),expiresAt});return manifest;}
 function initialize(id,api,require){
  if(id===1341)return {...api,HomeScreen:sourceScreen(require(15),api.HomeScreen,core,require)};
  if(id===1670)return {...api,SearchScreen:sourceScreen(require(15),api.SearchScreen,core,require,true)};
  if(id===1687)return {...api,SourceSettingsCard:sourceSettingsCard(require(15),api.SourceSettingsCard,core)};
  if(id===861)return createCatalogueHttp(api,url=>require(862).resolveFetchUrl(url),{getRetryAt:()=>sourceRetryAt.get('mangadex')||0,onBackoff:until=>sourceRetryAt.set('mangadex',Math.max(sourceRetryAt.get('mangadex')||0,until))});
  if(id===1597)return {...api,useDiscovery:progressiveDiscovery(require)};
  if([1700,1703,1697].includes(id))return emailAuthExtension(id,api,require);
  if(id===789){manager=api.sourceManager;installAdapters(manager,registry,{request,origin:location.origin});if(local)manager.register(local.adapter);
   for(const adapter of manager.all()){
    if(adapter.id==='local')continue;
    if(providerContentPolicy({id:adapter.id}).state!=='eligible'){
     adapter.capabilities={...adapter.capabilities,readable:false,search:false,popular:false,latest:false,trending:false};adapter.getBaseUrl=()=>'';
     for(const name of ['search','getPopular','getLatestUpdates','getTrending'])adapter[name]=async()=>[];
     adapter.searchPage=async()=>({items:[],notice:CONTENT_MESSAGE});for(const name of ['getMangaDetails','getChapterList','getChapterPages'])adapter[name]=async()=>{throw new Error(CONTENT_MESSAGE);};continue;
    }
    for(const name of ['search','searchPage','getPopular','getLatestUpdates','getTrending']){
     const original=adapter[name];if(!original)continue;adapter[name]=async(...args)=>{const value=await original.apply(adapter,args),rows=Array.isArray(value)?value:value.items||[],safe=[];
      for(const row of rows){if(row.sourceId!==adapter.id)continue;let approved=safety.current(row.sourceId,row.id)||safety.remember(row);if(!approved)try{approved=await safety.verify(row);}catch{continue;}safe.push({...row,...approved.manga});}return Array.isArray(value)?safe:{...value,items:safe};};
    }
    adapter.getMangaDetails=async identity=>(await safety.verify({id:identity,sourceId:adapter.id},undefined,true)).manga;
    const chapters=adapter.getChapterList;adapter.getChapterList=async identity=>{await safety.verify({id:identity,sourceId:adapter.id});return chapters.call(adapter,identity);};
   }
   const enabled=manager.enabled;manager.enabled=ids=>enabled.call(manager,ids.filter(id=>id==='local'||runtimeEligible.has(id)));
   manager.getMangaDetails=async manga=>(await safety.verify(manga,undefined,true)).manga;
  }
  if(id===1249){if(local)local.connect(api.useLibraryStore,require);return {...api,useLibraryStore:safety.wrapStore(require(15),api.useLibraryStore,'library')};}
  if(id===1602&&local){const history=api.useHistoryStore,original=history.getState().record,progress=history.getState().updateProgress;history.setState({
   record:row=>{if(row.sourceId!=='local')return original(row);if(local.mayRecord(row.mangaId)){local.mergeHistory(history);original(local.normalizeHistory(row));}},
   updateProgress:(id,patch)=>{const book=String(id).match(/^(local-[a-f0-9]{64})-chapter-1$/)?.[1];if(!book)return progress(id,patch);if(local.mayRecord(book)){local.mergeHistory(history);progress(id,patch);}}
  });return {...api,useHistoryStore:safety.wrapStore(require(15),history,'history')};}
  if(id===1660&&local)return {...api,LibraryScreen:libraryExtension(require(15),api.LibraryScreen,local)};
  if(id===1536)return {...api,PosterArtwork:artworkExtension(require(15),api.PosterArtwork,require(282).default,require(862).resolveImageSource)};
  if(id===1706)installIdentity(()=>api,[...providers.filter(p=>p.available&&p.adapter!=='legacy').map(p=>p.id),'local']);
  if(id===1705||id===1722)return {...api,default:safety.route(require(15),require,id===1722)};
  if(id===862){const original=api.resolveFetchUrl;api.resolveFetchUrl=(value,headers)=>{
   try{const url=new URL(value);if(url.origin==='https://api.mangadex.org'&&!url.username&&!url.password)return location.origin+'/api/catalogue/mangadex?path='+encodeURIComponent(url.pathname+url.search);}catch{}
   try{const url=new URL(value,location.origin);if(url.origin===location.origin||url.protocol==='blob:'&&local?.ownsUrl(value))return value;}catch{}return location.origin+'/api/catalogue/blocked';
  };api.resolveImageSource=safety.resolveImage;}
  if(id===873){const safeUrl=builder=>(...args)=>{const url=new URL(builder(...args));url.searchParams.delete('contentRating[]');url.searchParams.set('contentRating[]','safe');return url.href;};return {...api,RATINGS:['safe'],buildListUrl:safeUrl(api.buildListUrl),buildFeedUrl:safeUrl(api.buildFeedUrl)};}
  if(id===784){store=api.useSettingsStore;preferences();store.persist?.onFinishHydration?.(()=>preferences());
   const originalReset=store.getState().resetToDefaults;
   const known=id=>core.registry.providers.some(p=>p.id===id)||id==='local'&&manager.get(id);
   const usable=id=>id==='local'?!!manager.get(id):core.sourceState(id).canEnable;
   const resetSourceDefaults=()=>{const sourcePreferences=store.getState().sourcePreferences;store.setState({sourcePreferences:Object.fromEntries(Object.entries(sourcePreferences).map(([id,p])=>[id,{...p,enabled:usable(id)&&['local','mangadex','anilist'].includes(id),unavailableSelection:false,selectionVersion:2}]))});};
   store.setState({setSourceEnabled:(id,value)=>{if(!known(id))return;const sourcePreferences=store.getState().sourcePreferences,allowed=usable(id);store.setState({sourcePreferences:{...sourcePreferences,[id]:{...sourcePreferences[id],enabled:allowed&&!!value,unavailableSelection:!allowed&&!!value,selectionVersion:2}}});},setAllSourcesEnabled:value=>{const sourcePreferences=store.getState().sourcePreferences;store.setState({sourcePreferences:Object.fromEntries(Object.entries(sourcePreferences).map(([id,p])=>[id,{...p,enabled:known(id)&&usable(id)&&!!value,unavailableSelection:false,selectionVersion:2}]))});},resetSourceDefaults,resetToDefaults:()=>{originalReset();store.setState({sourcePreferences:{}});preferences(core.registry);}});
   const activeIds=state=>Object.keys(state.sourcePreferences).filter(id=>state.sourcePreferences[id]?.enabled&&manager.get(id)&&(id==='local'||runtimeEligible.has(id))).sort();
   let previous=store.getState().sourcePreferences,previousActive=JSON.stringify(activeIds(store.getState()));store.subscribe(state=>{if(state.sourcePreferences===previous)return;previous=state.sourcePreferences;preferences(core.registry);const active=JSON.stringify(activeIds(store.getState()));if(active!==previousActive){previousActive=active;notify();}});
   // Legacy hooks call require() for these IDs. Never pass external, unresolved
   // or content-ineligible selections into a reader/query that cannot use them.
   return {...api,selectEnabledSourceIds:activeIds};
  }
  if(id===790)api.uniqueChapters=uniqueChapters;
  if(id===794)api.groupEditions=items=>groupSeries(items,true);
  if(id===870)api.mergePages=pages=>[...new Map(pages.flatMap(page=>page.items).filter(admitted).map(row=>[row.id,row])).values()];
  if(id===791)api.mergeSearchResults=(query,lists)=>groupSeries(lists.flat()).map(g=>({...g.primary,editions:g.editions,relevance:Math.max(...[g.primary.title,...g.primary.altTitles||[]].map(title=>api.relevanceScore(query,title)))})).sort((a,b)=>b.relevance-a.relevance);
  if(id===1342)api.homeSections=(popular,latest,excluded=[])=>{
   popular=popular.filter(admitted);latest=latest.filter(admitted);const groups=groupSeries([...popular,...latest,...excluded]),map=new Map();groups.forEach((g,i)=>g.editions.forEach(row=>map.set(row.id,i)));const used=new Set(excluded.map(row=>map.get(row.id)));
   const take=(rows,count)=>{const result=[];for(const row of rows){const index=map.get(row.id);if(used.has(index))continue;used.add(index);result.push(row);if(result.length===count)break;}return result;};
   return {featured:take(popular,5),updates:take(latest,6),popular:take(popular,16),moreUpdates:take(latest,16)};
  };
  if(id===875){const original=api.mapManga;api.mapManga=(raw,...args)=>{if(!classifyMangaDex(raw).allowed)throw new Error(CONTENT_MESSAGE);const row=original(raw,...args),mal=String(raw.attributes?.links?.mal||'');if(/^\d+$/.test(mal))row.identityKeys=[...new Set([...(row.identityKeys||[]),'mal:'+mal])];row.coverUrl=location.origin+'/api/catalogue/cover?provider=mangadex&id='+row.id;row.contentApproval=raw.kuroContentApproval;
   const approved=safety.remember(row),proof=raw.kuroReadability,now=Date.now();
   const valid=!!approved&&proof?.ready===true&&proof.mangaId===row.id&&/^mangadex:[0-9a-f-]{36}$/i.test(proof.chapterId||'')&&proof.version==='complete-chapter-1'&&proof.policyVersion===CONTENT_POLICY_VERSION&&proof.validation==='complete-chapter'&&Number.isInteger(proof.validatedPages)&&proof.validatedPages>0&&proof.validatedPages<=500&&proof.validatedPages===proof.pageCount&&Number.isFinite(proof.checkedAt)&&proof.checkedAt<=now+5000&&Number.isFinite(proof.expiresAt)&&proof.expiresAt>now&&proof.expiresAt<=proof.checkedAt+21600000;
   if(Object.hasOwn(raw,'kuroReadability')&&rememberSnapshot(row.id,raw.kuroReadabilityAsOf,valid,raw.kuroReadabilityRevision||0)){readiness.delete(row.id);listingProgress.delete(row.id);for(const [key,record]of checks)if(record.id===row.id){record.invalidated=true;checks.delete(key);}if(valid){readiness.set(row.id,{ready:true,checkedAt:now,expiresAt:Math.min(now+120000,proof.expiresAt)});while(readiness.size>2000)readiness.delete(readiness.keys().next().value);}}
   return row;};}
  if(id===1389){api.checkReadability=check;api.cachedReadability=cached;api.forgetReadability=key=>readiness.delete(key);}
  if(id===1388){const React=require(15),router=require(11);api.useReadyCollection=function(items,active){
   active=true;
   const [revision,setRevision]=React.useState(0),[retry,setRetry]=React.useState(0),[paused,setPaused]=React.useState(false);
   const ageRevision=React.useSyncExternalStore(safety.subscribe,safety.getSnapshot);
   React.useEffect(()=>{const expires=items.map(row=>cached(row.id)).filter(readinessFresh).map(value=>Math.min(value.expiresAt,value.checkedAt+120000));if(!expires.length)return;const timer=setTimeout(()=>{setRetry(x=>x+1);setRevision(x=>x+1);},Math.max(1,Math.min(...expires)-Date.now()+1));return()=>clearTimeout(timer);},[items,revision,ageRevision]);
   router.useFocusEffect(React.useCallback(()=>{
    if(!active||paused||document.hidden)return;
    const listener=()=>{setRetry(x=>x+1);setRevision(x=>x+1);};subscribers.add(listener);
    const queue=items.filter(row=>{const value=cached(row.id);return !(value&&(!value.ready||admitted(row)));});
    const stop=listing.watch(queue,()=>setRevision(x=>x+1));
    return()=>{stop();subscribers.delete(listener);};
   },[active,retry,items,paused,ageRevision]));
   const result=React.useMemo(()=>{const ready=[];let pending=0,unavailable=0;
    for(const row of items){const value=cached(row.id);if(!readinessFresh(value)||value.ready&&!admitted(row))pending++;else if(value.ready)ready.push(row);else unavailable++;}return {items:groupSeries(ready,true).map(g=>g.primary),pending,unavailable};
   },[active,items,revision,safety.getSnapshot()]);return {...result,paused,setPaused,retry:()=>{for(const row of items)readiness.delete(row.id);setPaused(false);setRetry(x=>x+1);setRevision(x=>x+1);}};
  };}
  if(id===1595){const original=api.useChapterPages;api.useChapterPages=function(chapter){const query=original(chapter);if(activeChapter!==chapter){activeChapter=chapter;queueMicrotask(()=>window.dispatchEvent(new CustomEvent('kuro:active-chapter-changed',{detail:chapter})));}if(query.data?.verified){manifests.set(chapter,query.data);queueMicrotask(emitCredits);}return query;};}
 }
 const core={registry,initialize,local,safety,notify,resume:()=>{listing.resume();for(const fn of subscribers)fn(false);},preferences,check,checkListing,checkChapter,cached,sourceState:id=>providerState(core.registry.providers.find(p=>p.id===id),store?.getState().sourcePreferences[id],!!manager?.get(id)),replayCredits:emitCredits,get manager(){return manager;},get store(){return store;},get epoch(){return epoch;},lastCheck:null};safety.configureReadability(check,cached,checkChapter);return core;
}
function installBootstrap(core){
 let define;const ids=new Set([789,784,1706,790,794,870,791,1342,875,1389,1388,1595,1597,861,862,1249,1660,1536,1602,1705,1722,873,1700,1703,1697,1341,1670,1687]);
 Object.defineProperty(window,'__d',{configurable:true,get:()=>define,set(original){define=function(factory,id,dependencies,...rest){
  if(!ids.has(id))return original(factory,id,dependencies,...rest);
  const wrapped=function(global,require,importDefault,importAll,module,exports,map){
   let manager,all;if(id===784){manager=require(789).sourceManager;all=manager.all;manager.all=()=>all.call(manager).filter(p=>core.registry.providers.every(x=>x.id!==p.id||x.adapter==='legacy'));}
   try{factory.apply(this,arguments);}finally{if(all)manager.all=all;}
   const replacement=core.initialize(id,module.exports,require);if(replacement)module.exports=replacement;
  };return original(wrapped,id,dependencies,...rest);
 };}});
}
if(typeof window!=='undefined'){const core=createCatalogueCore(__KURO_BOOTSTRAP_PROVIDERS__);window.KuroCatalogueCore=core;installBootstrap(core);}
