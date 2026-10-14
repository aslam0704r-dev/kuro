import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { permittedURL, publicAddress, fetchPublic } from '../server/catalogue/transport.mjs';
import { validateImage, sanitizeManifest } from '../server/catalogue/images.mjs';
import { createTickets } from '../server/catalogue/tickets.mjs';

const policy={hosts:['guya.cubari.moe'],paths:['/media/']};
test('only exact configured HTTPS hosts and paths can be fetched',()=>{
 for(const url of ['http://guya.cubari.moe/media/a.jpg','https://guya.cubari.moe.evil.test/media/a.jpg','https://evil.guya.cubari.moe/media/a.jpg',
   'https://user:pass@guya.cubari.moe/media/a.jpg','https://guya.cubari.moe:444/media/a.jpg','https://guya.cubari.moe/admin',
   'https://guya.cubari.moe/media/../api/a','https://guya.cubari.moe/media/a.jpg#token']) assert.equal(permittedURL(url,policy),false,url);
 assert.equal(permittedURL('https://guya.cubari.moe/media/a.jpg',policy),true);
 assert.equal(permittedURL('https://guya.cubari.moe/media/page%201.jpg',policy),true);
 assert.equal(permittedURL('https://guya.cubari.moe/media/page%0D%0A.jpg',policy),false);
});
test('private, reserved and mapped private IP addresses are denied',()=>{
 for(const ip of ['0.1.2.3','10.1.2.3','127.0.0.1','169.254.1.1','172.16.0.1','192.168.0.1','100.64.1.2','192.0.0.1','192.0.2.1','198.18.1.1','198.51.100.1','203.0.113.1','224.1.1.1','255.255.255.255','::1','::ffff:127.0.0.1','fe80::1','fc00::1','2001:db8::1']) assert.equal(publicAddress(ip),false,ip);
 assert.equal(publicAddress('8.8.8.8'),true); assert.equal(publicAddress('1.1.1.1'),true);
});
test('unsafe lookup results never reach the HTTPS request boundary',async()=>{
 let sent=0; await assert.rejects(fetchPublic('https://guya.cubari.moe/media/a.jpg',policy,{lookup:async()=>[{address:'127.0.0.1',family:4}],request:()=>{sent++;}}),/Public address/);
 assert.equal(sent,0);
});
test('image bytes must match declared MIME and decode fully',async()=>{
 const good=await sharp({create:{width:4,height:7,channels:3,background:'#123456'}}).png().toBuffer();
 assert.deepEqual(await validateImage(good,'image/png'),{mime:'image/png',width:4,height:7});
 await assert.rejects(validateImage(good,'image/jpeg'),/MIME/);
 await assert.rejects(validateImage(Buffer.from('<html>blocked</html>'),'image/png'),/signature/);
 await assert.rejects(validateImage(good.subarray(0,30),'image/png'),/decode|invalid/i);
 await assert.rejects(validateImage(Buffer.from('<svg/>'),'image/svg+xml'),/type|MIME/i);
});
test('oversized encoded images are rejected before decoding',async()=>{
 await assert.rejects(validateImage(Buffer.alloc(8*1024*1024+1),'image/jpeg'),/size/i);
});
test('manifests reject disallowed pages and keep duplicate URL order stable',()=>{
 const manifest={chapterId:'guya:a',pages:[{index:0,url:'https://guya.cubari.moe/media/a.png'},
 {index:1,url:'https://guya.cubari.moe/media/a.png'},{index:2,url:'https://guya.cubari.moe/media/b.png'}]};
 assert.deepEqual(sanitizeManifest(manifest,policy).pages.map(x=>[x.index,x.url]),[[0,'https://guya.cubari.moe/media/a.png'],[1,'https://guya.cubari.moe/media/b.png']]);
 assert.throws(()=>sanitizeManifest({...manifest,pages:[{url:'https://127.0.0.1/private'}]},policy),/Page URL/);
 assert.throws(()=>sanitizeManifest({...manifest,pages:[]},policy),/pages/i);
});
test('tickets cannot be changed, replayed after expiry, or minted for unsafe URLs',()=>{
 const tickets=createTickets(Buffer.alloc(32,7));
 const token=tickets.issue({provider:'guya',url:'https://guya.cubari.moe/media/a.jpg'},1000,policy);
 assert.equal(tickets.verify(token,1001,()=>policy).provider,'guya');
 assert.throws(()=>tickets.verify(token.slice(0,-2)+'xx',1001,()=>policy),/ticket/i);
 assert.throws(()=>tickets.verify(token,1000+86400001,()=>policy),/expired/i);
 assert.throws(()=>tickets.issue({provider:'guya',url:'https://localhost/private'},1000,policy),/URL/);
});
