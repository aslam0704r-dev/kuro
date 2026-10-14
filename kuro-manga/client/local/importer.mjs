import {validateInput,pageCompare,cleanTitle,abortCheck,LIMITS} from './model.mjs';
import {extractArchive} from './archive.mjs';
import {pdfPages} from './pdf.mjs';
import {validatedPage,coverFor} from './images.mjs';
import {epubPages} from './epub.mjs';
import {admitDevicePages,approvedTitle} from './content.mjs';
export async function prepareImport(files,{signal,onProgress=()=>{}}={}){
 if(!globalThis.crypto?.subtle)throw new Error('Open KURO over HTTPS (or localhost) to import files securely on this device.');
 files=Array.from(files);const kind=validateInput(files);abortCheck(signal);
 let raw,epub=false;
 if(kind==='archive'){const archive=await extractArchive(files[0],{signal,onProgress});epub=/\.epub$/i.test(files[0].name);raw=epub?epubPages(archive):archive.pages;}
 else raw=kind==='pdf'?await pdfPages(files[0],{signal,onProgress}):files.map(file=>({name:file.webkitRelativePath||file.name,blob:file}));
 if(!epub)raw.sort((a,b)=>pageCompare(a.name,b.name));const pages=[];let size=0;
 for(const page of raw){abortCheck(signal);size+=page.blob.size;if(size>LIMITS.expanded)throw new Error('These pages exceed the 200 MiB import limit.');onProgress('Checking page '+(pages.length+1)+' of '+raw.length);
  try{pages.push(await validatedPage(page,signal));}catch(error){if(error.name==='AbortError')throw error;throw new Error(cleanTitle(page.name)+': '+error.message);}
 }
 abortCheck(signal);const approval=await admitDevicePages(pages,{signal});const cover=await coverFor(pages[0],signal);abortCheck(signal);
 const folder=files[0].webkitRelativePath?.split('/')[0];
 return {title:approvedTitle(cleanTitle(folder||(kind==='image'&&files.length>1?approval.reviewed.title:files[0].name)),approval.reviewed.title),format:kind==='image'?'Images':files[0].name.split('.').pop().toUpperCase(),pages,cover,size};
}
