import {AsyncLocalStorage} from 'node:async_hooks';
import {sourceError} from './transport.mjs';
const context=new AsyncLocalStorage();
export const catalogueSignal=()=>context.getStore()?.signal;
export function catalogueCleanup(task){
 const parent=context.getStore(),promise=context.run(undefined,()=>withCatalogueDeadline(task,6000));
 parent?.cleanups.add(promise);promise.then(()=>parent?.cleanups.delete(promise),()=>parent?.cleanups.delete(promise));return promise;
}
export async function withCatalogueDeadline(task,durationMs=42000){
 const controller=new AbortController(),error=sourceError('Catalogue refresh deadline reached',503),state={signal:controller.signal,cleanups:new Set()};let timer;
 const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort(error);reject(error);},durationMs);});
 try{return await context.run(state,()=>Promise.race([Promise.resolve().then(task),deadline]));}
 finally{clearTimeout(timer);controller.abort(error);if(state.cleanups.size)await Promise.allSettled([...state.cleanups]);}
}
