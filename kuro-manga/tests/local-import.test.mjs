import test from 'node:test';
import assert from 'node:assert/strict';
let model;
try { model = await import('../client/local/model.mjs'); } catch { model = {}; }
test('the local import validator is available', () => assert.equal(typeof model.fileKind,'function'));
test('comic container names include the main device formats', () => {
 for (const file of ['book.cbz','book.zip','book.cbr','book.rar','book.cb7','book.7z','book.cbt','book.tar','book.tar.gz','book.epub']) assert.equal(model.fileKind?.(file),'archive');
 assert.equal(model.fileKind?.('book.pdf'),'pdf');
 for(const name of ['2.JPG','page.png','1.webp','p.gif','p.bmp','p.avif']) assert.equal(model.fileKind?.(name),'image');
 assert.equal(model.fileKind?.('page.svg'),'unsupported');assert.equal(model.fileKind?.('file.exe'),'unsupported');
});
test('natural page order puts 2 before 10 and sorts folders by number', () => {
 assert.deepEqual(['chapter10/1.jpg','chapter2/10.jpg','chapter2/2.jpg','chapter2/1.jpg'].sort(model.pageCompare), ['chapter2/1.jpg','chapter2/2.jpg','chapter2/10.jpg','chapter10/1.jpg']);
});
test('archive paths reject traversal, absolute paths, controls, links and repeated names', () => {
 assert.equal(typeof model.safeEntry,'function');
 for(const path of ['../1.jpg','/1.jpg','C:/a.jpg','a/../../b.jpg','a\u0000b.jpg','a/./b.jpg']) assert.throws(()=>model.safeEntry({path,size:12,type:'File'}),/path/i);
 assert.throws(()=>model.safeEntry({path:'1.jpg',size:12,type:'SymbolicLink'}),/link|regular/i);
 assert.throws(()=>model.safeEntry({path:'1.jpg',size:12,type:'File',hardlink:'outside'}),/link/i);
 assert.throws(()=>model.safeEntry({path:'1.jpg',size:13*1024*1024,type:'File'}),/12 MiB/i);
 assert.throws(()=>model.safeEntry({path:'1.jpg',size:-1,type:'File'}),/size/i);
 assert.equal(model.safeEntry({path:'chapter 2/2.jpg',size:12,type:'File'}).path,'chapter 2/2.jpg');
 assert.equal(model.safeEntry({path:'__MACOSX/._1.jpg',size:12,type:'File'}).skip,true);
});
test('signature checks do not trust extensions or browser MIME', () => {
 assert.equal(typeof model.imageType,'function');
 assert.throws(()=>model.imageType(new TextEncoder().encode('<svg onload="alert(1)"/>')),/supported|signature/i);
 assert.throws(()=>model.imageType(Uint8Array.of(255,216,255,0)),/damaged|truncated/i);
 const webp=Uint8Array.from(Buffer.from('52494646140000005745425056503820080000000000000000000000','hex'));
 assert.equal(model.imageType(webp),'image/webp');webp[4]=100;assert.throws(()=>model.imageType(webp),/damaged|truncated/i);
});
test('dimensions and aggregate limits reject oversized books before saving', () => {
 assert.equal(typeof model.validateDimensions,'function');
 assert.throws(()=>model.validateDimensions(32768,2),/large|dimension/i);
 assert.throws(()=>model.validateDimensions(8000,8000),/large|pixels/i);
 assert.throws(()=>model.validateDimensions(0,100),/dimension/i);
 assert.doesNotThrow(()=>model.validateDimensions(1200,1800));
 assert.throws(()=>model.validateInput([{name:'a.cbz',size:151*1024*1024}]),/150 MiB/);
 assert.throws(()=>model.validateInput([{name:'a.pdf',size:1},{name:'b.cbz',size:1}]),/one comic/i);
 assert.throws(()=>model.validateInput(Array.from({length:601},()=>({name:'a.jpg',size:1}))),/600/);
});
test('title and stable content IDs ignore paths and retain separate ordered volumes', async () => {
 assert.equal(model.cleanTitle?.('  ../My comic.cbz  '),'My comic');
 assert.equal(model.cleanTitle?.('book\u0000 name.pdf'),'book name');
 assert.equal(typeof model.bookIdentity,'function');
 const a=await model.bookIdentity(['a'.repeat(64),'b'.repeat(64)]),b=await model.bookIdentity(['a'.repeat(64),'b'.repeat(64)]);
 assert.equal(a,b);assert.match(a,/^local-[a-f0-9]{64}$/);assert.notEqual(a,await model.bookIdentity(['b'.repeat(64),'a'.repeat(64)]));
});
test('JPEG frame dimensions are checked before browser decoding',()=>{
 const jpeg=Uint8Array.from(Buffer.from('ffd8ffc00011082000200003011100021100031100ffd9','hex'));
 assert.throws(()=>model.imageType(jpeg),/large|pixels/i);
});
test('edited display titles preserve literal markup and slashes as plain text',()=>{
 assert.equal(typeof model.cleanDisplayTitle,'function');assert.equal(model.cleanDisplayTitle('<b>My book</b>'),'<b>My book</b>');assert.equal(model.cleanDisplayTitle('A / B'),'A / B');assert.equal(model.cleanDisplayTitle('Name\u0000 here'),'Name here');
});
