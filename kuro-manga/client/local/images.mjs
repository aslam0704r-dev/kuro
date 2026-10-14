import {imageType,validateDimensions,digest,abortCheck} from './model.mjs';
export async function decodeImage(blob,signal){
 abortCheck(signal);const url=URL.createObjectURL(blob),image=new Image();
 try{
  await new Promise((resolve,reject)=>{
   const abort=()=>reject(new DOMException('Import cancelled','AbortError'));
   const timer=setTimeout(()=>reject(new Error('Image decoding took too long. Try a smaller page.')),15000);
   const done=fn=>()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);fn();};
   image.onload=done(resolve);image.onerror=done(()=>reject(new Error('An image page is damaged or cannot be decoded on this device.')));
   signal?.addEventListener('abort',abort,{once:true});image.src=url;
  });
  abortCheck(signal);validateDimensions(image.naturalWidth,image.naturalHeight);return image;
 }finally{URL.revokeObjectURL(url);}
}
export const canvasBlob=(canvas,type='image/webp',quality=.94)=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('This device could not convert the page image.')),type,quality));
export async function validatedPage(page,signal){
 const bytes=await page.blob.arrayBuffer();abortCheck(signal);const type=imageType(bytes),blob=new Blob([bytes],{type});
 const image=await decodeImage(blob,signal);return {...page,blob,width:image.naturalWidth,height:image.naturalHeight,hash:await digest(bytes)};
}
export async function coverFor(page,signal){
 const image=await decodeImage(page.blob,signal),canvas=document.createElement('canvas');
 const ratio=Math.min(1,480/image.naturalWidth,720/image.naturalHeight);canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
 canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);const blob=await canvasBlob(canvas);canvas.width=canvas.height=1;return blob;
}
