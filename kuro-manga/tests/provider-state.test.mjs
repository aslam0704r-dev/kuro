import test from 'node:test';
import assert from 'node:assert/strict';
import {providerState} from '../dist/provider-state.mjs';
import {readingSourceNotice} from '../client/source-notice.mjs';

const reading={id:'mangadex',name:'MangaDex',adapter:'legacy',readable:true,available:true,contentPolicy:{state:'eligible'}},metadata={id:'anilist',name:'AniList',adapter:'metadata',readable:false,available:true,contentPolicy:{state:'eligible'}},comix={id:'comix',name:'Comix',adapter:null,mode:'unresolved',available:false,contentPolicy:{state:'restricted'}};
function fixture(preferences,providers=[reading,metadata,comix]){return {registry:{providers},store:{getState:()=>({sourcePreferences:preferences})},sourceState:id=>providerState(providers.find(p=>p.id===id),preferences[id],id!=='comix')};}

test('missing, external, restricted and unconfigured connections cannot show active',()=>{
 for(const provider of [undefined,comix,{...reading,adapter:null},{...reading,available:false},{...reading,contentPolicy:{state:'blocked'}},{...reading,contentPolicy:{state:'restricted'}},{id:'external',mode:'external'}]){const state=providerState(provider,{enabled:true},true);assert.equal(state.canEnable,false);assert.equal(state.active,false);assert.equal(state.reading,false);}
 assert.equal(providerState(reading,{enabled:true},false).canEnable,false);
});
test('a usable metadata connection is active without claiming reading pages',()=>{
 const state=providerState(metadata,{enabled:true},true);assert.equal(state.active,true);assert.equal(state.reading,false);assert.equal(state.label,'Metadata only');
});
test('Comix-only migration explains its unavailable connection without changing another source',()=>{
 const prefs={comix:{enabled:false,unavailableSelection:true},mangadex:{enabled:false}},core=fixture(prefs),notice=readingSourceNotice(core);assert.ok(notice.messages.some(value=>value.includes('Comix')));assert.equal(notice.canEnableMangaDex,true);assert.equal(prefs.mangadex.enabled,false);
});
test('a working reading selection leaves the existing screen unchanged',()=>{
 assert.equal(readingSourceNotice(fixture({mangadex:{enabled:true}})),null);
});
test('an unavailable search source does not silently fall back to a different source',()=>{
 const notice=readingSourceNotice(fixture({mangadex:{enabled:true}}),'comix');assert.notEqual(notice,null);assert.equal(notice.title,'No reader for this source');assert.ok(notice.messages[0].includes('Comix'));assert.equal(notice.mangaDexActive,true);
});
test('metadata-only selection and local imports have accurate separate explanations',()=>{
 const notice=readingSourceNotice(fixture({anilist:{enabled:true},local:{enabled:true}}));assert.ok(notice.messages.some(value=>value.includes('AniList supplies catalogue information')));assert.ok(notice.messages.some(value=>value.includes('Device imports')));
});
test('unknown filter identities have a generic message and cannot grant a connection',()=>{
 const notice=readingSourceNotice(fixture({mangadex:{enabled:true}}),'<img src=x onerror=alert(1)>');assert.equal(notice.messages[0],'This source has no usable KURO connection.');
});
test('a failed individual request does not permanently remove a configured connection',()=>{
 const state=providerState({...reading,health:{status:'unavailable',operation:'pages',error:'Chapter offline'}},{enabled:true},true);assert.equal(state.canEnable,true);assert.equal(state.active,true);
});
