import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMadaraCatalogue,parseMadaraDetails,parseMadaraChapters,parseMadaraPages,encodePathId} from '../server/catalogue/adapters/madara.mjs';
const p={id:'sample',name:'Sample',website:'https://source.test/',seriesPath:'/comics/',chapterPattern:'^/[a-z0-9-]+-chapter-[0-9.-]+/$',language:'tr',
 selectors:{pages:'.read-container img',chapters:'#chapterlist a'}};
test('configured reading container retains every image in order without unrelated ads',()=>{
 const pages=parseMadaraPages('<html><img src="https://ads.test/a.jpg"><div class="read-container"><img data-src="https://images.test/1.jpg"><img src="https://images.test/2.jpg"></div></html>',p,'sample:abc');
 assert.deepEqual(pages.pages.map(x=>x.url),['https://images.test/1.jpg','https://images.test/2.jpg']);
});
test('Themesia titles, synopsis and chapters use real structures and exclude locked releases',()=>{
 const id=encodePathId(p,'/comics/hero/','-');
 const html='<html><div class="infox"><h1 class="entry-title">Hero</h1><div class="entry-content"><p>Story</p></div></div><div id="chapterlist"><li><a href="/hero-chapter-1/">Bölüm 1</a></li><li><a href="/hero-chapter-1.5/">Bölüm 1.5</a></li><li class="paid"><a href="/hero-chapter-2/">Bölüm 2</a></li></div></html>';
 assert.equal(parseMadaraDetails(html,p,id).description,'Story');assert.deepEqual(parseMadaraChapters(html,p,id).map(x=>x.chapterNumber),[1.5,1]);
});
test('Themesia catalogue pagination follows actual next link and stable source paths',()=>{
 const result=parseMadaraCatalogue('<html><div class="bs"><div class="bsx"><a title="Hero" href="/comics/hero/"><img src="https://images.test/cover.jpg"><div class="tt">Hero</div></a></div></div><div class="hpage"><a class="r" href="/comics/?page=2">Next</a></div></html>',p,1);
 assert.equal(result.items[0].title,'Hero');assert.equal(result.nextPage,2);
});
test('Themesia search encodes actual title and page parameters without WordPress-only search',async()=>{
 const module=await import('../server/catalogue/adapters/families.mjs');const calls=[];
 const adapter=module.createFamilyAdapter({...p,adapter:'themesia'},async url=>{calls.push(url);return '<html><div class="bs"><a title="Hero" href="/comics/hero/">Hero</a></div></html>';});
 await adapter.call('search',{q:'Hero & Other',page:2});const u=new URL(calls[0]);assert.equal(u.searchParams.get('title'),'Hero & Other');assert.equal(u.searchParams.get('page'),'2');assert.equal(u.searchParams.has('post_type'),false);
 await adapter.call('latest',{page:1});assert.equal(new URL(calls[1]).searchParams.get('order'),'update');
});
test('configured image selection rejects malformed real pages rather than silently dropping them',()=>{
 assert.throws(()=>parseMadaraPages('<html><div class="read-container"><img src="http://images.test/1.jpg"></div></html>',p,'sample:abc'),/page URL/);
});
test('an empty real search does not return popular sidebar or footer comment links',()=>{
 const html='<html><body><main class="postbody"><div class="listupd">No matching titles</div></main><aside><a href="/comics/hero/">Popular Hero</a></aside><footer><a href="/comics/hero/">Comment on Hero</a></footer></body></html>';
 assert.deepEqual(parseMadaraCatalogue(html,p).items,[]);
});
