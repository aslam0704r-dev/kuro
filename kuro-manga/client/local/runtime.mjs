import {createDeviceStore} from './store.mjs';
import {isLocalId,chapterId,LIMITS,cleanDisplayTitle} from './model.mjs';
import {admitDevicePages,reviewedIdentity} from './content.mjs';
import {coverFor} from './images.mjs';
import {CONTENT_MESSAGE,forbiddenText} from '../content-policy.mjs';
export function createLocalRuntime(){
 const db=createDeviceStore(),listeners=new Set(),covers=new Map(),pageUrls=new Map(),deleted=new Set();
 let library,requireRuntime,books=[],error='',revision=0,queryClient,loading=true,hiddenCount=0;
 const channel=typeof BroadcastChannel==='function'?new BroadcastChannel('kuro-device-books-v1'):null;
 function emit(){revision++;for(const fn of listeners)fn();}
 const book=id=>books.find(b=>b.id===id);
 function mergeHistory(history){
  const storage=requireRuntime(894),persisted=storage.readJson(storage.STORAGE_KEYS.history,[]),merged=new Map();
  for(const row of [...(Array.isArray(persisted)?persisted:[]),...history.getState().entries]){const old=merged.get(row.chapterId);if(!old||(row.readAt||0)>=(old.readAt||0))merged.set(row.chapterId,row);}
  history.setState({entries:[...merged.values()].sort((a,b)=>(b.readAt||0)-(a.readAt||0)).slice(0,300)});
 }
 function cover(record){const approved=book(record?.id);if(!approved)throw new Error(CONTENT_MESSAGE);let value=covers.get(approved.id);if(!value){value=URL.createObjectURL(approved.cover);covers.set(approved.id,value);}return value;}
 function manga(record){return {id:record.id,sourceId:'local',title:record.title,description:'Imported '+record.format+' · '+record.pageCount+' pages. Stored on this browser/device; no file upload.',coverUrl:cover(record),status:'COMPLETED',genres:[],author:'',local:true};}
 const chapters=record=>[{id:chapterId(record.id),mangaId:record.id,sourceId:'local',title:'Imported comic',chapterNumber:1,publishDate:record.createdAt,pageCount:record.pageCount}];
 async function checkedRecord(value){
  if(!value||!isLocalId(value.id)||!await reviewedIdentity(value.id))throw new Error(CONTENT_MESSAGE);
  const rows=await db.pages(value.id);if(rows.length!==value.pageCount||rows.some((p,i)=>p.index!==i))throw new Error(CONTENT_MESSAGE);
  const approval=await admitDevicePages(rows);if(approval.id!==value.id)throw new Error(CONTENT_MESSAGE);
  return {...value,title:typeof value.title!=='string'||!value.title.trim()||forbiddenText(value.title)?approval.reviewed.title:cleanDisplayTitle(value.title),format:/^[A-Z0-9.]{1,12}$/.test(value.format)||value.format==='Images'?value.format:'Comic',cover:await coverFor(rows[0])};
 }
 async function record(id){if(!isLocalId(id))throw new Error('This device book link is invalid.');const value=await checkedRecord(await db.get(id));
  if(!book(id)){books.push(value);emit();}return value;}
 function addToLibrary(record){
  // This export uses a synchronous MMKV-web storage driver. Read the latest
  // persisted snapshot before a local mutation so another tab's books survive.
  library.persist?.rehydrate?.();repair();deleted.delete(record.id);
  const row=manga(record),current=library.getState().entries[record.id];
  if(current)library.setState(state=>({entries:{...state.entries,[record.id]:{...current,...row,chapters:chapters(record)}}}));
  else{library.getState().add(row,'UNREAD');library.getState().setChapters(record.id,chapters(record));}
 }
 function repair(){
  if(!library)return;const available=new Map(books.map(b=>[b.id,b]));let changed=false;
  const entries={...library.getState().entries};
  for(const [id,row]of Object.entries(entries)){const b=available.get(id);if(!b)continue;const url=cover(b);if(row.coverUrl!==url){entries[id]={...row,...manga(b),chapters:chapters(b)};changed=true;}}
  if(changed)library.setState({entries});
  const history=requireRuntime?.(1602).useHistoryStore;
  if(history){let updated=false;const rows=history.getState().entries.map(row=>{const b=available.get(row.mangaId);if(!b)return row;const url=cover(b);if(row.coverUrl===url)return row;updated=true;return {...row,coverUrl:url};});if(updated)history.setState({entries:rows});}
 }
 async function refresh(){
  try{const rows=await db.list(),approved=[];for(const row of rows)try{approved.push(await checkedRecord(row));}catch{}
   books=approved.sort((a,b)=>b.createdAt-a.createdAt);hiddenCount=rows.length-approved.length;
   for(const [id,url]of covers)if(!book(id)){URL.revokeObjectURL(url);covers.delete(id);for(const value of pageUrls.get(id)||[])URL.revokeObjectURL(value);pageUrls.delete(id);evict(id);}
   error='';library?.persist?.rehydrate?.();repair();}
  catch(e){error=e.message;}finally{loading=false;emit();}
 }
 function evict(id){queryClient?.removeQueries({predicate:q=>q.queryKey?.some(v=>v===id||v===chapterId(id))});}
 function releasePages(){for(const urls of pageUrls.values())urls.forEach(URL.revokeObjectURL);pageUrls.clear();queryClient?.removeQueries({predicate:q=>q.queryKey?.[0]==='pages'&&String(q.queryKey[1]).startsWith('local-')});}
 const adapter={id:'local',name:'On this device',version:'1.0.0',color:'#E7B978',capabilities:{readable:true,search:false,popular:false,latest:false,trending:false,genres:false,languages:[],originFilter:false,requiresReferer:false},
  getBaseUrl:()=>location.origin,getSortOptions:()=>[],search:async()=>[],searchPage:async()=>({items:[]}),getPopular:async()=>[],getLatestUpdates:async()=>[],getTrending:async()=>[],
  getMangaDetails:async id=>manga(await record(id)),getChapterList:async id=>chapters(await record(id)),
  getChapterPages:async id=>{
   const value=id.match(/^(local-[a-f0-9]{64})-chapter-1$/);if(!value)throw new Error('Invalid device chapter.');const b=await record(value[1]);
   const rows=await db.pages(b.id);if(rows.length!==b.pageCount||rows.some((p,i)=>p.index!==i||!(p.blob instanceof Blob)||p.blob.size<1||p.blob.size>LIMITS.pageBytes))throw new Error('Some device pages are missing. Delete this imported copy and import the file again.');
   // Another tab can change IndexedDB after record() verified its snapshot.
   // Verify the exact immutable blobs that will receive display URLs as well.
   const approval=await admitDevicePages(rows);if(approval.id!==b.id)throw new Error(CONTENT_MESSAGE);
   let urls=pageUrls.get(b.id);if(!urls){urls=rows.map(p=>URL.createObjectURL(p.blob));pageUrls.set(b.id,urls);}
   return {chapterId:id,verified:true,validation:'device',pages:rows.map((p,i)=>({index:i,url:urls[i],width:p.width,height:p.height})),credits:[]};
  }
 };
 async function syncMessage(message){
  if(!isLocalId(message?.id))return;
  const value=await db.get(message.id);await refresh();
  if(value&&message.operation==='add')addToLibrary(value);else if(!value)cleanState(message.id);
 }
 channel&&(channel.onmessage=e=>syncMessage(e.data).catch(()=>{}));
 function cleanState(id){
  deleted.add(id);evict(id);library?.persist?.rehydrate?.();library?.getState().remove(id);
  const history=requireRuntime?.(1602).useHistoryStore;
  if(history){mergeHistory(history);history.getState().removeForManga(id);history.getState().flush();
  }
  const collections=requireRuntime?.(1662).useCollectionStore;collections?.persist?.rehydrate?.();for(const shelf of collections?.getState().collections||[])if(shelf.ids.includes(id))collections.getState().remove(shelf.id,[id]);
  if(location.pathname.includes('/reader/'+chapterId(id)))requireRuntime?.(11).router.replace('/library');
  for(const url of pageUrls.get(id)||[])URL.revokeObjectURL(url);pageUrls.delete(id);const url=covers.get(id);if(url)URL.revokeObjectURL(url);covers.delete(id);
 }
 const runtime={adapter,db,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},getSnapshot:()=>revision,
  get books(){return books;},get hiddenCount(){return hiddenCount;},get error(){return error;},get loading(){return loading;},manga,chapters,cover,mayRecord:id=>!!book(id)&&!deleted.has(id),mergeHistory,
  ownsUrl:value=>[...covers.values(),...[...pageUrls.values()].flat()].includes(value),
  async approval(id,identity){if(identity&&identity!==chapterId(id))throw new Error(CONTENT_MESSAGE);return record(id);},
  normalizeHistory:row=>{const b=book(row.mangaId);return b?{...row,coverUrl:cover(b)}:row;},
  connect(store,require){if(library)return;library=store;requireRuntime=require;queryClient=require(1596).queryClient;
   const original=library.persist.getOptions().partialize;
   library.persist.setOptions({partialize:state=>{const value=original(state);return {...value,entries:Object.fromEntries(Object.entries(value.entries).map(([id,row])=>[id,row.sourceId==='local'?{...row,coverUrl:''}:row]))};}});
   library.persist?.onFinishHydration?.(repair);refresh();library.subscribe(()=>emit());
   window.addEventListener('popstate',()=>{if(!location.pathname.startsWith('/reader/'))releasePages();});
   window.addEventListener('kuro:active-chapter-changed',e=>{if(!String(e.detail).startsWith('local-'))releasePages();});
   let path=location.pathname;setInterval(()=>{if(path!==location.pathname){path=location.pathname;if(!path.startsWith('/reader/'))releasePages();}},800);
   window.addEventListener('pagehide',e=>{if(!e.persisted)releasePages();});
  },
  async save(prepared,options){await admitDevicePages(prepared.pages,{signal:options?.signal});const result=await db.save(prepared,options);await refresh();const approved=book(result.book.id);if(!approved)throw new Error(CONTENT_MESSAGE);addToLibrary(approved);channel?.postMessage({id:approved.id,operation:'add'});return {...result,book:approved};},
  async add(id){const b=await record(id);addToLibrary(b);channel?.postMessage({id,operation:'add'});emit();},
  async delete(id){await db.delete(id);cleanState(id);await refresh();channel?.postMessage({id,operation:'delete'});},
  inLibrary:id=>!!library?.getState().entries[id],
  async read(id){const b=await record(id),row=manga(b),chapter=chapters(b)[0],codec=requireRuntime(1601);codec.rememberManga(row);codec.rememberChapter(chapter);
   if(library.getState().entries[id]?.readingStatus==='UNREAD'){library.persist?.rehydrate?.();repair();library.getState().setReadingStatus(id,'READING');}
   requireRuntime(11).router.navigate({pathname:'/reader/[chapterId]',params:{...codec.encodeReader(row,chapter),chapterId:chapter.id}});
  },refresh
 };return runtime;
}
