import test from 'node:test';import assert from 'node:assert/strict';import sharp from 'sharp';import {deliveryImage} from '../server/catalogue/images.mjs';
test('large valid pages fit the hosted response budget without changing dimensions',async()=>{
 const raw=Buffer.alloc(1100*1000*3);let seed=7;for(let i=0;i<raw.length;i++){seed=(seed*1664525+1013904223)>>>0;raw[i]=seed>>>24;}
 const input=await sharp(raw,{raw:{width:1100,height:1000,channels:3}}).png({compressionLevel:0}).toBuffer();assert.ok(input.length>3*1024*1024);
 const output=await deliveryImage(input,'image/png');assert.ok(output.body.length<=3*1024*1024);assert.equal(output.width,1100);assert.equal(output.height,1000);assert.equal(output.mime,'image/webp');
});
test('ordinary pages retain original bytes after validation',async()=>{
 const input=await sharp({create:{width:100,height:120,channels:3,background:'#123456'}}).png().toBuffer();const output=await deliveryImage(input,'image/png');assert.deepEqual(output.body,input);assert.equal(output.mime,'image/png');
});
