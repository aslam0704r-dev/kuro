import test from 'node:test';
import assert from 'node:assert/strict';
import {createCatalogueCore} from '../client/catalogue-core.mjs';
function setup(results,ids=['fast','slow']){
 let definitions,state;const React={useState:value=>{state??=typeof value==='function'?value():value;return [state,next=>{state=typeof next==='function'?next(state):next;}];},useMemo:fn=>fn(),useCallback:fn=>fn};
 const manager={get:id=>ids.includes(id)?{id,capabilities:{readable:true}}:undefined,require:id=>({id,capabilities:{readable:true}})};
 const api={useDiscovery:()=>({items:[],sourceCount:0})};const modules={15:React,1548:{useQueries:options=>{definitions=options.queries;return results;},useQueryClient:()=>({resetQueries:async()=>{}})},789:{sourceManager:manager},870:{mergePages:pages=>pages.flatMap(p=>p.items||[])},1598:{fetchDiscoveryPage:async(q,filters,cursors)=>({items:[{id:q+'-'+cursors[0].sourceId}],reports:[],next:[],failed:[]})},791:{relevanceScore:()=>1},1595:{useEnabledSources:()=>ids}};
 const core=createCatalogueCore([]),replacement=core.initialize(1597,api,id=>modules[id])||api;
 return {hook:replacement.useDiscovery,definitions:()=>definitions};
}
const ready={data:{items:[{id:'fast-title',title:'Mountain Friends'}],reports:[{sourceId:'fast',ok:true}],next:[{sourceId:'fast',page:2,signature:'page1'}],failed:[]},dataUpdatedAt:1,isPending:false,isFetching:false,refetch:async()=>{}};
const slow={data:undefined,dataUpdatedAt:0,isPending:true,isFetching:true,refetch:async()=>{}};
test('search publishes a completed provider while another provider is still pending',()=>{
 const {hook}=setup([ready,slow]);const result=hook('Friends',{readableOnly:true,sort:'RELEVANCE'});assert.deepEqual(result.items.map(row=>row.id),['fast-title']);assert.equal(result.sourceCount,2);assert.equal(result.isLoading,false);assert.equal(result.isFetching,true);
});
test('each provider query fetches only its own cursor',async()=>{
 const {hook,definitions}=setup([ready,slow]);hook('Friends',{sort:'RELEVANCE'});assert.equal(definitions()?.length,2);const result=await definitions()[0].queryFn();assert.equal(result.items[0].id,'Friends-fast');
});
test('pagination adds completed providers without waiting for another source first page',()=>{
 const {hook,definitions}=setup([ready,slow]);const result=hook('Friends',{sort:'RELEVANCE'});assert.equal(result.hasNextPage,true);result.fetchNextPage();hook('Friends',{sort:'RELEVANCE'});assert.equal(definitions()?.length,3);assert.ok(definitions().some(row=>row.queryKey.includes(2)));
});
test('query changes use new provider keys rather than publishing old query pages',()=>{
 const {hook,definitions}=setup([ready,slow]);hook('First',{sort:'RELEVANCE'});const first=definitions()?.map(q=>JSON.stringify(q.queryKey));hook('Second',{sort:'RELEVANCE'});const next=definitions()?.map(q=>JSON.stringify(q.queryKey));assert.ok(first?.length);assert.notDeepEqual(first,next);assert.ok(next.every(key=>key.includes('Second')));
});
