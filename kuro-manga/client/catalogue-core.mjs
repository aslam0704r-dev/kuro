import { installAdapters, installIdentity } from '../dist/catalogue-runtime.mjs';
import { groupSeries, uniqueChapters } from '../dist/catalogue-model.mjs';
import {createLocalRuntime} from './local/runtime.mjs';
import {libraryExtension} from './local/ui.mjs';
import {artworkExtension} from './mobile-artwork.mjs';
import {createContentRuntime} from './content-runtime.mjs';
import {emailAuthExtension} from './email-auth.mjs';
import {CONTENT_MESSAGE,CONTENT_POLICY_VERSION,classifyMangaDex,policyProvider,providerContentPolicy} from './content-policy.mjs';
export const completeManifest=(manifest,local=false)=>manifest?.verified===true&&Array.isArray(manifest.pages)&&manifest.pages.length>0&&(local?manifest.validation==='device':manifest.validation==='complete-chapter'&&manifest.validatedPages===manifest.pages.length&&manifest.pageCount===manifest.pages.length);
export const readinessFresh=value=>!!value&&Date.now()-value.checkedAt<120000&&value.expiresAt>Date.now();

// This trusted local bootstrap runs before Metro starts the exported app. The
// immutable export's factory interface is intercepted only at the listed IDs.
// Upstream scripts and data are never evaluated here.
export function createCatalogueCore(providers){
 providers=providers.map(policyProvider);const registry={providers},subscribers=new Set(),readiness=new Map(),checks=new Map(),manifests=new Map();let epoch=0,manager,store,activeChapter;
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
  const query=new URLSearchParams();for(const [name,value]of Object.entries(params))if(value!==undefined)query.set(name,typeof value==='object'?JSON.stringify(value):String(value));
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);try{
   const response=await fetch('/api/catalogue/provider/'+id+'/'+action+'?'+query,{credentials:'same-origin',headers:{Accept:'application/json'},signal:controller.signal});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Provider unavailable. Retry later.');
   if(action==='pages'&&data.result?.contentApproval?.version!==CONTENT_POLICY_VERSION)throw new Error(CONTENT_MESSAGE);return data.result;
  }catch(error){if(error.name==='AbortError')throw new Error('Provider request timed out. Retry later.');throw error;}finally{clearTimeout(timer);}
 }
 const emitCredits=()=>{if(typeof window!=='undefined'&&activeChapter&&manifests.has(activeChapter))window.dispatchEvent(new CustomEvent('kuro:active-chapter-manifest',{detail:manifests.get(activeChapter)}));};
 function notify(){epoch++;readiness.clear();for(const fn of subscribers)fn();if(typeof window!=='undefined')window.dispatchEvent(new Event('kuro:catalogue-updated'));}
 const cached=id=>{const value=readiness.get(id);return readinessFresh(value)?value:undefined;};
 async function check(manga){
  const hit=cached(manga.id);if(hit){if(hit.ready)try{await safety.verify(manga);}catch{return {ready:false,checkedAt:Date.now(),expiresAt:Date.now()+120000,error:CONTENT_MESSAGE};}if(readinessFresh(hit))return hit;}const started=epoch,key=started+':'+manga.id;if(checks.has(key))return checks.get(key);
  const task=(async()=>{let ready=false,error,expiresAt=Date.now()+120000;try{
   await safety.verify(manga);
   const adapter=manager.require(manga.sourceId);if(adapter.capabilities.readable!==false&&!manga.catalogueOnly&&!manga.publisherUrl){
    if(manga.sourceId==='mangadex')try{const response=await fetch('/api/catalogue/readable/check?'+new URLSearchParams({provider:manga.sourceId,id:manga.id}),{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000)}),proof=await response.json();ready=response.ok&&proof.ready===true&&proof.validation==='complete-chapter'&&proof.validatedPages>0&&proof.validatedPages===proof.pageCount&&proof.expiresAt>Date.now();if(ready)expiresAt=Math.min(Date.now()+120000,proof.expiresAt);}catch{}
    if(!ready){const chapters=await adapter.getChapterList(manga.id);for(const chapter of chapters.slice(0,10)){try{const manifest=await adapter.getChapterPages(chapter.id);ready=completeManifest(manifest,manga.sourceId==='local');if(ready){expiresAt=Math.min(Date.now()+120000,manifest.expiresAt||Date.now()+120000);break;}}catch(e){error=e.message;}}}
   }
   if(ready)await safety.verify(manga,undefined,true);
  }catch(e){ready=false;error=e.message;}
   if(started!==epoch)return {ready:false,checkedAt:0,obsolete:true};
   const result={ready:ready&&expiresAt>Date.now(),checkedAt:Date.now(),expiresAt,error};readiness.set(manga.id,result);while(readiness.size>2000)readiness.delete(readiness.keys().next().value);
   core.lastCheck={...result,id:manga.id};safety.changed();if(ready&&typeof window!=='undefined')window.dispatchEvent(new Event('kuro:readable-updated'));return result;
  })();checks.set(key,task);task.finally(()=>checks.delete(key));return task;
 }
 function preferences(currentRegistry=registry){
  if(!store||!manager)return;const old=store.getState().sourcePreferences,next={...old};let changed=false;
  currentRegistry={...currentRegistry,providers:currentRegistry.providers.map(policyProvider)};
  for(const id of Object.keys(next))if((!manager.get(id)||id!=='local'&&providerContentPolicy({id}).state!=='eligible')&&next[id].enabled){next[id]={...next[id],enabled:false};changed=true;}
  for(const p of currentRegistry.providers.filter(p=>manager.get(p.id))){if(!next[p.id]){next[p.id]={enabled:!!p.defaultEnabled&&p.available!==false,language:p.language||'en',readingMode:p.id==='guya'?'RTL':undefined};changed=true;}
   if(p.available===false&&next[p.id].enabled){next[p.id]={...next[p.id],enabled:false};changed=true;}}
  if(changed)store.setState({sourcePreferences:next});
 }
 async function checkChapter(manga,chapter){await safety.verify(manga,chapter,true);const manifest=await manager.require(manga.sourceId).getChapterPages(chapter);if(!completeManifest(manifest,manga.sourceId==='local'))throw new Error('The complete chapter could not be verified.');const expiresAt=Math.min(Date.now()+120000,manifest.expiresAt||Date.now()+120000);if(expiresAt<=Date.now())throw new Error('Chapter proof expired. Retry.');readiness.set(manga.id,{ready:true,checkedAt:Date.now(),expiresAt});return manifest;}
 function initialize(id,api,require){
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
   const enabled=manager.enabled;manager.enabled=ids=>enabled.call(manager,ids.filter(id=>id==='local'||providerContentPolicy({id}).state==='eligible'));
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
   const originalAll=store.getState().setAllSourcesEnabled,originalReset=store.getState().resetToDefaults,originalEnable=store.getState().setSourceEnabled;
   store.setState({setSourceEnabled:(id,value)=>originalEnable(id,value&&(id==='local'||providerContentPolicy({id}).state==='eligible')),setAllSourcesEnabled:value=>{originalAll(value);preferences(core.registry);},resetToDefaults:()=>{originalReset();preferences(core.registry);}});
   let previous=JSON.stringify(store.getState().sourcePreferences);store.subscribe(state=>{const value=JSON.stringify(state.sourcePreferences);if(value!==previous){previous=value;preferences(core.registry);notify();}});
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
  if(id===875){const original=api.mapManga;api.mapManga=(raw,...args)=>{if(!classifyMangaDex(raw).allowed)throw new Error(CONTENT_MESSAGE);const row=original(raw,...args),mal=String(raw.attributes?.links?.mal||'');if(/^\d+$/.test(mal))row.identityKeys=[...new Set([...(row.identityKeys||[]),'mal:'+mal])];row.coverUrl=location.origin+'/api/catalogue/cover?provider=mangadex&id='+row.id;row.contentApproval=raw.kuroContentApproval;safety.remember(row);return row;};}
  if(id===1389){api.checkReadability=check;api.cachedReadability=cached;api.forgetReadability=key=>readiness.delete(key);}
  if(id===1388){const React=require(15),router=require(11);api.useReadyCollection=function(items,active){
   active=true;
   const entries=React.useRef(new Map()),[revision,setRevision]=React.useState(0),[retry,setRetry]=React.useState(0),[paused,setPaused]=React.useState(false);
   const ageRevision=React.useSyncExternalStore(safety.subscribe,safety.getSnapshot);
   React.useEffect(()=>{const expires=items.map(row=>entries.current.get(row.id)||cached(row.id)).filter(readinessFresh).map(value=>Math.min(value.expiresAt,value.checkedAt+120000));if(!expires.length)return;const timer=setTimeout(()=>{entries.current.clear();setRetry(x=>x+1);setRevision(x=>x+1);},Math.max(1,Math.min(...expires)-Date.now()+1));return()=>clearTimeout(timer);},[items,revision,ageRevision]);
   router.useFocusEffect(React.useCallback(()=>{
    if(!active||paused||document.hidden)return;let alive=true,index=0;
    const listener=(invalidate=true)=>{if(invalidate)entries.current.clear();setRetry(x=>x+1);setRevision(x=>x+1);};subscribers.add(listener);
    const queue=items.filter(row=>{const value=cached(row.id);if(value&&(!value.ready||admitted(row))){entries.current.set(row.id,value);return false;}return true;});
    const work=async()=>{while(alive&&!document.hidden){const row=queue[index++];if(!row)break;const value=await check(row);if(alive&&!value.obsolete){entries.current.set(row.id,value);setRevision(x=>x+1);}}};work();work();
    return()=>{alive=false;subscribers.delete(listener);};
   },[active,retry,items,paused,ageRevision]));
   const result=React.useMemo(()=>{const ready=[];let pending=0,unavailable=0;
    for(const row of items){const value=entries.current.get(row.id)||cached(row.id);if(!readinessFresh(value)||value.ready&&!admitted(row))pending++;else if(value.ready)ready.push(row);else unavailable++;}return {items:groupSeries(ready,true).map(g=>g.primary),pending,unavailable};
   },[active,items,revision,safety.getSnapshot()]);return {...result,paused,setPaused,retry:()=>{for(const row of items)readiness.delete(row.id);entries.current.clear();setPaused(false);setRetry(x=>x+1);setRevision(x=>x+1);}};
  };}
  if(id===1595){const original=api.useChapterPages;api.useChapterPages=function(chapter){const query=original(chapter);if(activeChapter!==chapter){activeChapter=chapter;queueMicrotask(()=>window.dispatchEvent(new CustomEvent('kuro:active-chapter-changed',{detail:chapter})));}if(query.data?.verified){manifests.set(chapter,query.data);queueMicrotask(emitCredits);}return query;};}
 }
 const core={registry,initialize,local,safety,notify,resume:()=>{for(const fn of subscribers)fn(false);},preferences,check,checkChapter,cached,replayCredits:emitCredits,get manager(){return manager;},get store(){return store;},get epoch(){return epoch;},lastCheck:null};safety.configureReadability(check,cached,checkChapter);return core;
}
function installBootstrap(core){
 let define;const ids=new Set([789,784,1706,790,794,870,791,1342,875,1389,1388,1595,862,1249,1660,1536,1602,1705,1722,873,1700,1703,1697]);
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
