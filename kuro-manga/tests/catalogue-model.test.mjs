import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { groupSeries, uniqueChapters, canonicalProvider, validNewIdentity } from '../dist/catalogue-model.mjs';

const manga = (sourceId,id,title,extra={}) => ({id,sourceId,title,description:'',coverUrl:'',status:'UNKNOWN',genres:[],...extra});

test('registry covers every requested name and collapses only documented provider aliases', async () => {
  const registry=JSON.parse(await readFile(new URL('../dist/provider-registry.json',import.meta.url)));
  const names=registry.providers.flatMap(x=>[x.name,...x.aliases]);
  const requested=JSON.parse(await readFile(new URL('../dist/provider-requested.json',import.meta.url)));
  assert.equal(requested.length,1254);assert.equal(registry.requestedNames,1254);
  assert.equal(new Set(registry.providers.map(p=>p.id)).size,registry.providers.length);
  for(const row of requested)assert.equal(canonicalProvider(row.name,registry)?.id,row.id,row.name);
  for (const name of ['MANGA Plus','Shonen Jump+','MangaReader.in','MangaReader.site','Danke fürs Lesen','Tortuga Çeviri',"Writers' Scans",'UzayManga']) assert.ok(canonicalProvider(name,registry),name);
  assert.equal(canonicalProvider('Manga Baka',registry).id,'mangabaka');
  assert.equal(canonicalProvider('MangaGeko',registry).id,'mgeko');
  assert.equal(canonicalProvider('BlueSolo',registry).id,'bluesolo');
  assert.notEqual(canonicalProvider('Shonen Jump',registry).id,canonicalProvider('Shonen Jump+',registry).id);
});
test('shared verified IDs group editions and retain independent source identities', () => {
  const rows=[manga('a','a-1','Different title',{identityKeys:['mal:42']}),manga('b','b-2','別の名前',{identityKeys:['mal:42']})];
  const grouped=groupSeries(rows); assert.equal(grouped.length,1); assert.deepEqual(grouped[0].editions.map(x=>x.id),['a-1','b-2']);
});
test('same titles with different verified IDs, authors or parts remain separate', () => {
  const cases=[
    [manga('a','a-1','Hero',{identityKeys:['mal:1']}),manga('b','b-2','Hero',{identityKeys:['mal:2']})],
    [manga('a','a-1','Hero',{author:'A'}),manga('b','b-2','Hero',{author:'B'})],
    [manga('a','a-1','Hero Part 1',{author:'A'}),manga('b','b-2','Hero Part 2',{author:'A'})],
    [manga('a','a-1','Hero',{author:'A'}),manga('a','a-2','Hero',{author:'A'})],
    [manga('a','a-1','Hero'),manga('b','b-2','Hero')]
  ]; for (const rows of cases) assert.equal(groupSeries(rows).length,2);
});
test('Unicode matching with the same author can group genuinely matching editions', () => {
  const grouped=groupSeries([manga('a','a-1','進撃の巨人',{author:'諫山創'}),manga('b','b-2','進撃の巨人',{author:'諫山創',catalogueOnly:true})]);
  assert.equal(grouped.length,1); assert.equal(grouped[0].primary.id,'a-1');
});
test('a bridge record does not transitively merge contradictory identities', () => {
  const rows=[manga('a','a-1','Hero',{identityKeys:['mal:1','anilist:4']}),manga('b','b-2','Hero',{identityKeys:['anilist:4','mal:2']}),manga('c','c-3','Hero',{identityKeys:['mal:2']})];
  assert.equal(groupSeries(rows).length,2);
});
test('different MangaDex edition IDs with the same work ID form one title',()=>{
 const rows=[manga('mangadex','mangadex-a','Hero',{identityKeys:['mdx:a','mal:1']}),manga('mangadex','mangadex-b','Hero in colour',{identityKeys:['mdx:b','mal:1']})];
 assert.equal(groupSeries(rows).length,1);
 assert.equal(groupSeries([rows[0],{...rows[1],identityKeys:['mdx:b','mal:2']}]).length,2);
 assert.equal(groupSeries([rows[0],{...rows[1],title:'Hero Part 2'},{...rows[0],id:'part1',title:'Hero Part 1'}]).length,2);
});
test('a later confirmed edition bridge merges both prior compatible groups in any order',()=>{
 const a=manga('mangadex','a','Hero',{identityKeys:['mdx:a']}),b=manga('mangadex','b','Hero in colour',{identityKeys:['mdx:b']}),bridge=manga('mangadex','c','Hero edition',{identityKeys:['mdx:a','mdx:b']});
 for(const rows of [[a,b,bridge],[bridge,a,b],[b,bridge,a]])assert.equal(groupSeries(rows).length,1);
 assert.equal(groupSeries([{...a,identityKeys:['mdx:a','mal:1']},{...b,identityKeys:['mdx:b','mal:2']},bridge]).length,2);
});
test('duplicate chapters retain separate translations and scanlation groups', () => {
  const chapters=[{id:'a:1',chapterNumber:1,language:'en',group:'A'},{id:'a:1',chapterNumber:1,language:'en',group:'A'},
    {id:'a:2',chapterNumber:1,language:'en',group:'B'},{id:'a:3',chapterNumber:1,language:'ar',group:'A'},
    {id:'a:4',chapterNumber:1.5,language:'en',group:'A'}];
  assert.deepEqual(uniqueChapters(chapters).map(x=>x.id),['a:1','a:2','a:3','a:4']);
});
test('new series identity requires a registered provider and canonical opaque path', () => {
  assert.equal(validNewIdentity('guya-Kaguya-Wants-To-Be-Confessed-To','guya',['guya']),true);
  assert.equal(validNewIdentity('guya-../../admin','guya',['guya']),false);
  assert.equal(validNewIdentity('evil-1','evil',['guya']),false);
  assert.equal(validNewIdentity('jikan-12','jikan',['jikan']),true);
});
