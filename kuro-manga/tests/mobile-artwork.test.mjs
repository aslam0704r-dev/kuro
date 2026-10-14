import test from 'node:test';import assert from 'node:assert/strict';
let art;try{art=await import('../client/mobile-artwork.mjs');}catch{art={};}
test('mobile original cover candidates preserve safe fallbacks and existing URL semantics',()=>{
 assert.equal(typeof art.mobileCoverCandidates,'function');
 assert.deepEqual(art.mobileCoverCandidates('https://books.example/wp-content/uploads/2026/a-193x278.jpg'),['https://books.example/wp-content/uploads/2026/a.jpg','https://books.example/wp-content/uploads/2026/a-193x278.jpg']);
 assert.deepEqual(art.mobileCoverCandidates('https://uploads.mangadex.org/covers/abc/def.jpg.256.jpg'),['https://uploads.mangadex.org/covers/abc/def.jpg','https://uploads.mangadex.org/covers/abc/def.jpg.256.jpg']);
 assert.deepEqual(art.mobileCoverCandidates('https://cdn.example/a.webp?token=signed'),['https://cdn.example/a.webp?token=signed']);
 assert.deepEqual(art.mobileCoverCandidates('https://cdn.example/a-193x278.jpg'),['https://cdn.example/a-193x278.jpg']);
 assert.deepEqual(art.mobileCoverCandidates('javascript:alert(1)'),[]);
});
