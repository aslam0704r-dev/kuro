import test from 'node:test';import assert from 'node:assert/strict';
test('Iken catalogues paginate truthfully, load complete chapter lists and refuse locked pages',async()=>{
 const {createIkenAdapter}=await import('../server/catalogue/adapters/iken.mjs');const calls=[];
 const post={id:9,slug:'hero',postTitle:'Hero',postContent:'<b>Story</b>',featuredImage:'https://image.test/cover.png',chapters:[{id:11,number:1,title:'Start',price:0,createdAt:'2026-01-01T00:00:00Z'},{id:12,number:2,isLocked:true}]};
 const read=async(url,options)=>{calls.push(url);assert.equal(options.json,true);if(url.includes('/api/query'))return {posts:[post,{...post,id:10,slug:'novel',isNovel:true}],totalCount:40};
  if(url.includes('/api/post'))return {post,totalChapterCount:3};if(url.includes('/api/chapters'))return {post:{chapters:[...post.chapters,{id:13,number:1.5,price:0}]}};
  return {chapter:{isLockedByCoins:url.includes('chapterId=12'),images:[{url:'https://image.test/2.png',order:2},{url:'https://image.test/1.png',order:1}]}};
 };
 const p={id:'hivetoons',name:'HiveToons',website:'https://hivetoons.org/',apiUrl:'https://api.hivetoons.org/',language:'en'},a=createIkenAdapter(p,read);
 const search=await a.call('search',{q:'Hero',page:1});assert.equal(search.items.length,1);assert.equal(search.nextPage,2);
 assert.equal((await a.call('details',{id:search.items[0].id})).description,'Story');
 const chapters=await a.call('chapters',{id:search.items[0].id});assert.deepEqual(chapters.map(x=>x.chapterNumber),[1.5,1]);assert.ok(calls.some(url=>url.includes('/api/chapters?postId=9')));
 const pages=await a.call('pages',{id:'hivetoons:11'});assert.deepEqual(pages.pages.map(x=>x.url),['https://image.test/1.png','https://image.test/2.png']);
 await assert.rejects(a.call('pages',{id:'hivetoons:12'}),/locked/i);await assert.rejects(a.call('details',{id:'hivetoons-invalid'}),/identity/);
});
