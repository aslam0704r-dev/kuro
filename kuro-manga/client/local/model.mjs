export const LIMITS=Object.freeze({input:150*1024*1024,expanded:200*1024*1024,pageBytes:12*1024*1024,pages:600,entries:2000,pixels:32000000,dimension:16384,stored:1024*1024*1024,books:200});
export const IMAGE_EXT=/\.(?:jpe?g|png|webp|gif|bmp|avif)$/i;
const archiveExt=/\.(?:cbz|zip|cbr|rar|cb7|7z|cbt|tar|epub|tgz|tbz2?|txz|tar\.(?:gz|bz2|xz))$/i;
export function fileKind(name=''){return IMAGE_EXT.test(name)?'image':/\.pdf$/i.test(name)?'pdf':archiveExt.test(name)?'archive':'unsupported';}
const collator=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
export const pageCompare=(a,b)=>collator.compare(a,b)||a.localeCompare(b,'en');
export function cleanTitle(value=''){
 const name=String(value).trim().split(/[\\/]/).pop().replace(/\.(?:tar\.(?:gz|bz2|xz)|cbz|zip|cbr|rar|cb7|7z|cbt|tar|epub|tgz|tbz2?|txz|pdf|jpe?g|png|webp|gif|bmp|avif)$/i,'');
 return [...name.replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,' ').replace(/\s+/g,' ').trim()].slice(0,120).join('')||'My manga';
}
export function cleanDisplayTitle(value=''){
 return [...String(value).replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,' ').replace(/\s+/g,' ').trim()].slice(0,120).join('')||'My manga';
}
export function validateInput(files){
 if(!files.length)throw new Error('Choose a comic file or some image pages.');
 if(files.some(f=>/\.(?:part\d+|vol\d+)\.(?:rar|cbr|zip|cbz|7z|cb7)$|\.(?:rar|cbr|zip|cbz|7z|cb7)\.\d{3}$/i.test(f.name)))throw new Error('Multipart comic archives are not supported. Combine the volumes into one complete archive first.');
 if(files.length>LIMITS.pages)throw new Error('Import up to 600 pages at a time.');
 if(files.some(f=>!Number.isSafeInteger(f.size)||f.size<=0)||files.reduce((n,f)=>n+f.size,0)>LIMITS.input)throw new Error('Choose files with a combined size of 150 MiB or less.');
 const kinds=files.map(f=>fileKind(f.name));
 if(kinds.some(x=>x==='unsupported'))throw new Error('This file type is not supported. Choose a comic archive, PDF, or JPEG, PNG, WebP, GIF, BMP or AVIF pages.');
 if(files.length>1&&kinds.some(x=>x!=='image'))throw new Error('Choose one comic archive or PDF at a time, or select multiple image pages.');
 if(kinds[0]==='image'&&files.some(f=>f.size>LIMITS.pageBytes))throw new Error('Each image page must be 12 MiB or less.');
 return kinds[0];
}
export function safeEntry({path,size,type,encrypted,hardlink,symlink}){
 if(typeof path!=='string'||path.length>1024||/[\u0000-\u001f\u007f]/.test(path))throw new Error('This archive contains an unsafe page path.');
 path=path.replace(/\\/g,'/');
 if(path.startsWith('/')||/^[a-z]:/i.test(path)||path.split('/').some(x=>x==='..'||x==='.')||path.includes(':'))throw new Error('This archive contains an unsafe page path.');
 if(encrypted)throw new Error('Password-protected archives are not supported. Export an unlocked copy first.');
 if(hardlink||symlink||!['File','Directory'].includes(type))throw new Error('This archive contains a link or a non-regular file.');
 if(!Number.isSafeInteger(size)||size<0||size>LIMITS.expanded)throw new Error('This archive has an invalid or excessive declared size.');
 const skip=type==='Directory'||path.split('/').some(x=>x.startsWith('.')||x==='__MACOSX')||!IMAGE_EXT.test(path);
 if(!skip&&size>LIMITS.pageBytes)throw new Error('Each image page must be 12 MiB or less.');
 return {path,skip,size};
}
export function validateDimensions(width,height){
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1)throw new Error('This page has invalid dimensions.');
 if(width>LIMITS.dimension||height>LIMITS.dimension||width*height>LIMITS.pixels)throw new Error('This image is too large: use at most 32 million pixels and 16,384 pixels per side.');
}
const str=(b,a,n)=>String.fromCharCode(...b.subarray(a,a+n));
export function imageType(bytes){
 const b=new Uint8Array(bytes),v=new DataView(b.buffer,b.byteOffset,b.byteLength);
 if(b.length<12)throw new Error('This page has a damaged or unsupported image signature.');
 if(str(b,0,4)==='\x89PNG'){
  if(str(b,4,4)!=='\r\n\x1a\n'||b.length<45||str(b,12,4)!=='IHDR'||str(b,b.length-8,4)!=='IEND')throw new Error('This PNG page is damaged or truncated.');
  validateDimensions(v.getUint32(16),v.getUint32(20));return 'image/png';
 }
 if(b[0]===255&&b[1]===216&&b[2]===255){
  if(b[b.length-2]!==255||b[b.length-1]!==217)throw new Error('This JPEG page is damaged or truncated.');
  let p=2;while(p+4<b.length){if(b[p++]!==255)throw new Error('This JPEG frame is damaged.');while(b[p]===255)p++;const marker=b[p++];
   if(marker===217||marker===218)break;if(marker===1||(marker>=208&&marker<=215))continue;
   const length=v.getUint16(p);if(length<2||p+length>b.length)throw new Error('This JPEG frame is truncated.');
   if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){if(length<8)throw new Error('This JPEG frame is damaged.');validateDimensions(v.getUint16(p+5),v.getUint16(p+3));return 'image/jpeg';}p+=length;
  }
  throw new Error('This JPEG has no valid image dimensions.');
 }
 if(str(b,0,4)==='RIFF'&&str(b,8,4)==='WEBP'){
  if(v.getUint32(4,true)+8!==b.length)throw new Error('This WebP page is damaged or truncated.');
  if(str(b,12,4)==='VP8X'&&b.length>=30)validateDimensions(1+b[24]+(b[25]<<8)+(b[26]<<16),1+b[27]+(b[28]<<8)+(b[29]<<16));
  if(str(b,12,4)==='VP8 '&&b.length>=30&&str(b,23,3)==='\x9d\x01\x2a')validateDimensions(v.getUint16(26,true)&16383,v.getUint16(28,true)&16383);
  if(str(b,12,4)==='VP8L'&&b.length>=25&&b[20]===47)validateDimensions(1+(v.getUint32(21,true)&16383),1+((v.getUint32(21,true)>>>14)&16383));
  return 'image/webp';
 }
 if(['GIF87a','GIF89a'].includes(str(b,0,6))){if(b[b.length-1]!==59)throw new Error('This GIF page is damaged or truncated.');validateDimensions(v.getUint16(6,true),v.getUint16(8,true));return 'image/gif';}
 if(str(b,0,2)==='BM'&&b.length>=54){if(v.getUint32(2,true)!==b.length)throw new Error('This BMP page is damaged or truncated.');validateDimensions(v.getInt32(18,true),Math.abs(v.getInt32(22,true)));return 'image/bmp';}
 if(str(b,4,4)==='ftyp'&&/avif|avis/.test(str(b,8,Math.min(32,b.length-8)))){
  let dimensions=false;for(let i=4;i<=b.length-16;i++)if(str(b,i,4)==='ispe'&&v.getUint32(i-4)>=20&&i-4+v.getUint32(i-4)<=b.length){validateDimensions(v.getUint32(i+8),v.getUint32(i+12));dimensions=true;}
  if(!dimensions)throw new Error('This AVIF has no supported image dimensions.');
  return 'image/avif';
 }
 throw new Error('This page has an unsupported image signature. SVG and executable content cannot be imported.');
}
export async function digest(data){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function bookIdentity(hashes){return 'local-'+await digest(new TextEncoder().encode('KURO-device-book-v1\n'+hashes.join('\n')));}
export const isLocalId=id=>/^local-[a-f0-9]{64}$/.test(id||'');
export const chapterId=id=>id+'-chapter-1';
export function importError(error){
 if(error?.name==='AbortError')return 'Import cancelled. No book was added.';
 if(['QuotaExceededError','NS_ERROR_DOM_QUOTA_REACHED'].includes(error?.name))return 'Your device does not have enough browser storage. Delete a device book or free some space and try again.';
 return error?.message||'This file could not be imported. Try another copy.';
}
export function abortCheck(signal){if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');}
