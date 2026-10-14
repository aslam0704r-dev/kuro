import {LIMITS,abortCheck,validateDimensions} from './model.mjs';
import {canvasBlob} from './images.mjs';
export async function pdfPages(file,{signal,onProgress=()=>{}}={}){
 abortCheck(signal);const data=new Uint8Array(await file.arrayBuffer());
 if(!new TextDecoder('latin1').decode(data.subarray(0,1024)).includes('%PDF-'))throw new Error('This file does not contain a valid PDF signature.');
 const pdfjs=await import(/* @vite-ignore */ '/vendor/local/pdf.mjs');
 pdfjs.GlobalWorkerOptions.workerSrc='/vendor/local/pdf.worker.mjs';
 const worker=new Worker('/local-pdf-worker.mjs',{type:'module'});let imageWarning=false;
 worker.addEventListener('message',e=>{
  // In the pinned PDF.js build an operator stream can report an error while
  // getOperatorList/render still resolve with an empty list. Preserve that
  // failure as a rejection of this import, regardless of console verbosity.
  if(e.data?.reason?.message||e.data?.targetName==='kuro-pdf-validation'&&e.data.kind==='image-warning')imageWarning=true;
 });
 try{await new Promise((resolve,reject)=>{
  const ready=e=>{if(e.data?.targetName==='kuro-pdf-validation'&&e.data.kind==='ready')finish();};
  const abort=()=>finish(new DOMException('Import cancelled','AbortError'));
  const fail=()=>finish(new Error('PDF tools could not load. Reload KURO and try again.'));
  const timer=setTimeout(fail,20000);
  function finish(error){clearTimeout(timer);worker.removeEventListener('message',ready);worker.removeEventListener('error',fail);signal?.removeEventListener('abort',abort);error?reject(error):resolve();}
  worker.addEventListener('message',ready);worker.addEventListener('error',fail,{once:true});signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();
 });}catch(error){worker.terminate();throw error;}
 const pdfWorker=new pdfjs.PDFWorker({port:worker});
 const loading=pdfjs.getDocument({data,stopAtErrors:true,isEvalSupported:false,enableXfa:false,disableWorkerRendering:true,
  worker:pdfWorker,maxImageSize:LIMITS.pixels,canvasMaxAreaInBytes:32000000,cMapUrl:'/vendor/local/cmaps/',standardFontDataUrl:'/vendor/local/standard_fonts/',wasmUrl:'/vendor/local/wasm/'});
 let document,renderTask,timedOut=false;const abort=()=>{renderTask?.cancel();loading.destroy().catch(()=>{});};
 const timer=setTimeout(()=>{timedOut=true;abort();},180000);signal?.addEventListener('abort',abort,{once:true});
 loading.onPassword=()=>{loading.destroy().catch(()=>{});};
 try{
  document=await loading.promise;abortCheck(signal);
  if(document.numPages>LIMITS.pages)throw new Error('Import up to 600 PDF pages at a time.');
  const pages=[];let total=0;
  for(let n=1;n<=document.numPages;n++){
   abortCheck(signal);onProgress('Preparing PDF page '+n+' of '+document.numPages);
   const page=await document.getPage(n),original=page.getViewport({scale:1});
   if(!Number.isFinite(original.width)||!Number.isFinite(original.height)||original.width<=0||original.height<=0)throw new Error('This PDF has an invalid page size.');
   const scale=Math.min(2,1800/original.width,2600/original.height,Math.sqrt(8000000/(original.width*original.height))),viewport=page.getViewport({scale});
   const canvas=window.document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(viewport.width));canvas.height=Math.max(1,Math.ceil(viewport.height));
   try{
    onProgress('Checking PDF page '+n+' of '+document.numPages);
    const operations=await page.getOperatorList({annotationMode:pdfjs.AnnotationMode.DISABLE});
    if(imageWarning)throw new Error('Page '+n+' contains a damaged, missing or oversized image.');
    onProgress('Rendering PDF page '+n+' of '+document.numPages);
    renderTask=page.render({canvasContext:canvas.getContext('2d'),viewport,annotationMode:pdfjs.AnnotationMode.DISABLE,background:'rgb(255,255,255)'});await renderTask.promise;abortCheck(signal);
    // PDF.js can resolve a render after replacing a failed image with null.
    // Verify the image dependencies as well as the render promise.
    const external=new Set([pdfjs.OPS.paintImageXObject,pdfjs.OPS.paintImageXObjectRepeat]);
    for(let i=0;i<operations.fnArray.length;i++)if(external.has(operations.fnArray[i])){
     const [id,width,height]=operations.argsArray[i],objects=String(id).startsWith('g_')?page.commonObjs:page.objs;
     const image=await new Promise(resolve=>objects.get(id,resolve));
     if(!image)throw new Error('Page '+n+' contains a damaged or missing image.');
     if(image.width&&image.height)validateDimensions(image.width,image.height);else if(Number.isInteger(width)&&Number.isInteger(height))validateDimensions(width,height);
    }
    if(imageWarning)throw new Error('Page '+n+' contains an image that could not be decoded safely.');
    const blob=await canvasBlob(canvas);total+=blob.size;if(total>LIMITS.expanded||blob.size>LIMITS.pageBytes)throw new Error('The PDF pages exceed the allowed import size.');
    pages.push({name:String(n).padStart(4,'0')+'.webp',blob});
   }finally{canvas.width=canvas.height=1;renderTask=undefined;page.cleanup();}
  }
  return pages;
 }catch(error){abortCheck(signal);if(timedOut)throw new Error('PDF conversion took too long. Split it into smaller comics.');if(/password|destroyed/i.test(error.message))throw new Error('Password-protected PDFs are not supported. Export an unlocked copy first.');throw new Error('PDF import failed: '+error.message);}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);
  // An evaluator failure can leave PDF.js's teardown waiting for a stream.
  // This job owns its worker, so bound graceful cleanup then terminate it.
  let cleanupTimer;await Promise.race([loading.destroy().catch(()=>{}),new Promise(resolve=>{cleanupTimer=setTimeout(resolve,300);})]);clearTimeout(cleanupTimer);pdfWorker.destroy();worker.terminate();
 }
}
