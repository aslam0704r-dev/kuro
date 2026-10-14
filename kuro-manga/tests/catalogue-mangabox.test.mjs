import test from 'node:test';import assert from 'node:assert/strict';
test('MangaBox uses its real catalogue/search paths and public chapter API without executing scripts',async()=>{
 const {createMangaBoxAdapter}=await import('../server/catalogue/adapters/mangabox.mjs');const calls=[];
 const p={id:'mangabats',name:'MangaBats',website:'https://www.mangabats.com/',seriesPath:'/manga/',language:'en'};
 const read=async(url,options)=>{calls.push(url);if(url.includes('/api/manga/')){assert.equal(options.json,true);return {success:true,data:{chapters:[{chapter_name:'Chapter 1.5',chapter_slug:'chapter-1-5',chapter_num:1.5,updated_at:'2026-01-01T00:00:00Z'}]}};}
  if(url.includes('/chapter-'))return '<html><script>const cdns=["https://cdn.test"]; const chapterImages=["hero/1.jpg","hero/2.jpg"]; unknownFunction();</script></html>';
  if(url.endsWith('/manga/hero'))return '<html><div class="manga-info-top"><h1>Hero</h1></div><div id="contentBox">Story</div></html>';
  return '<html><div class="list-comic-item-wrap"><h3><a href="/manga/hero">Hero</a></h3><img src="https://cdn.test/cover.jpg"></div></html>';};
 const a=createMangaBoxAdapter(p,read),result=await a.call('search',{q:'Hero II!',page:2});assert.match(calls[0],/search\/story\/hero_ii\?page=2/);
 const id=result.items[0].id;assert.equal((await a.call('details',{id})).description,'Story');
 const chapters=await a.call('chapters',{id});assert.equal(chapters[0].chapterNumber,1.5);
 const pages=await a.call('pages',{id:chapters[0].id});assert.deepEqual(pages.pages.map(x=>x.url),['https://cdn.test/hero/1.jpg','https://cdn.test/hero/2.jpg']);
});
