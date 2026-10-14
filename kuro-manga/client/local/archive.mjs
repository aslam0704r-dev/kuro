import {LIMITS,abortCheck} from './model.mjs';
export function extractArchive(file,{signal,onProgress=()=>{}}={}){
 abortCheck(signal);
 return new Promise((resolve,reject)=>{
  const worker=new Worker('/local-archive-worker.js',{type:'module'});let done=false;
  const finish=(error,pages)=>{if(done)return;done=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);worker.terminate();error?reject(error):resolve(pages);};
  const abort=()=>finish(new DOMException('Import cancelled','AbortError'));
  const timer=setTimeout(()=>finish(new Error('Archive extraction took too long. Split this comic into smaller files.')),90000);
  signal?.addEventListener('abort',abort,{once:true});
  worker.onerror=()=>finish(new Error('Archive tools could not load. Reload KURO and try again.'));
  worker.onmessage=({data})=>{if(data.kind==='progress')onProgress(data.message);else if(data.kind==='done')finish(null,{pages:data.pages,metadata:data.metadata});else if(data.kind==='error')finish(new Error(data.message));};
  if(file.size>LIMITS.input)finish(new Error('Choose a comic file of 150 MiB or less.'));else worker.postMessage({file});
 });
}
