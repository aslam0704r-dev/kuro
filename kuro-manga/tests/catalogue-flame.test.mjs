import test from 'node:test';import assert from 'node:assert/strict';
test('Flame uses deployment build IDs, public series JSON and stable chapter identities',async()=>{
 const {createFlameAdapter}=await import('../server/catalogue/adapters/flame.mjs');const calls=[];
 const series={series_id:2,title:'Hero',altTitles:['Hero II'],cover:'cover.jpg',status:'ongoing',author:['A'],tags:['Action'],description:'<b>Story</b>'};
 const read=async(url,options)=>{calls.push(url);if(url==='https://flame.test/')return '<html><script id="__NEXT_DATA__" type="application/json">{"buildId":"buildA"}</script></html>';
  assert.equal(options.json,true);if(url.includes('browse.json'))return {pageProps:{series:[series]}};
  if(url.includes('/series/2/'))return {pageProps:{chapter:{series_id:2,token:'token123',release_date:1700000000,images:{0:{name:'1.png'},1:{name:'2.png'}}}}};
  return {pageProps:{series,chapters:[{series_id:2,chapter:'1.50',token:'token123',title:'Extra',release_date:1700000000},{series_id:2,chapter:2,token:'locked',premium:true,release_date:1700000000}]}};
 };
 const p={id:'flamecomics',name:'Flame Comics',website:'https://flame.test/',language:'en'},a=createFlameAdapter(p,read);
 const search=await a.call('search',{q:'Hero',page:1});assert.equal(search.items[0].id,'flamecomics-2');
 assert.deepEqual((await a.call('search',{q:'unfindable',page:1})).items,[]);
 assert.equal((await a.call('details',{id:'flamecomics-2'})).description,'Story');
 const chapters=await a.call('chapters',{id:'flamecomics-2'});assert.equal(chapters.length,1);assert.equal(chapters[0].chapterNumber,1.5);
 const pages=await a.call('pages',{id:chapters[0].id});assert.equal(pages.pages.length,2);assert.match(pages.pages[0].url,/cdn.flamecomics.xyz\/uploads\/images\/series\/2\/token123\/1.png/);
 assert.ok(calls.some(url=>url.includes('/_next/data/buildA/browse.json')));
 await assert.rejects(a.call('pages',{id:'flamecomics:2~locked'}),/locked|public/i);
 await assert.rejects(a.call('pages',{id:'flamecomics:2~..%2Fevil'}),/identity/);
});
