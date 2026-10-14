import test from 'node:test';import assert from 'node:assert/strict';import sharp from 'sharp';
import {sanitizeManifest} from '../server/catalogue/images.mjs';import {createTickets} from '../server/catalogue/tickets.mjs';
const transform={type:'tiles',columns:2,rows:2,order:[3,2,1,0]};
test('public tile manifests validate and retain an exact permutation; malformed maps fail',()=>{
 const policy={hosts:['image.test']},m={chapterId:'asurascans:hero~1',pages:[{url:'https://image.test/a.png',transform}]};
 assert.deepEqual(sanitizeManifest(m,policy).pages[0].transform,transform);
 for(const invalid of [{...transform,order:[0,0,1,2]},{...transform,columns:900},{...transform,order:[-1,0,1,2]}])assert.throws(()=>sanitizeManifest({...m,pages:[{...m.pages[0],transform:invalid}]},policy),/tile/i);
});
test('page tickets authenticate the transformation together with canonical image and chapter',()=>{
 const tickets=createTickets(Buffer.alloc(32,3)),policy={hosts:['image.test']},token=tickets.issue({provider:'asurascans',url:'https://image.test/a.png',chapterId:'asurascans:hero~1',transform},100,policy);
 assert.deepEqual(tickets.verify(token,101,()=>policy).transform,transform);
 const [body,mac]=token.split('.'),data=JSON.parse(Buffer.from(body,'base64url'));data.t.order=[0,1,2,3];
 assert.throws(()=>tickets.verify(Buffer.from(JSON.stringify(data)).toString('base64url')+'.'+mac,101,()=>policy),/ticket/);
});
test('tile restoration follows the public reader map and safely decodes the complete image',async()=>{
 const {restoreTiles}=await import('../server/catalogue/images.mjs');const pixel=Buffer.from([255,0,0,255,0,255,0,255,0,0,255,255,255,255,0,255]);
 const original=await sharp(pixel,{raw:{width:2,height:2,channels:4}}).png().toBuffer();
 const restored=await restoreTiles(original,'image/png',transform);const raw=await sharp(restored).ensureAlpha().raw().toBuffer();
 assert.deepEqual([...raw],[255,255,0,255,0,0,255,255,0,255,0,255,255,0,0,255]);
 await assert.rejects(restoreTiles(original.subarray(0,25),'image/png',transform),/decode|signature/);
});
test('a valid compressed source remains deliverable when lossless restoration would exceed download limits',async()=>{
 const {restoreTiles,deliveryImage}=await import('../server/catalogue/images.mjs');let seed=123;const width=2200,height=2200,raw=Buffer.alloc(width*height*3);
 for(let i=0;i<raw.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;raw[i]=seed>>>24;}
 const input=await sharp(raw,{raw:{width,height,channels:3}}).jpeg({quality:75}).toBuffer();assert.ok(input.length<8*1024*1024);
 const restored=await restoreTiles(input,'image/jpeg',transform),served=await deliveryImage(restored,'image/webp');
 assert.ok(served.body.length<=3*1024*1024);assert.equal(served.width,width);assert.equal(served.height,height);
});
