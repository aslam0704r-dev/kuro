import test from 'node:test';import assert from 'node:assert/strict';
import {createAsuraAdapter} from '../server/catalogue/adapters/asura.mjs';import {createFlameAdapter} from '../server/catalogue/adapters/flame.mjs';import {createIkenAdapter} from '../server/catalogue/adapters/iken.mjs';
test('API source families honor status filters and explicitly report local page filtering',async()=>{
 const p={id:'source',name:'Source',website:'https://source.test/',apiUrl:'https://api.source.test/'};
 const adapters=[createAsuraAdapter(p,async()=>({data:[{slug:'hero',title:'Hero',status:'ongoing'}]})),
 createFlameAdapter(p,async url=>url===p.website?'<html><script id="__NEXT_DATA__">{"buildId":"buildA"}</script></html>':{pageProps:{series:[{series_id:2,title:'Hero',status:'ongoing'}]}}),
 createIkenAdapter(p,async()=>({posts:[{id:2,slug:'hero',postTitle:'Hero',seriesStatus:'ONGOING'}],totalCount:1}))];
 for(const adapter of adapters){const result=await adapter.call('search',{q:'Hero',page:1,filters:{status:['COMPLETED'],kind:'ALL',genres:[]}});assert.deepEqual(result.items,[]);assert.match(result.notice,/returned page/);}
});
test('Asura empty API search is a real empty result when the source reports no further page',async()=>{
 const a=createAsuraAdapter({id:'asurascans',name:'Asura',website:'https://asurascans.com/'},async()=>({data:null,meta:{has_more:false}}));assert.deepEqual((await a.call('search',{q:'no-match',page:1})).items,[]);
});
