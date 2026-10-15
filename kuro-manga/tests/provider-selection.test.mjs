import test,{beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCatalogueCore} from '../client/catalogue-core.mjs';
import {metroProviders} from './helpers/metro-provider-harness.mjs';

const providers=JSON.parse(readFileSync(new URL('../dist/provider-registry.json',import.meta.url))).providers;
const originalLocation=globalThis.location;
beforeEach(()=>{globalThis.location={origin:'http://localhost'};});
afterEach(()=>{if(originalLocation===undefined)delete globalThis.location;else globalThis.location=originalLocation;});
function setup(preferences={}){
 const runtime=metroProviders(),manager=runtime(789).sourceManager;
 for(const p of providers.filter(p=>p.adapter==='legacy'))manager.register({id:p.id,name:p.name,capabilities:{readable:p.readable,languages:['en']}});
 const core=createCatalogueCore(providers);core.initialize(789,{sourceManager:manager},runtime);
 let state={sourcePreferences:preferences},listeners=new Set();
 const store={getState:()=>state,setState:update=>{state={...state,...typeof update==='function'?update(state):update};for(const listener of listeners)listener(state);},subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener);}};
 state={...state,setSourceEnabled:(id,enabled)=>store.setState({sourcePreferences:{...state.sourcePreferences,[id]:{...state.sourcePreferences[id],enabled}}}),setAllSourcesEnabled:enabled=>store.setState({sourcePreferences:Object.fromEntries(Object.entries(state.sourcePreferences).map(([id,p])=>[id,{...p,enabled}]))}),resetToDefaults:()=>store.setState({sourcePreferences:{}})};
 const originalApi={useSettingsStore:store,selectEnabledSourceIds:s=>Object.keys(s.sourcePreferences).filter(id=>s.sourcePreferences[id].enabled)};
 const api=core.initialize(784,originalApi,runtime)||originalApi;
 return {core,manager,store,api};
}
test('fresh provider preferences enable only verified supported sources by default',()=>{
 const {store}=setup();const prefs=store.getState().sourcePreferences;
 assert.equal(Object.keys(prefs).length,1236);
 assert.deepEqual(Object.keys(prefs).filter(id=>prefs[id].enabled).sort(),['anilist','mangadex']);
});
test('a connector without supported ratings stays Off across directory refresh',()=>{
 const {store,core,manager}=setup();store.getState().setSourceEnabled('guya',true);core.preferences({providers});
 assert.equal(store.getState().sourcePreferences.guya.enabled,false);
 assert.equal(manager.enabled(['guya']).length,0);
 assert.equal(core.safety.current('guya','guya-unrated'),undefined);
});
test('external and unresolved sources cannot be switched On as KURO connections',()=>{
 const {store,manager}=setup();const entries=[providers.find(p=>!p.adapter&&p.mode==='external'),providers.find(p=>p.mode==='unresolved')];
 for(const p of entries){store.getState().setSourceEnabled(p.id,true);assert.equal(store.getState().sourcePreferences[p.id].enabled,false);assert.equal(manager.get(p.id),undefined);}
});
test('runtime enabled IDs exclude selected entries without an eligible connector',()=>{
 const {store,api}=setup();store.getState().setAllSourcesEnabled(true);
 assert.deepEqual(api.selectEnabledSourceIds(store.getState()).sort(),['anilist','mangadex']);
 assert.equal(Object.values(store.getState().sourcePreferences).filter(p=>p.enabled).length,2);
});
test('reset restores only usable verified defaults',()=>{
 const {store,core}=setup();store.getState().setSourceEnabled('guya',true);core.preferences({providers});assert.equal(store.getState().sourcePreferences.guya.enabled,false);
 store.getState().resetToDefaults();assert.equal(store.getState().sourcePreferences.guya.enabled,false);assert.equal(store.getState().sourcePreferences.mangadex.enabled,true);assert.equal(store.getState().sourcePreferences.anilist.enabled,true);
});
test('unknown preference keys cannot be enabled through the provider setter',()=>{
 const {store}=setup();store.getState().setSourceEnabled('not-in-kuro',true);assert.equal(store.getState().sourcePreferences['not-in-kuro'],undefined);
});
test('selecting a source without rating support leaves unrelated verified cards cached',()=>{
 const {store,core}=setup(),now=Date.now(),mid='11111111-1111-4111-8111-111111111111',id='mangadex-'+mid;
 const mapper={mapManga:()=>({id,sourceId:'mangadex',title:'Mountain Friends'})};core.initialize(875,mapper,()=>{});
 mapper.mapManga({id:mid,type:'manga',attributes:{title:{en:'Mountain Friends'},contentRating:'safe',tags:[]},kuroContentApproval:{version:'strict-1',checkedAt:now},kuroReadabilityAsOf:now,kuroReadabilityRevision:1,kuroReadability:{ready:true,mangaId:id,chapterId:'mangadex:22222222-2222-4222-8222-222222222222',version:'complete-chapter-1',policyVersion:'strict-1',validation:'complete-chapter',validatedPages:3,pageCount:3,checkedAt:now,expiresAt:now+3600000}});
 assert.equal(core.cached(id)?.ready,true);store.getState().setSourceEnabled('guya',true);assert.equal(core.cached(id)?.ready,true);
});
test('upgrading preserves an explicit Off choice for a verified provider',()=>{
 const {store}=setup({mangadex:{enabled:false},anilist:{enabled:false}});assert.equal(store.getState().sourcePreferences.mangadex.enabled,false);assert.equal(store.getState().sourcePreferences.anilist.enabled,false);
});
test('a selected provider with unavailable deployment configuration is excluded from runtime IDs',()=>{
 const {store,core,api,manager}=setup();core.preferences({providers:providers.map(p=>p.id==='mangadex'?{...p,available:false}:p)});assert.equal(api.selectEnabledSourceIds(store.getState()).includes('mangadex'),false);assert.equal(manager.enabled(['mangadex']).length,0);assert.equal(store.getState().sourcePreferences.mangadex.enabled,false);
});

test('upgrading preserves an explicit Off choice for device imports',()=>{
 const {store,core,manager}=setup({local:{enabled:false,language:'en'}});manager.register({id:'local',name:'On this device',capabilities:{readable:true,languages:['en']}});core.preferences({providers});assert.equal(store.getState().sourcePreferences.local.enabled,false);
});

test('a legacy Comix-only selection is turned Off with a retained explanation',()=>{
 const {store,api,core}=setup({comix:{enabled:true,selectionVersion:1},mangadex:{enabled:false,selectionVersion:1},anilist:{enabled:false,selectionVersion:1}});const prefs=store.getState().sourcePreferences;
 assert.equal(prefs.comix.enabled,false);assert.equal(prefs.comix.unavailableSelection,true);assert.deepEqual(api.selectEnabledSourceIds(store.getState()),[]);core.preferences({providers});assert.equal(store.getState().sourcePreferences.comix.unavailableSelection,true);
});

test('every sole-source choice follows the same usable-connection rule',()=>{
 const {store,api,core}=setup();assert.equal(typeof core.sourceState,'function');store.getState().setAllSourcesEnabled(false);
 for(const p of providers){store.getState().setSourceEnabled(p.id,true);const state=core.sourceState(p.id);assert.equal(store.getState().sourcePreferences[p.id].enabled,state.canEnable,p.id);assert.equal(api.selectEnabledSourceIds(store.getState()).includes(p.id),state.canEnable,p.id);store.getState().setSourceEnabled(p.id,false);}
});

test('direct settings writes cannot restore an unusable On flag',()=>{
 const {store}=setup();store.setState({sourcePreferences:{...store.getState().sourcePreferences,comix:{enabled:true,selectionVersion:2}}});assert.equal(store.getState().sourcePreferences.comix.enabled,false);
});

test('an unavailable source stays Off when configuration becomes available again',()=>{
 const {store,core}=setup();core.preferences({providers:providers.map(p=>p.id==='mangadex'?{...p,available:false}:p)});core.preferences({providers});assert.equal(store.getState().sourcePreferences.mangadex.enabled,false);
});

test('a usable source can be switched On again and keeps its language settings',()=>{
 const {store}=setup({mangadex:{enabled:false,selectionVersion:1,language:'ja',readingMode:'RTL'}});store.getState().setSourceEnabled('mangadex',true);assert.equal(store.getState().sourcePreferences.mangadex.enabled,true);assert.equal(store.getState().sourcePreferences.mangadex.language,'ja');assert.equal(store.getState().sourcePreferences.mangadex.readingMode,'RTL');
});

test('a missing adapter cannot stay active through the runtime source manager',()=>{
 const {store,core,manager,api}=setup();core.preferences({providers:providers.map(p=>p.id==='mangadex'?{...p,adapter:null}:p)});assert.equal(store.getState().sourcePreferences.mangadex.enabled,false);assert.equal(manager.enabled(['mangadex']).length,0);assert.equal(api.selectEnabledSourceIds(store.getState()).includes('mangadex'),false);
});
