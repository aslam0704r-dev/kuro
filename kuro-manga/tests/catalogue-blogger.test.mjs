import test from 'node:test';import assert from 'node:assert/strict';
test('Blogger series/chapter feeds preserve pagination, exact paths and complete page order',async()=>{
 const {createBloggerAdapter}=await import('../server/catalogue/adapters/blogger.mjs');let chapterRequests=0;
 const series={title:{$t:'Hero'},category:[{term:'Series'}],link:[{rel:'alternate',href:'https://blog.test/2026/01/hero.html'}],content:{$t:'<img src="https://images.test/c.png">'}};
 const entry=(n)=>({title:{$t:'Chapter '+n},category:[{term:'Chapter'}],link:[{rel:'alternate',href:'https://blog.test/2026/01/hero-'+n+'.html'}],published:{$t:'2026-01-01T00:00:00Z'}});
 const read=async(url,options)=>{if(url.includes('/feeds/')){assert.equal(options.json,true);if(url.includes('/Series'))return {feed:{entry:[series],'openSearch$totalResults':{$t:'30'}}};
  chapterRequests++;return {feed:{entry:chapterRequests===1?[entry(1)]:[entry(2)],'openSearch$totalResults':{$t:'2'},'openSearch$itemsPerPage':{$t:'1'}}};}
  if(url.includes('hero.html'))return '<html><h1 class="post-title">Hero</h1><div id="synopsis">Story</div><div id="clwd"><script>clwd.run("Hero");</script></div></html>';
  return '<html><div class="check-box"><div class="separator"><img src="https://images.test/1.jpg"><img src="https://images.test/2.jpg"></div></div></html>';};
 const p={id:'blogger',name:'Blogger',website:'https://blog.test/',language:'en'},a=createBloggerAdapter(p,read);
 const search=await a.call('search',{q:'Hero',page:1});assert.equal(search.nextPage,2);
 assert.equal((await a.call('details',{id:search.items[0].id})).description,'Story');
 const chapters=await a.call('chapters',{id:search.items[0].id});assert.equal(chapterRequests,2);assert.deepEqual(chapters.map(x=>x.chapterNumber),[2,1]);
 const pages=await a.call('pages',{id:chapters[0].id});assert.equal(pages.pages.length,2);
 await assert.rejects(a.call('pages',{id:'blogger:aHR0cHM6Ly9ldmlsLnRlc3Qv'}),/identity/);
});
