import test from 'node:test';import assert from 'node:assert/strict';
function html(object){const serialized=JSON.stringify(object).replaceAll('&','&amp;').replaceAll('"','&quot;');return '<html><astro-island props="'+serialized+'"></astro-island></html>';}
test('Asura unwraps public Astro data, excludes paid releases and retains image tile maps',async()=>{
 const {createAsuraAdapter}=await import('../server/catalogue/adapters/asura.mjs');const calls=[];
 const details={title:[0,'Hero'],description:[0,'<b>Story</b>'],coverUrl:[0,'https://cdn.asurascans.com/cover.jpg'],publicUrl:[0,'/comics/hero-12345678'],seriesSlug:[0,'hero'],chapters:[1,[[0,{number:[0,1],title:[0,'Start'],is_premium:[0,false],created_at:[0,'2026-01-01T00:00:00Z']}],[0,{number:[0,2],is_premium:[0,true]}],[0,{number:[0,3],early_access_until:[0,'2099-01-01T00:00:00Z']}]]]};
 const read=async(url,options)=>{calls.push(url);if(url.includes('/api/series?')){assert.equal(options.json,true);return {data:[{slug:'hero',title:'Hero',cover:'https://cdn.asurascans.com/cover.jpg'}],meta:{has_more:true}};}
  if(url.includes('/chapter/'))return html({pages:[1,[[0,{url:[0,'https://cdn.asurascans.com/1.jpg'],tiles:[1,[[0,3],[0,2],[0,1],[0,0]]],tile_cols:[0,2],tile_rows:[0,2]}]]]});return html(details);};
 const a=createAsuraAdapter({id:'asurascans',name:'Asura Scans',website:'https://asurascans.com/',language:'en'},read);
 const search=await a.call('search',{q:'Hero',page:2});assert.equal(search.nextPage,3);assert.equal(search.items[0].id,'asurascans-hero');assert.match(calls[0],/offset=20/);
 assert.equal((await a.call('details',{id:'asurascans-hero'})).description,'Story');
 const chapters=await a.call('chapters',{id:'asurascans-hero'});assert.equal(chapters.length,1);assert.equal(chapters[0].chapterNumber,1);
 const manifest=await a.call('pages',{id:chapters[0].id});assert.deepEqual(manifest.pages[0].transform,{type:'tiles',columns:2,rows:2,order:[3,2,1,0]});
 assert.ok(calls.includes('https://asurascans.com/comics/hero-12345678/chapter/1'));
 await assert.rejects(a.call('pages',{id:'asurascans:hero~2'}),/locked|public/i);
 await assert.rejects(a.call('chapters',{id:'asurascans-../admin'}),/identity/);
});
