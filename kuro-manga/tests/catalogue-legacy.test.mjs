import test from 'node:test';import assert from 'node:assert/strict';import {legacyChapterURL,parseLegacyPages} from '../server/catalogue/adapters/legacy.mjs';
test('all preserved reader IDs map to fixed provider chapter URLs',()=>{
 const examples=[['mangaread','mangaread:hero~chapter-1','https://www.mangaread.org/manga/hero/chapter-1/?style=list'],['mgeko','mgeko:hero-chapter-1','https://www.mgeko.cc/reader/en/hero-chapter-1/'],
 ['mangakatana','mangakatana:hero~12~c1_5','https://mangakatana.com/manga/hero.12/c1.5'],['mangapill','mangapill:12-100010~hero','https://mangapill.com/chapters/12-100010/hero'],
 ['weebcentral','weebcentral:01M4SMPHHG5CYWMKFM9QZQXSQW','https://weebcentral.com/chapters/01M4SMPHHG5CYWMKFM9QZQXSQW/images?is_prev=False&current_page=1&reading_style=long_strip']];
 for(const [provider,id,want]of examples)assert.equal(legacyChapterURL(provider,id),want);
 for(const [provider,id]of [['mgeko','mgeko:../../private'],['mangaread','mangaread:hero~https://evil.test'],['mangapill','mangapill:12~../../a']])assert.throws(()=>legacyChapterURL(provider,id),/identity/);
});
test('legacy reader parsing does not silently drop an invalid middle image',()=>{
 assert.throws(()=>parseLegacyPages('mangapill','mangapill:12-1~hero','<img class="js-page" data-src="https://cdn.readdetectiveconan.com/1.jpg"><img class="js-page" data-src="http://cdn.readdetectiveconan.com/2.jpg">'),/invalid/i);
 const pages=parseLegacyPages('mgeko','mgeko:hero-chapter-1','<div id="chapter-reader"><img id="image-0" src="https://imgsrv5.com/1.jpg"></div>');assert.equal(pages.pages[0].url,'https://imgsrv5.com/1.jpg');
});
