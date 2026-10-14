import sharp from 'sharp';
import { permittedURL, sourceError } from './transport.mjs';

const LIMIT=8*1024*1024,PIXELS=32000000;
export function imageSignatureType(bytes){
 if(bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a')return 'image/png';
 if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
 if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return 'image/webp';
 if(['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6)))return 'image/gif';
 if(bytes.toString('ascii',4,8)==='ftyp'&&/^(avif|avis)$/.test(bytes.toString('ascii',8,12)))return 'image/avif';
 return '';
}
export async function validateImage(bytes,declared){
 if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>LIMIT)throw sourceError('Image size is invalid',422);
 const mime=String(declared||'').split(';')[0].trim().toLowerCase().replace('image/jpg','image/jpeg');
 if(!['image/jpeg','image/png','image/webp','image/gif','image/avif'].includes(mime))throw sourceError('Image MIME type is unsupported',422);
 const actual=imageSignatureType(bytes);if(!actual)throw sourceError('Image signature is invalid',422);if(mime!==actual)throw sourceError('Image MIME does not match its bytes',422);
 try{const image=sharp(bytes,{failOn:'warning',limitInputPixels:PIXELS,animated:false});const data=await image.metadata();
  if(!data.width||!data.height||data.width>50000||data.height>50000||data.width*data.height>PIXELS||(data.pages||1)>1)throw new Error('dimensions');
  // Decode the complete input, including the end of a truncated stream, before serving original bytes.
  await image.raw().toBuffer();return {mime:actual,width:data.width,height:data.height};
 }catch{throw sourceError('Image could not decode safely or has invalid dimensions',422);}
}
export function sanitizeManifest(manifest,policy){
 if(!manifest||typeof manifest.chapterId!=='string'||manifest.chapterId.length>1400||!Array.isArray(manifest.pages)||!manifest.pages.length||manifest.pages.length>500)throw sourceError('Chapter has invalid pages',422);
 const urls=new Set(),pages=[];
 for(const page of manifest.pages){if(!page||typeof page.url!=='string'||!permittedURL(page.url,policy))throw sourceError('Page URL is not permitted',422);
  const url=new URL(page.url).href,transform=tileTransform(page.transform);const identity=JSON.stringify([url,transform]);if(urls.has(identity))continue;urls.add(identity);pages.push({index:pages.length,url,...transform?{transform}:{}});}
 return {chapterId:manifest.chapterId,pages};
}
export function tileTransform(value){
 if(value===undefined)return undefined;
 if(!value||value.type!=='tiles'||!Number.isSafeInteger(value.columns)||!Number.isSafeInteger(value.rows)||value.columns<1||value.rows<1||value.columns>8||value.rows>8||!Array.isArray(value.order)||value.order.length!==value.columns*value.rows||new Set(value.order).size!==value.order.length||value.order.some(n=>!Number.isSafeInteger(n)||n<0||n>=value.order.length))throw sourceError('Invalid public reader tile map',422);
 return {type:'tiles',columns:value.columns,rows:value.rows,order:[...value.order]};
}
export async function restoreTiles(bytes,type,descriptor){
 const t=tileTransform(descriptor);if(!t)return bytes;const metadata=await validateImage(bytes,type);
 const tileWidth=Math.floor(metadata.width/t.columns),tileHeight=Math.floor(metadata.height/t.rows);if(!tileWidth||!tileHeight)throw sourceError('Invalid public reader tile dimensions',422);
 const width=tileWidth*t.columns,height=tileHeight*t.rows,input=await sharp(bytes,{failOn:'warning',limitInputPixels:PIXELS}).toColourspace('srgb').ensureAlpha().raw().toBuffer(),output=Buffer.alloc(width*height*4);
 for(let source=0;source<t.order.length;source++){
  const destination=t.order[source],sx=(source%t.columns)*tileWidth,sy=Math.floor(source/t.columns)*tileHeight,dx=(destination%t.columns)*tileWidth,dy=Math.floor(destination/t.columns)*tileHeight;
  for(let y=0;y<tileHeight;y++){const offset=((sy+y)*metadata.width+sx)*4;input.copy(output,((dy+y)*width+dx)*4,offset,offset+tileWidth*4);}
 }
 const restored=()=>sharp(output,{raw:{width,height,channels:4}});
 const lossless=await restored().webp({lossless:true,effort:1}).toBuffer();if(lossless.length<=3*1024*1024)return lossless;
 // Restored pixels are an internal decoded image. Encode them within the
 // serving budget before applying the independent upstream download limit.
 for(const quality of [95,85,75]){const encoded=await restored().webp({quality,effort:3}).toBuffer();if(encoded.length<=3*1024*1024)return encoded;}
 throw sourceError('Restored reading page exceeds the hosted delivery size limit',422);
}
export async function deliveryImage(bytes,type){
 const metadata=await validateImage(bytes,type);if(bytes.length<=3*1024*1024)return {...metadata,body:bytes};
 // Stay below the hosted function's 4.5MB buffered payload limit, including
 // binary-envelope overhead. Keep dimensions; transcode only larger pages.
 for(const quality of [95,85,75]){const output=await sharp(bytes,{failOn:'warning',limitInputPixels:PIXELS}).rotate().webp({quality,effort:3}).toBuffer();
  if(output.length<=3*1024*1024)return {...await validateImage(output,'image/webp'),body:output};}
 throw sourceError('Reading page exceeds the hosted delivery size limit',422);
}
