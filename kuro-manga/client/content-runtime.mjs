import {CONTENT_MESSAGE,CONTENT_POLICY_VERSION,RATING_TTL_MS,UUID,providerContentPolicy,forbiddenText,blockedIdentity} from './content-policy.mjs';
import {groupSeries} from '../dist/catalogue-model.mjs';
const keyOf=(source,id,chapter='')=>source+'|'+id+'|'+chapter;
const coverUrl=(source,id)=>location.origin+'/api/catalogue/cover?provider='+encodeURIComponent(source)+'&id='+encodeURIComponent(id);
const EMPTY_IMAGE='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
export function createContentRuntime(local){
 const approvals=new Map(),pending=new Map(),listeners=new Set(),queue=[],queued=new Set(),projections=new WeakMap();let revision=0,workers=0;
 let readableCheck,readableCached,readableChapter,readableForget;
 const emit=()=>{revision++;for(const fn of listeners)fn();};
 const valid=row=>row?.expires>Date.now()&&row.allowed;
 function current(source,id,chapter=''){if(blockedIdentity(source,id,chapter))return;const row=approvals.get(keyOf(source,id,chapter));return valid(row)?row:undefined;}
 function remember(manga,chapter){
  const checkedAt=manga?.contentApproval?.checkedAt;
  if(!['mangadex','anilist'].includes(manga?.sourceId)||blockedIdentity(manga.sourceId,manga.id,chapter?.id)||manga.contentApproval?.version!==CONTENT_POLICY_VERSION||!Number.isFinite(checkedAt)||checkedAt>Date.now()+5000||checkedAt+RATING_TTL_MS<=Date.now())return;
  const row={allowed:true,manga:{...manga,coverUrl:coverUrl(manga.sourceId,manga.id)},chapter,expires:checkedAt+RATING_TTL_MS};
  approvals.set(keyOf(manga.sourceId,manga.id),row);if(chapter)approvals.set(keyOf(manga.sourceId,manga.id,chapter.id),row);
  while(approvals.size>2400)approvals.delete(approvals.keys().next().value);emit();return row;
 }
 async function verify(manga,chapter,force=false){
  const source=manga?.sourceId,id=manga?.id,identity=typeof chapter==='string'?chapter:chapter?.id,key=keyOf(source,id,identity);
  if(source==='local'){
   const allowed=await local?.approval(id,identity);if(!allowed)throw new Error(CONTENT_MESSAGE);return {allowed:true,manga:local.manga(allowed),...identity?{chapter:local.chapters(allowed)[0]}:{}};
  }
  if(providerContentPolicy({id:source}).state!=='eligible'||blockedIdentity(source,id,identity))throw new Error(CONTENT_MESSAGE);
  if(!force){const hit=current(source,id,identity);if(hit)return hit;}
  if(pending.has(key))return pending.get(key);
  const task=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
   try{
    const q=new URLSearchParams({provider:source,id});if(identity)q.set('chapter',identity);
    const response=await fetch('/api/catalogue/content/check?'+q,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'},signal:controller.signal}),data=await response.json();
    if(!response.ok||data.allowed!==true||data.policyVersion!==CONTENT_POLICY_VERSION||data.manga?.id!==id||data.manga?.sourceId!==source||identity&&data.chapter?.id!==identity)throw new Error(CONTENT_MESSAGE);
    const row=remember(data.manga,data.chapter);if(!row)throw new Error('Content approval expired. Retry when the source is available.');return row;
   }catch(error){approvals.set(key,{allowed:false,expires:Date.now()+RATING_TTL_MS});if(!identity)approvals.delete(keyOf(source,id));emit();throw error;}
   finally{clearTimeout(timer);}
  })();pending.set(key,task);try{return await task;}finally{pending.delete(key);}
 }
 function enqueue(manga,chapter){if(providerContentPolicy({id:manga.sourceId}).state!=='eligible'||blockedIdentity(manga.sourceId,manga.id,chapter))return;const key=keyOf(manga.sourceId,manga.id,chapter);if(current(manga.sourceId,manga.id,chapter)&&readableCached?.(manga.id)||queued.has(key)||approvals.get(key)?.allowed===false&&approvals.get(key)?.expires>Date.now())return;queued.add(key);queue.push({manga,chapter,key});pump();}
 function pump(){while(workers<2&&queue.length){workers++;const {manga,chapter,key}=queue.shift();verify(manga,chapter).then(()=>readableCheck?.(manga)).catch(()=>{}).finally(()=>{queued.delete(key);workers--;emit();pump();});}}
 function project(state,kind){
  const previous=projections.get(state);if(previous?.revision===revision&&previous.kind===kind)return previous.state;
  const entries=kind==='library'?Object.values(state.entries):state.entries||[],visible=[];
  for(const item of entries){const id=kind==='library'?item.id:item.mangaId,source=item.sourceId,chapter=kind==='history'?item.chapterId:undefined;
   if(source==='local'){
    const book=local?.books.find(b=>b.id===id);if(book){const manga=local.manga(book);visible.push(kind==='library'?{...item,...manga,chapters:local.chapters(book)}:{...item,mangaTitle:manga.title,coverUrl:manga.coverUrl,chapterTitle:'Imported comic'});}continue;
   }
   const approved=current(source,id,chapter);if(approved&&readableCached?.(id)?.ready){const manga=approved.manga;visible.push(kind==='library'?{...item,...manga,chapters:(item.chapters||[]).filter(c=>!forbiddenText(c.title)).map(c=>({...c,title:'Chapter '+c.chapterNumber}))}:{...item,mangaTitle:manga.title,coverUrl:manga.coverUrl,chapterTitle:approved.chapter?.title||'Chapter '+item.chapterNumber});}
   else queueMicrotask(()=>enqueue({id,sourceId:source},chapter));
  }
  const result={...state,entries:kind==='library'?Object.fromEntries(groupSeries(visible,true).map(g=>[g.primary.id,g.primary])):visible};projections.set(state,{revision,kind,state:result});return result;
 }
 function wrapStore(React,original,kind){
  function safeStore(selector=value=>value){React.useSyncExternalStore(api.subscribe,api.getSnapshot);return original(state=>selector(project(state,kind)));}
  Object.assign(safeStore,original);safeStore.getVisibleState=()=>project(original.getState(),kind);return safeStore;
 }
 function resolveImage(value){
  try{const url=new URL(value,location.origin);
   if(url.protocol==='blob:')return local?.ownsUrl(value)?{uri:value}:{uri:EMPTY_IMAGE};
   if(url.protocol==='data:')return {uri:EMPTY_IMAGE};
   if(url.origin===location.origin){if(url.pathname.startsWith('/assets/')||['/api/profile/avatar','/api/catalogue/page','/api/catalogue/cover'].includes(url.pathname))return {uri:url.href};return {uri:EMPTY_IMAGE};}
   const match=url.hostname==='uploads.mangadex.org'&&/^\/covers\/([^/]+)\//.exec(url.pathname);if(match&&UUID.test(match[1]))return {uri:coverUrl('mangadex','mangadex-'+match[1].toLowerCase())};
  }catch{}return {uri:EMPTY_IMAGE};
 }
 function route(React,require,reader){
  const h=React.createElement,router=require(11),codec=require(1601),Screen=reader?require(1723).ReaderScreen:require(1707).MangaDetailScreen;
  return function ContentGuard(){
   const params=router.useLocalSearchParams(),identity=Array.isArray(params.chapterId)?params.chapterId[0]:params.chapterId,decoded=reader?codec.decodeReader(params,identity||''):{manga:codec.decodeManga(params)},manga=decoded.manga,chapter=reader?decoded.chapter?.id:undefined;
   const key=keyOf(manga?.sourceId,manga?.id,chapter),[result,setResult]=React.useState({key:'',pending:true}),[attempt,setAttempt]=React.useState(0);
   React.useEffect(()=>{let alive=true,checking=false;setResult({key,pending:true});
    const check=()=>{if(checking)return;checking=true;return verify(manga,chapter,true).then(async data=>{if(reader)await readableChapter?.(data.manga,chapter);else {const proof=await readableCheck?.(data.manga);if(!proof?.ready)throw new Error(proof?.error||'No complete readable chapter has been verified.');}if(alive)setResult({key,data});}).catch(error=>{if(alive)setResult({key,error:true,temporary:/pending|timed out|timeout|rate limit|network|retry shortly/i.test(error.message)});}).finally(()=>{checking=false;});};check();
    const timer=setInterval(check,RATING_TTL_MS),visible=()=>{if(!document.hidden)check();};document.addEventListener('visibilitychange',visible);
    return()=>{alive=false;clearInterval(timer);document.removeEventListener('visibilitychange',visible);};},[key,attempt]);
   // Do not mount the old screen (or record history) before canonical admission.
   if(result.key!==key||result.pending)return h('main',{className:'kuro-content-state',role:'status'},h('span',{},'KURO /'),h('h1',{},'Checking the complete chapter…'),h('p',{},'KURO checks the content rating and every page before opening a story. Long chapters may take a moment.'));
   if(result.error)return h('main',{className:'kuro-content-state',role:'alert'},h('span',{},'KURO STORY CHECK'),h('h1',{},result.temporary?'This chapter is still preparing':'This title is unavailable'),h('p',{},result.temporary?'The source is slow or temporarily busy. Retry to resume the saved chapter check.':CONTENT_MESSAGE+' A complete readable chapter must also be verified.'),h('button',{type:'button',onClick:()=>{readableForget?.(manga?.id);setAttempt(value=>value+1);}},'Retry check'),h('button',{type:'button',onClick:()=>router.router.replace('/library')},'Back to library'));
   return h(Screen,{manga:result.data.manga,...reader?{chapter:result.data.chapter,readingMode:['WEBTOON','LTR','RTL'].includes(params.readingMode)?params.readingMode:undefined}:{}});
  };
 }
 const api={verify,current,remember,wrapStore,resolveImage,route,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},getSnapshot:()=>revision,project,changed:emit,configureReadability:(check,cached,chapter,forget)=>{readableCheck=check;readableCached=cached;readableChapter=chapter;readableForget=forget;}};
 if(typeof window!=='undefined'){
  local?.subscribe(emit);setInterval(()=>{for(const [key,row]of approvals)if(row.expires<=Date.now())approvals.delete(key);emit();},RATING_TTL_MS);
 }
 return api;
}
