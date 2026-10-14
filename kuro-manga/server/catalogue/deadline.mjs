import {AsyncLocalStorage} from 'node:async_hooks';
import {sourceError} from './transport.mjs';
const context=new AsyncLocalStorage();
export const catalogueSignal=()=>context.getStore()?.signal;
export async function withCatalogueDeadline(task,durationMs=42000){
 const controller=new AbortController(),error=sourceError('Catalogue refresh deadline reached',503);let timer;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort(error);reject(error);},durationMs);});
 try{return await context.run({signal:controller.signal},()=>Promise.race([Promise.resolve().then(task),deadline]));}
 finally{clearTimeout(timer);}
}
