import {LIMITS,cleanDisplayTitle,isLocalId,abortCheck} from './model.mjs';
import {admitDevicePages,approvedTitle} from './content.mjs';
import {coverFor} from './images.mjs';
const DATABASE='kuro-device-manga-v1';
export function createDeviceStore(indexedDB=globalThis.indexedDB){
 let opened;
 const open=()=>{
  if(opened)return opened;
  if(!indexedDB)return Promise.reject(new Error('Device storage is unavailable in this browser. Allow website storage and reload KURO.'));
  opened=new Promise((resolve,reject)=>{
   const request=indexedDB.open(DATABASE,1);let settled=false;
   const timer=setTimeout(()=>{settled=true;reject(new Error('Device storage is blocked by another tab. Close that tab and reload KURO.'));},10000);
   request.onupgradeneeded=()=>{const db=request.result;db.createObjectStore('books',{keyPath:'id'});db.createObjectStore('pages',{keyPath:['bookId','index']});};
   request.onerror=()=>{clearTimeout(timer);reject(new Error('Device storage could not open. Allow website storage and reload KURO.'));};
   request.onsuccess=()=>{clearTimeout(timer);if(settled){request.result.close();return;}const db=request.result;db.onversionchange=()=>{db.close();opened=undefined;};resolve(db);};
  }).catch(error=>{opened=undefined;throw error;});return opened;
 };
 async function read(store,method,key){const db=await open();return new Promise((resolve,reject)=>{const request=db.transaction(store).objectStore(store)[method](key);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
 return {
  list:()=>read('books','getAll'),get:id=>read('books','get',id),
  pages:id=>read('pages','getAll',IDBKeyRange.bound([id,0],[id,LIMITS.pages])),
  async save(prepared,{title,signal}={}){
   abortCheck(signal);
   if(!prepared?.pages?.length||prepared.pages.length>LIMITS.pages||prepared.size>LIMITS.expanded)throw new Error('The prepared comic exceeds the allowed size.');
   const approval=await admitDevicePages(prepared.pages,{signal}),id=approval.id,cover=await coverFor(prepared.pages[0],signal),safeTitle=approvedTitle(cleanDisplayTitle(title||prepared.title),approval.reviewed.title);abortCheck(signal);const db=await open();abortCheck(signal);
   return new Promise((resolve,reject)=>{
    const tx=db.transaction(['books','pages'],'readwrite'),books=tx.objectStore('books'),pages=tx.objectStore('pages');let result,error;
    const abort=()=>{error=new DOMException('Import cancelled','AbortError');try{tx.abort();}catch{}};
    signal?.addEventListener('abort',abort,{once:true});
    tx.oncomplete=()=>{signal?.removeEventListener('abort',abort);resolve(result);};
    tx.onabort=()=>{signal?.removeEventListener('abort',abort);reject(error||tx.error||new Error('The comic could not be saved. No partial book was added.'));};
    tx.onerror=()=>{error=tx.error;};
    const request=books.get(id);request.onsuccess=()=>{
     if(request.result){result={book:request.result,duplicate:true};return;}
     const list=books.getAll();list.onsuccess=()=>{
      if(list.result.length>=LIMITS.books||list.result.reduce((n,b)=>n+b.size,0)+prepared.size>LIMITS.stored){error=new Error('Device manga storage is full (200 books / 1 GiB). Delete a device book first.');tx.abort();return;}
      const book={id,title:safeTitle,format:prepared.format,pageCount:prepared.pages.length,size:prepared.size,createdAt:Date.now(),cover};
      books.add(book);prepared.pages.forEach((p,index)=>pages.add({bookId:id,index,blob:p.blob,width:p.width,height:p.height,hash:p.hash,name:p.name}));result={book,duplicate:false};
     };
    };
   });
  },
  async delete(id){
   if(!isLocalId(id))throw new Error('Invalid device book.');const db=await open();
   return new Promise((resolve,reject)=>{
    const tx=db.transaction(['books','pages'],'readwrite');tx.objectStore('books').delete(id);tx.objectStore('pages').delete(IDBKeyRange.bound([id,0],[id,LIMITS.pages]));
    tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error||new Error('Device files could not be deleted.'));tx.onerror=()=>{};
   });
  },
  async close(){if(opened)(await opened).close();opened=undefined;}
 };
}
