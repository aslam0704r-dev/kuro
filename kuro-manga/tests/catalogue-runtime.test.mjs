import test from 'node:test';
import assert from 'node:assert/strict';
import { installAdapters, createRefreshController, isPublicQuery } from '../dist/catalogue-runtime.mjs';
import { metroProviders } from './helpers/metro-provider-harness.mjs';

const registry={providers:[{id:'guya',name:'Guya.moe',adapter:'guya',mode:'reader',website:'https://guya.moe/',language:'en',readable:true},
 {id:'jikan',name:'Jikan',adapter:'metadata',mode:'metadata',website:'https://jikan.moe/',language:'en',readable:false},
 {id:'vizmanga',name:'VIZ Manga',adapter:null,mode:'external',website:'https://viz.com/',readable:false}]};
test('real compiled manager can register new adapters and navigate only valid new identities',async()=>{
 const runtime=metroProviders(),manager=runtime(789).sourceManager;const calls=[];
 const request=async(id,action,params)=>{calls.push([id,action,params]);return action==='search'?{items:[{id:'guya-Hero',sourceId:'guya',title:'Hero',genres:[]}]}:{chapterId:'guya:Hero~1~7',validation:'complete-chapter',validatedPages:1,pageCount:1,pages:[{index:0,url:'http://127.0.0.1:4184/api/catalogue/page?ticket=ok'}],verified:true};};
 const registered=installAdapters(manager,registry,{request,origin:'http://127.0.0.1:4184'});assert.deepEqual(registered,['guya','jikan']);
 assert.equal(manager.all().length,2);assert.equal(manager.get('jikan').capabilities.readable,false);assert.equal(manager.get('vizmanga'),undefined);
 assert.equal((await manager.require('guya').search('Hero',1)).length,1);assert.equal(calls[0][1],'search');
 const pages=await manager.getChapterPages({id:'guya:Hero~1~7',sourceId:'guya'});assert.equal(pages.verified,true);assert.ok(pages.pages[0].url.includes('/api/catalogue/page'));
});
test('existing adapter pages are checked once and reject manifests that are not server verified',async()=>{
 const runtime=metroProviders(),manager=runtime(789).sourceManager;let raw=0,checked=0;
 manager.register({id:'mgeko',name:'Mgeko',capabilities:{readable:true},getChapterPages:async id=>{raw++;return {chapterId:id,pages:[{index:0,url:'https://imgsrv5.com/a.jpg'}]};}});
 const request=async(_id,action,params)=>{assert.equal(action,'pages');checked++;return {chapterId:params.id,verified:true,validation:'complete-chapter',validatedPages:1,pageCount:1,pages:[{index:0,url:'http://127.0.0.1:4184/api/catalogue/page?ticket=ok'}]};};
 installAdapters(manager,{providers:[]},{request,origin:'http://127.0.0.1:4184'});installAdapters(manager,{providers:[]},{request,origin:'http://127.0.0.1:4184'});
 await manager.getChapterPages({id:'mgeko:a',sourceId:'mgeko'});assert.equal(raw,0);assert.equal(checked,1);
 const other=metroProviders()(789).sourceManager;installAdapters(other,registry,{request:async()=>({chapterId:'guya:a',pages:[{url:'https://evil.test/a'}]}),origin:'http://127.0.0.1:4184'});
 await assert.rejects(other.require('guya').getChapterPages('guya:a'),/verified/i);
});
test('auto refresh runs while visible and does not create an interval storm',async()=>{
 let now=0,visible=true,count=0;const refresh=createRefreshController({clock:()=>now,isVisible:()=>visible,onRefresh:async()=>{count++;},intervalMs:300000,minMs:60000});
 assert.equal(await refresh.run(),true);assert.equal(await refresh.run(),false);now=300001;visible=false;assert.equal(await refresh.run(),false);visible=true;assert.equal(await refresh.run(),true);
 now=300002;assert.equal(await refresh.run(true),false);now=360002;assert.equal(await refresh.run(true),true);assert.equal(count,3);
});
test('public refresh reaches actual Home/search/chapter keys and excludes account queries',()=>{
 for(const key of [['home-ranked-v1','guya','latest'],['discovery-v2','hero'],['chapters','guya-Hero'],['manga','guya-Hero']])assert.equal(isPublicQuery(key),true);
 for(const key of [['auth'],['profile'],['session'],['pages','guya:1'],['private-avatar']])assert.equal(isPublicQuery(key),false);
});
