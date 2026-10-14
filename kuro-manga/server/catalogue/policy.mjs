import { readFileSync } from 'node:fs';
import connections from './connections.mjs';
export const registry=JSON.parse(readFileSync(new URL('../../dist/provider-registry.json',import.meta.url),'utf8'));
const extraImages={
 guya:['guya.cubari.moe'],dynasty:['dynasty-scans.com'],manhuaplus:['cdn.manhuaplus.com'],galaxydegenscans:['gdscans.com'],
 lhtranslation:['lhtranslation.net'],madarascans:['madarascans.net'],tritiniascans:['tritinia.org','files.catbox.moe'],ksgroup:['ksgroupscans.com'],
 '3asq':['3asq.online'],tortuga:['c.mng1.lol','tortugaceviri.com'],toonily:['toonily.com'],
 mangaread:['www.mangaread.org','mangaread.org'],mgeko:['imgsrv5.com'],mangapill:['cdn.readdetectiveconan.com'],
 mangakatana:Array.from({length:99},(_,i)=>'i'+(i+1)+'.mangakatana.com'),
 weebcentral:['scans.lastation.us','temp.compsci88.com','hot.planeptune.us','compsci88.com','planeptune.us'],
 mangadex:['uploads.mangadex.org']
};
const apis={guya:['guya.cubari.moe'],anilist:['graphql.anilist.co'],jikan:['api.jikan.moe'],shikimori:['shikimori.io'],mangabaka:['api.mangabaka.org'],mangadex:['api.mangadex.org'],mangaread:['www.mangaread.org','mangaread.org'],mgeko:['www.mgeko.cc','mgeko.cc']};
export const installedProviders=registry.providers.filter(x=>x.adapter);
export function providerFor(id){const found=registry.providers.find(x=>x.id===id);if(!found)throw Object.assign(new Error('Unknown provider'),{status:404});return {...found,seriesPath:id==='madarascans'?'/series/':'/manga/',chapterPattern:id==='madarascans'?'^/[a-z0-9-]+-chapter-[0-9.-]+/$':undefined,...connections[id]};}
export function textPolicy(id){const p=providerFor(id);const hosts=[...new Set([...(apis[id]||[]),...(p.textHosts||[]),...p.website?[new URL(p.website).hostname]:[]])];return {hosts,referer:p.adapter==='metadata'?undefined:new URL(p.website).origin+'/',hxRequest:id==='weebcentral'};}
export function imagePolicy(id){const p=providerFor(id);return {hosts:[...new Set([...(extraImages[id]||[]),...(p.imageHosts||[])])],referer:p.website?new URL(p.website).href:undefined,inferMime:['weebcentral','mangakatana'].includes(id)||p.inferMime===true};}
export function licensingAllowed(id,usage=process.env.CATALOG_USAGE||''){
 return id==='mangabaka'?['noncommercial','licensed'].includes(usage):id==='mangadex'?!['commercial','licensed'].includes(usage):true;
}
