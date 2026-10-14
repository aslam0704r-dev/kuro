import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMadaraCatalogue, parseMadaraDetails, parseMadaraChapters, parseMadaraPages, encodePathId } from '../server/catalogue/adapters/madara.mjs';
import { createGuyaAdapter } from '../server/catalogue/adapters/guya.mjs';
import { parseDynastyCatalogue, parseDynastyPages } from '../server/catalogue/adapters/dynasty.mjs';
import { mapMetadata, createMetadataAdapter } from '../server/catalogue/adapters/metadata.mjs';

const provider={id:'manhuaplus',website:'https://manhuaplus.com/',language:'en',seriesPath:'/manga/'};
test('Madara catalogue ignores offsite links and retains distinct stable series IDs',()=>{
 const html='<html><div class="page-item-detail"><div class="post-title"><h3><a href="/manga/hero/">Hero</a></h3></div><img data-src="https://cdn.manhuaplus.com/hero.jpg"></div><div class="page-item-detail"><div class="post-title"><h3><a href="https://evil.test/manga/hero/">Bad</a></h3></div></div><a class="next page-numbers" href="/manga/page/2/">Next</a></html>';
 const result=parseMadaraCatalogue(html,provider,1);assert.equal(result.items.length,1);assert.equal(result.items[0].title,'Hero');assert.equal(result.items[0].id,'manhuaplus-L21hbmdhL2hlcm8v');assert.equal(result.nextPage,2);
});
test('details parse plain text and reject catalogue challenges instead of returning fake emptiness',()=>{
 const html='<html><h1 class="post-title">Hero</h1><div class="description-summary"><p>Good <em>story</em></p></div><div class="author-content"><a>A</a></div><div class="genres-content"><a>Action</a></div></html>';
 const detail=parseMadaraDetails(html,provider,'manhuaplus-L21hbmdhL2hlcm8v');assert.equal(detail.description,'Good story');assert.equal(detail.author,'A');assert.deepEqual(detail.genres,['Action']);
 assert.throws(()=>parseMadaraCatalogue('<html><title>Just a moment...</title></html>',provider,1),/public catalogue/);
});
test('chapter lists preserve decimal numbers, real timestamps, URL identity and latest-first order',()=>{
 const html='<html><li class="wp-manga-chapter"><a href="/manga/hero/chapter-1/">Chapter 1</a><time datetime="2026-01-01T00:00:00Z"></time></li><li class="wp-manga-chapter"><a href="/manga/hero/chapter-1-5/">Chapter 1.5</a></li><li class="wp-manga-chapter"><a href="#">Locked</a></li></html>';
 const rows=parseMadaraChapters(html,provider,'manhuaplus-L21hbmdhL2hlcm8v');assert.deepEqual(rows.map(x=>x.chapterNumber),[1.5,1]);assert.equal(rows[0].publishDate,0);assert.equal(rows[1].publishDate,1767225600000);assert.equal(rows.length,2);
});
test('reader selectors collect only actual reading content and never scripts or advertisements',()=>{
 const manifest=parseMadaraPages('<html><img src="https://ads.test/a.jpg"><div class="reading-content"><img data-src="https://cdn.manhuaplus.com/1.jpg"><img src="https://cdn.manhuaplus.com/2.jpg"></div><script>evil()</script></html>',provider,'manhuaplus:YWJj');
 assert.deepEqual(manifest.pages.map(x=>x.url),['https://cdn.manhuaplus.com/1.jpg','https://cdn.manhuaplus.com/2.jpg']);
});
test('MangaReader-style sites accept only literal public image JSON and their chapter paths',()=>{
 const modern={id:'madarascans',name:'Madara Scans',website:'https://madarascans.net/',seriesPath:'/series/',chapterPattern:'^/[a-z0-9-]+-chapter-[0-9.-]+/$'};
 const rows=parseMadaraChapters('<html><div class="eplister"><a href="/hero-chapter-1/">Chapter 1</a></div></html>',modern,encodePathId(modern,'https://madarascans.net/series/hero/','-'));
 assert.equal(rows.length,1);const pages=parseMadaraPages('<html><script>ts_reader.run({"sources":[{"images":["https://madarascans.net/1.jpg","https://madarascans.net/2.jpg"]}]});</script></html>',modern,rows[0].id);assert.equal(pages.pages.length,2);
 assert.throws(()=>parseMadaraPages('<html><script>ts_reader.run({"sources":[{"images":["http://madarascans.net/1.jpg"]}]});</script></html>',modern,rows[0].id),/page URL/);
});
test('path IDs reject traversal, offsite paths and noncanonical encodings',()=>{
 assert.equal(encodePathId(provider,'https://manhuaplus.com/manga/hero/','-'),'manhuaplus-L21hbmdhL2hlcm8v');
 assert.throws(()=>encodePathId(provider,'https://evil.test/manga/hero/','-'),/path/i);
 assert.throws(()=>encodePathId(provider,'https://manhuaplus.com/admin','-'),/path/i);
});
test('reading requests use the provider public list style to collect the complete manifest',async()=>{
 const {createMadaraAdapter}=await import('../server/catalogue/adapters/madara.mjs');let requested;
 const adapter=createMadaraAdapter(provider,async url=>{requested=url;return '<html><div class="reading-content"><img src="https://cdn.manhuaplus.com/1.jpg"><img src="https://cdn.manhuaplus.com/2.jpg"></div></html>';});
 const pages=await adapter.call('pages',{id:'manhuaplus:L21hbmdhL2hlcm8vY2hhcHRlci0xLw'});assert.equal(new URL(requested).searchParams.get('style'),'list');assert.equal(pages.pages.length,2);
});
test('genre badges and status text do not replace the catalogue title',()=>{
 const html='<html><div class="page-item-detail"><div class="post-title"><a href="/manga/hero/">Manga</a><h3><a href="/manga/hero/">Hero</a></h3></div></div></html>';
 assert.equal(parseMadaraCatalogue(html,provider).items[0].title,'Hero');
});
test('Guya uses the selected chapter group and credits the scanlator without fabricated release dates',async()=>{
 const read=async url=>url.includes('get_all_series')?{'Hero':{slug:'Hero',author:'A',artist:'A',description:'Story',cover:'/media/cover.jpg',last_updated:10}}:
  {title:'Hero',slug:'Hero',author:'A',cover:'/media/cover.jpg',groups:{'7':'Team'},chapters:{'1':{title:'Start',volume:'1',folder:'0001',groups:{'7':['01.jpg?v3','02.png']},release_date:{'7':10}},'1.5':{title:'Extra',folder:'0001-5',groups:{'7':['01.png']},release_date:{}}}};
 const adapter=createGuyaAdapter({id:'guya',website:'https://guya.cubari.moe/',language:'en'},read);
 const result=await adapter.call('search',{q:'Hero',page:1});assert.equal(result.items[0].id,'guya-Hero');assert.equal(result.nextPage,undefined);
 const chapters=await adapter.call('chapters',{id:'guya-Hero'});assert.equal(chapters[0].chapterNumber,1.5);assert.equal(chapters[0].publishDate,0);
 const pages=await adapter.call('pages',{id:'guya:Hero~1~7'});assert.equal(pages.pages[0].url,'https://guya.cubari.moe/media/manga/Hero/chapters/0001/7/01.jpg?v3');assert.equal(pages.credits[0].name,'Team');
});
test('Dynasty captures series and one-shot identities and extracts JSON page data without evaluation',()=>{
 const rows=parseDynastyCatalogue('<html><a href="/series/hero">Hero</a><a href="/chapters/one_shot">One shot</a><a href="/chapters/added">Directory</a></html>',{id:'dynasty',website:'https://dynasty-scans.com/'});
 assert.equal(rows.items.length,2);assert.equal(rows.items[0].title,'Hero');
 const pages=parseDynastyPages('<html><script>var pages = [{"image":"/system/a.jpg","width":800,"height":1200}];</script></html>','dynasty:one_shot');
 assert.equal(pages.pages[0].url,'https://dynasty-scans.com/system/a.jpg');
 assert.throws(()=>parseDynastyPages('<script>var pages = evil();</script>','dynasty:a'),/manifest/i);
});
test('metadata adapters expose shared identities without reading capabilities or invented chapters',()=>{
 const jikan=mapMetadata('jikan',{mal_id:13,title:'One Piece',title_english:'One Piece',title_synonyms:[],images:{jpg:{image_url:'https://cdn.myanimelist.net/a.jpg'}},synopsis:'Story',status:'Publishing',genres:[{name:'Adventure'}],authors:[{name:'Oda, Eiichiro'}],score:9.21});
 assert.deepEqual(jikan.identityKeys,['mal:13']);assert.equal(jikan.catalogueOnly,true);assert.equal(jikan.latestChapter,undefined);
 const baka=mapMetadata('mangabaka',{id:377,title:'ONE PIECE',authors:['Eiichirou Oda'],source:{my_anime_list:{id:13},anilist:{id:30013}},cover:{x250:{x1:'https://cdn.mangabaka.dev/cover'}},status:'releasing',genres:['action'],rating:89});
 assert.ok(baka.identityKeys.includes('mal:13'));assert.ok(baka.identityKeys.includes('anilist:30013'));assert.equal(baka.rating,8.9);
});
test('metadata pagination follows provider hasNextPage rather than inventing another page',async()=>{
 const adapter=createMetadataAdapter({id:'jikan'},async()=>({data:[{mal_id:13,title:'One Piece',genres:[],authors:[]}],pagination:{has_next_page:false,items:{total:1}}}));
 const result=await adapter.call('search',{q:'one',page:1});assert.equal(result.nextPage,undefined);assert.equal(result.total,1);await assert.rejects(adapter.call('pages',{id:'jikan:13'}),/metadata/i);
});
test('AniList emits complete structured queries and JSON variables',async()=>{
 const captured=[];const adapter=createMetadataAdapter({id:'anilist'},async(_url,options)=>{const body=JSON.parse(options.body);captured.push(body);const safe={id:1,type:'MANGA',isAdult:false,tags:[],title:{english:'Hero'},genres:[]};return body.variables.id?{data:{Media:safe}}:{data:{Page:{pageInfo:{hasNextPage:false,total:1},media:[safe]}}};});
 await adapter.call('search',{q:'Hero "hi"',page:1});await adapter.call('details',{id:'anilist-1'});
 for(const body of captured)assert.equal([...body.query].filter(c=>c==='{').length,[...body.query].filter(c=>c==='}').length);
 assert.equal(captured[0].variables.q,'Hero "hi"');assert.equal(captured[1].variables.id,1);
});
