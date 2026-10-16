import { createRefreshController, isPublicQuery } from './catalogue-runtime.mjs';
import { mountProviderDirectory } from './provider-directory.js';
async function jsonFetch(path){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const response=await fetch(path,{credentials:'same-origin',signal:controller.signal,cache:'no-cache'});const data=await response.json();if(!response.ok)throw new Error('Provider service unavailable');return data;}finally{clearTimeout(timer);}}
async function boot(){
 if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
 const startupDeadline=Date.now()+15000;
 while((!window.KuroCatalogueCore?.manager||!window.KuroCatalogueCore?.store)&&Date.now()<startupDeadline)await new Promise(resolve=>setTimeout(resolve,50));
 const core=window.KuroCatalogueCore;if(!core?.manager||!core.store)throw new Error('Source bootstrap unavailable');
 let registry;try{registry=await jsonFetch('/api/catalogue/providers');}catch{registry=await(await fetch('/provider-registry.json',{cache:'no-cache'})).json();registry.offline=true;}
 // Bootstrap policy remains authoritative when a stale/offline directory is read.
 registry.providers=registry.providers.map(p=>{const policy=core.registry.providers.find(x=>x.id===p.id)?.contentPolicy||{state:'restricted',reason:'no-supported-positive-rating',version:'strict-1'};return {...p,contentPolicy:policy,available:policy.state==='eligible'&&p.available!==false};});
 core.preferences(registry);registry=core.registry;const queryClient=window.__r(1596).queryClient;
 let bridge;const refresh=createRefreshController({isVisible:()=>!document.hidden,onRefresh:async()=>{
  window.__r(861).clearHttpCache();core.notify();
  await queryClient.invalidateQueries({predicate:query=>isPublicQuery(query.queryKey),refetchType:'active'});bridge.lastRefreshAt=Date.now();window.dispatchEvent(new Event('kuro:catalogue-refreshed'));
 }});
 bridge=window.KuroCatalogue={ready:true,registry,manager:core.manager,store:core.store,core,refresh:()=>refresh.run(true),lastRefreshAt:0,get lastCheck(){return core.lastCheck;}};
 mountProviderDirectory(bridge);core.replayCredits();
 window.addEventListener('online',()=>refresh.run(true).catch(()=>{}));document.addEventListener('visibilitychange',()=>{if(!document.hidden){core.resume();refresh.run(true).catch(()=>{});}});
 setInterval(()=>refresh.run().catch(()=>{}),60000);window.dispatchEvent(new Event('kuro:catalogue-ready'));
}
boot().catch(()=>{window.KuroCatalogue={ready:false,error:'Provider controls could not load. Reload KURO.'};});
