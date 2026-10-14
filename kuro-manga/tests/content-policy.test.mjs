import test from 'node:test';
import assert from 'node:assert/strict';
import {CONTENT_POLICY_VERSION, classifyMangaDex, classifyAniList, providerContentPolicy, forbiddenLabel} from '../client/content-policy.mjs';

function md(rating,names=[]){return {id:'11111111-1111-4111-8111-111111111111',type:'manga',attributes:{contentRating:arguments.length?rating:'safe',title:{en:'A journey'},description:{en:'Friends explore the mountains.'},tags:names.map(name=>({attributes:{name:{en:name},group:'content'}}))},relationships:[]};}
function ani(flag,tags=[]){return {id:1,type:'MANGA',isAdult:arguments.length?flag:false,title:{english:'A journey'},genres:['Adventure'],tags,description:'Friends explore the mountains.'};}
test('only explicit safe MangaDex ratings pass; missing and type-confused evidence fails closed',()=>{
 assert.equal(classifyMangaDex(md()).allowed,true);
 for(const rating of [undefined,null,false,'','SAFE','suggestive','erotica','pornographic','adult','18+'])assert.equal(classifyMangaDex(md(rating)).allowed,false,String(rating));
 for(const raw of [null,{}, {...md(),attributes:{contentRating:'safe'}}, {...md(),type:'chapter'}])assert.equal(classifyMangaDex(raw).allowed,false);
});
test('full content tags are checked in addition to the provider rating',()=>{
 for(const name of ['Ecchi','Hentai','Sexual Violence','Erotica','Adult','18+','Nudity','R-18','成人向け','성인','色情'])assert.equal(classifyMangaDex(md('safe',[name])).allowed,false,name);
 assert.equal(classifyMangaDex(md('safe',['Boys Love','Girls Love','Adult Cast','Romance'])).allowed,true);
 for(const label of ['',' ','\n','\u200b','\u2066'])assert.equal(classifyMangaDex(md('safe',[label])).allowed,false);
});
test('AniList must explicitly return non-adult evidence and complete tag/genre arrays',()=>{
 assert.equal(classifyAniList(ani()).allowed,true);
 for(const flag of [undefined,null,'false',0,true])assert.equal(classifyAniList(ani(flag)).allowed,false);
 for(const row of [{...ani(),tags:undefined},{...ani(),genres:undefined},ani(false,[{name:'Romance',isAdult:true}]),ani(false,[{name:'Ecchi',isAdult:false}]),ani(false,[{name:'Missing flag'}])])assert.equal(classifyAniList(row).allowed,false);
 assert.equal(classifyAniList(ani(false,[{name:'Boys Love',isAdult:false}])).allowed,true);
 for(const label of ['',' ','\n','\u200b','\u2066']){assert.equal(classifyAniList(ani(false,[{name:label,isAdult:false}])).allowed,false);assert.equal(classifyAniList({...ani(),genres:[label]}).allowed,false);}
});
test('unknown and adult providers cannot be enabled by their registry flags',()=>{
 for(const p of [{id:'guya',readable:true,available:true},{id:'asurascans'},{id:'fake',contentWarning:'NSFW'}])assert.notEqual(providerContentPolicy(p).state,'eligible');
 assert.equal(providerContentPolicy({id:'mangadex'}).state,'eligible');assert.equal(providerContentPolicy({id:'anilist'}).state,'eligible');
 assert.equal(typeof CONTENT_POLICY_VERSION,'string');
});
test('labels normalize unicode and invisible separators without treating ordinary adult characters as explicit',()=>{
 for(const label of ['Ｈｅｎｔａｉ','hen\u200btai','R１８','18 ＋','Ecchi'])assert.equal(forbiddenLabel(label),true,label);
 for(const label of ['Adult Cast','Young Adult Fiction','Romance','Boys Love','Girls Love','Mature protagonist'])assert.equal(forbiddenLabel(label),false,label);
});
