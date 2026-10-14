import { validNewIdentity } from './catalogue-model.mjs';
const wrapped=new WeakSet();
function checkedManifest(manifest,id,origin){
 if(!manifest?.verified||manifest.validation!=='complete-chapter'||manifest.validatedPages!==manifest.pages?.length||manifest.pageCount!==manifest.pages?.length||manifest.chapterId!==id||!Array.isArray(manifest.pages)||!manifest.pages.length||manifest.pages.some(page=>{
  try{const url=new URL(page.url);return url.origin!==origin||url.pathname!=='/api/catalogue/page'||!url.searchParams.get('ticket');}catch{return true;}
 }))throw new Error('Chapter did not return a server verified page manifest. Retry later.');return manifest;
}
export function installAdapters(manager,registry,{request,origin}){
 const registered=[];
 for(const p of registry.providers.filter(p=>p.adapter&&p.adapter!=='legacy')){
  if(manager.get(p.id))continue;
  const call=(action,params={})=>request(p.id,action,params);
  manager.register({id:p.id,name:p.name+(p.readable?'':' · Catalogue'),version:'1.0.0',color:'#E7B978',
   capabilities:{search:true,readable:p.readable,popular:['madara','themesia','keyoapp','flame','asura','iken','mangabox'].includes(p.adapter),latest:p.readable,trending:false,genres:false,requiresReferer:false,
    languages:[p.language||'en'],originFilter:false},getBaseUrl:()=>p.website,getSortOptions:()=>['RELEVANCE','LATEST','POPULAR'],
   search:async(q,page,filters)=>(await call('search',{q,page,filters})).items,
   searchPage:(q,page,filters)=>call('search',{q,page,filters}),getPopular:async page=>(await call('popular',{page})).items,
   getLatestUpdates:async page=>(await call('latest',{page})).items,getTrending:async()=>[],getMangaDetails:id=>call('details',{id}),
   getChapterList:id=>p.readable?call('chapters',{id}):Promise.resolve([]),
   getChapterPages:async id=>checkedManifest(await call('pages',{id}),id,origin),
  });registered.push(p.id);
 }
 for(const adapter of manager.all()){
  if(wrapped.has(adapter)||adapter.capabilities.readable===false)continue;
  // The new backend adapters already return a verified manifest. Legacy adapters
  // still parse their original public chapter page, then submit its bounded URLs.
  if(registry.providers.some(p=>p.id===adapter.id&&p.adapter&&p.adapter!=='legacy')){wrapped.add(adapter);continue;}
  adapter.getChapterPages=async id=>checkedManifest(await request(adapter.id,'pages',{id}),id,origin);wrapped.add(adapter);
 }
 return registered;
}
export function installIdentity(runtime,registered){const module=runtime(1706),original=module.validIdentity;module.validIdentity=(id,provider)=>original(id,provider)||validNewIdentity(id,provider,registered);}
export const isPublicQuery=key=>Array.isArray(key)&&['home-ranked-v1','discovery-v2','manga','chapters','feed','search'].includes(key[0]);
export function createRefreshController({onRefresh,isVisible,clock=Date.now,intervalMs=300000,minMs=60000}){
 let last=-Infinity,running=false;
 return {async run(force=false){const now=clock();if(running||!isVisible()||now-last<(force?minMs:intervalMs))return false;last=now;running=true;
  try{await onRefresh();return true;}finally{running=false;}
 }};
}
