import {ArchiveReader,libarchiveWasm} from 'libarchive-wasm';
import {LIMITS,safeEntry} from './model.mjs';
import {validateContainer} from './containers.mjs';
self.onmessage=async({data})=>{
 let reader;
 try{
  const file=data.file;if(!(file instanceof Blob)||file.size>LIMITS.input)throw new Error('Invalid comic archive.');
  const mod=await libarchiveWasm({locateFile:()=>'/vendor/local/libarchive.wasm',print:()=>{},printErr:()=>{}});
  const archiveBytes=new Int8Array(await file.arrayBuffer());validateContainer(archiveBytes);reader=new ArchiveReader(mod,archiveBytes);
  const pages=[],metadata={},names=new Set(),epub=/\.epub$/i.test(file.name);let count=0,declared=0,expanded=0,metadataSize=0;
  for(const entry of reader.entries()){
   if(++count>LIMITS.entries)throw new Error('This archive has more than 2,000 entries.');
   const checked=safeEntry({path:entry.getPathname(),size:entry.getSize(),type:entry.getFiletype(),encrypted:entry.isEncrypted(),hardlink:entry.getHardlinkTarget(),symlink:entry.getSymlinkTarget()});
   declared+=checked.size;if(declared>LIMITS.expanded)throw new Error('This archive expands beyond 200 MiB.');
   const document=epub&&entry.getFiletype()==='File'&&/\.(opf|xml|xhtml|html)$/i.test(checked.path)&&!checked.path.split('/').some(p=>p.startsWith('.')||p==='__MACOSX');
   if(document&&(checked.size>512*1024||metadataSize+checked.size>4*1024*1024))throw new Error('EPUB reading-order metadata is too large.');
   if(checked.skip&&!document)continue;
   if(names.has(checked.path.toLowerCase()))throw new Error('This archive contains repeated page paths.');names.add(checked.path.toLowerCase());
   if(!document&&pages.length>=LIMITS.pages)throw new Error('Import up to 600 pages at a time.');
   // Bounded chunks avoid allocating a buffer based on untrusted archive sizes.
   const chunks=[];let bytes=0;
   for(;;){const chunk=reader.readData(65536);if(!chunk.length)break;bytes+=chunk.length;expanded+=chunk.length;
    if(bytes>LIMITS.pageBytes||expanded>LIMITS.expanded)throw new Error('Archive pages exceed the allowed size.');chunks.push(chunk);
   }
   entry.readCalled=true;
   if(bytes!==checked.size||bytes===0)throw new Error('An archive page is damaged or has an incorrect size.');
   if(document){metadataSize+=bytes;metadata[checked.path]=await new Blob(chunks).text();continue;}
   pages.push({name:checked.path,blob:new Blob(chunks)});
   self.postMessage({kind:'progress',message:'Extracting pages · '+pages.length});
  }
  if(mod.error_string(reader.archive))throw new Error('This archive is damaged or incomplete. Export another copy.');
  if(!pages.length)throw new Error('No supported image pages were found. Text-only EPUBs and nested archives are not supported.');
  self.postMessage({kind:'done',pages,metadata});
 }catch(error){self.postMessage({kind:'error',message:/password|encrypt|passphrase/i.test(error.message)?'Password-protected archives are not supported. Export an unlocked copy first.':error.message||'This archive could not be read.'});}
 finally{try{reader?.free();}catch{}}
};
