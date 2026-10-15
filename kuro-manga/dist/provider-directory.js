import {providerState} from './provider-state.mjs';
const categories={official:'Official platforms',metadata:'Metadata providers',aggregator:'Manga aggregators',scanlation:'Scanlation & specialist',regional:'Regional sources'};
const languages={en:'English',ar:'Arabic',tr:'Turkish',id:'Indonesian'};
const element=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
function status(provider,state){
 if(!state.canEnable)return state.label;
 if(!provider.readable)return 'Metadata only';
 if(provider.health?.status==='unavailable')return 'Temporarily unavailable';
 if(provider.health?.completeChapterVerifiedAt)return 'Complete chapter checked';
 if(provider.verification?.serviceCheck?.status==='failed-current-check'&&!provider.health?.sampleVerifiedAt)return 'Retry needed';
 return 'Reader connection';
}
export function mountProviderDirectory(bridge){
 const sourceState=p=>providerState(p,bridge.store.getState().sourcePreferences[p.id],!!bridge.manager.get(p.id));
 const entry=element('a','All '+bridge.registry.providers.length.toLocaleString()+' providers','kuro-directory-entry');entry.id='kuro-provider-entry';entry.href='/providers';entry.hidden=true;document.body.append(entry);
 const view=element('main',undefined,'kuro-provider-directory');view.id='kuro-provider-directory';view.hidden=true;view.setAttribute('aria-label','KURO provider directory');
 view.innerHTML=`<div class="kuro-directory-shell"><header class="kuro-directory-header"><a href="/" class="kuro-directory-brand" aria-label="KURO home">KURO <span>/</span></a><a href="/settings" class="kuro-directory-back">Back to settings</a></header><div class="kuro-directory-heading"><div><p class="kuro-directory-eyebrow">YOUR STORY SOURCES</p><h1>One library. More worlds.</h1><p>Choose where KURO finds your next manga, manhwa or manhua.</p></div><button type="button" id="kuro-catalogue-refresh">Refresh sources <span aria-hidden="true">↻</span></button></div><div class="kuro-directory-stats" aria-label="Provider coverage"></div><section class="kuro-directory-controls" aria-label="Find providers"><label class="kuro-directory-search"><span class="kuro-directory-label">Find a provider</span><input id="kuro-provider-search" type="search" placeholder="Search by name, including aliases" autocomplete="off"></label><label><span class="kuro-directory-label">Provider category</span><select id="kuro-provider-category"><option value="all">All categories</option></select></label><label><span class="kuro-directory-label">Provider availability</span><select id="kuro-provider-availability"><option value="all">All providers</option><option value="reader">Reader adapters</option><option value="metadata">Metadata only</option><option value="external">Open on platform</option><option value="unresolved">Address needed</option><option value="enabled">Enabled in KURO</option></select></label></section><p id="kuro-directory-count" role="status" aria-live="polite"></p><div class="kuro-directory-list"></div><p class="kuro-directory-empty" hidden>No providers match. Try another name or category.</p><footer class="kuro-directory-footer"><p>Enabled sources refresh while KURO is open. Chapters and pages are checked when loaded; availability can change at the provider.</p><p>Metadata credits: <a href="https://anilist.co/" target="_blank" rel="noopener noreferrer">AniList</a> · <a href="https://kitsu.app/" target="_blank" rel="noopener noreferrer">Kitsu</a> · <a href="https://jikan.moe/" target="_blank" rel="noopener noreferrer">Jikan / MyAnimeList</a> · <a href="https://www.mangaupdates.com/" target="_blank" rel="noopener noreferrer">MangaUpdates</a> · <a href="https://shikimori.io/" target="_blank" rel="noopener noreferrer">Shikimori</a> · <a href="https://mangabaka.org/" target="_blank" rel="noopener noreferrer">MangaBaka + its upstream providers</a></p></footer></div>`;
 document.body.append(view);
 const search=view.querySelector('#kuro-provider-search'),category=view.querySelector('#kuro-provider-category'),availability=view.querySelector('#kuro-provider-availability'),list=view.querySelector('.kuro-directory-list'),count=view.querySelector('#kuro-directory-count');
 availability.querySelector('option[value="reader"]').textContent='Usable readers';
 availability.querySelector('option[value="enabled"]').textContent='On in KURO';
 const more=element('button','Show more sources','kuro-directory-more');more.type='button';list.after(more);let limit=80,selection='';
 for(const [value,label]of Object.entries(categories)){const option=element('option',label);option.value=value;category.append(option);}
 const rule=element('p','Only usable KURO connections can be switched On. Unavailable sources stay Off and show what is missing. Metadata sources supply information, not reading pages. Adult, suggestive and unrated titles remain hidden.','kuro-content-notice');view.querySelector('.kuro-directory-heading').after(rule);
 const defaults=element('button','Use verified defaults','kuro-directory-defaults');defaults.type='button';rule.after(defaults);
 defaults.addEventListener('click',()=>bridge.store.getState().resetSourceDefaults());
 const stats=view.querySelector('.kuro-directory-stats');
 const readable=element('section',undefined,'kuro-content-notice');readable.id='kuro-readable-count';readable.setAttribute('aria-label','Verified readable catalogue');
 const total=element('strong','Checking readable titles…'),detail=element('p','Only unique titles with one completely checked chapter qualify.');readable.append(total,detail);stats.after(readable);
 let countBusy=false,lastCount=0;
 async function updateReadable(force=false){if(countBusy||!force&&Date.now()-lastCount<30000)return;countBusy=true;lastCount=Date.now();try{const response=await fetch('/api/catalogue/readable/count',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error();const data=await response.json();if(!Number.isSafeInteger(data.uniqueCount)||data.uniqueCount<0)throw new Error();bridge.readableCount=data;total.textContent=data.uniqueCount.toLocaleString()+' unique verified readable titles';detail.textContent='One complete chapter checked for each title in the last '+Math.round(data.windowMs/3600000)+' hours. '+data.duplicatesGrouped+' duplicate editions grouped. This is the verified KURO inventory; other provider entries remain unverified. Device imports are counted on your device.';}catch{total.textContent='Readable count is temporarily unavailable';}finally{countBusy=false;}}
 window.addEventListener('kuro:readable-updated',()=>updateReadable());setInterval(()=>{if(!view.hidden&&!document.hidden)updateReadable();},30000);
 const formatTime=value=>value?new Date(value).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'Not checked in this session';
 function render(){
  const needle=search.value.normalize('NFKC').toLocaleLowerCase(),preferences=bridge.store.getState().sourcePreferences,focus=document.activeElement?.id;
  stats.replaceChildren();for(const [label,value]of [['Directory entries',bridge.registry.providers.length],['On in KURO',bridge.registry.providers.filter(p=>sourceState(p).active).length],['Usable connections',bridge.registry.providers.filter(p=>sourceState(p).canEnable).length],['Unavailable for KURO',bridge.registry.providers.filter(p=>!sourceState(p).canEnable).length]]){const item=element('div',undefined,'kuro-directory-stat');item.append(element('strong',value.toLocaleString()),element('span',label));stats.append(item);}
  const nextSelection=JSON.stringify([needle,category.value,availability.value]);if(nextSelection!==selection){limit=80;selection=nextSelection;}
  const providers=bridge.registry.providers.filter(p=>[p.name,...p.aliases].some(name=>name.normalize('NFKC').toLocaleLowerCase().includes(needle)))
   .filter(p=>category.value==='all'||p.category===category.value)
   .filter(p=>availability.value==='all'||availability.value==='reader'&&p.readable&&sourceState(p).canEnable||availability.value==='metadata'&&p.category==='metadata'&&sourceState(p).canEnable||availability.value==='external'&&!p.adapter&&p.mode==='external'||availability.value==='unresolved'&&p.mode==='unresolved'||availability.value==='enabled'&&sourceState(p).active);
  providers.sort((a,b)=>Number(!a.available)-Number(!b.available)||Number(!(a.adapter&&a.readable))-Number(!(b.adapter&&b.readable))||Number(!a.adapter)-Number(!b.adapter)||a.name.localeCompare(b.name));
  const fragment=document.createDocumentFragment(),visible=providers.slice(0,limit);
  for(const p of visible){
   const current=sourceState(p);
   const row=element('article',undefined,'kuro-provider-row');row.dataset.providerId=p.id;
   const badge=element('div',p.name.charAt(0).toUpperCase(),'kuro-provider-monogram');badge.setAttribute('aria-hidden','true');
   const body=element('div',undefined,'kuro-provider-body'),heading=element('div',undefined,'kuro-provider-title');const title=element('h2',p.name);title.dir='auto';heading.append(title);
   const state=element('span',status(p,current),'kuro-provider-status');state.dataset.state=p.health?.status||current.reason;heading.append(state);
   body.append(heading,element('p',categories[p.category]+(p.adapter?' · '+(languages[p.language]||p.language):''),'kuro-provider-category'),element('p',p.note,'kuro-provider-note'));
   if(p.aliases.length)body.append(element('p','Also listed as '+p.aliases.join(', '),'kuro-provider-aliases'));
   if(p.health?.error)body.append(element('p',p.health.error,'kuro-provider-error'));
   if(p.adapter)body.append(element('p','Last check: '+formatTime(p.health?.checkedAt||p.verification?.sampleVerifiedAt),'kuro-provider-time'));
   const explanation=element('p',current.description,'kuro-provider-category');explanation.id='kuro-source-reason-'+p.id;body.append(explanation);
   if(current.previousSelection)body.append(element('p','Your earlier selection was switched Off because this connection is unavailable.','kuro-provider-category'));
   const actions=element('div',undefined,'kuro-provider-actions');
   const label=element('label',undefined,'kuro-provider-switch');const input=element('input');input.type='checkbox';input.id='kuro-source-'+p.id;input.setAttribute('aria-label','Enable '+p.name);input.setAttribute('aria-describedby',explanation.id);input.checked=current.active;input.disabled=!current.canEnable;
   input.addEventListener('change',()=>bridge.store.getState().setSourceEnabled(p.id,input.checked));label.append(input,element('span',current.active?'On':current.canEnable?'Off':'Unavailable'));actions.append(label);
   if(current.active&&p.readable){const explore=element('a','Browse','kuro-provider-browse');explore.href='/search?source='+p.id;actions.append(explore);}
   if(p.website&&p.contentPolicy?.state!=='blocked'&&(current.canEnable||!p.adapter&&p.mode==='external')){try{const url=new URL(p.website);if(url.protocol==='https:'&&!url.username&&!url.password){const link=element('a','Visit platform ↗','kuro-provider-visit');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);}}catch{}}
   row.append(badge,body,actions);fragment.append(row);
  }
  list.replaceChildren(fragment);count.textContent=providers.length+' provider'+(providers.length===1?'':'s')+' found · '+visible.length+' shown';more.hidden=visible.length>=providers.length;view.querySelector('.kuro-directory-empty').hidden=providers.length>0;
  if(focus?.startsWith('kuro-source-')){const previous=document.getElementById(focus);(previous&&!previous.disabled?previous:search).focus({preventScroll:true});}
 }
 more.addEventListener('click',()=>{limit+=80;render();});
 for(const control of [search,category,availability])control.addEventListener(control===search?'input':'change',render);
 bridge.store.subscribe(()=>{if(!view.hidden)render();});
 const refresh=view.querySelector('#kuro-catalogue-refresh');refresh.addEventListener('click',async()=>{
  refresh.disabled=true;count.textContent='Refreshing enabled sources…';try{await bridge.refresh();const response=await fetch('/api/catalogue/providers',{cache:'no-cache'});if(response.ok){const data=await response.json();bridge.core.preferences(data);bridge.registry=bridge.core.registry;render();}count.textContent+=' · Refresh requested';}
  catch{count.textContent='Some sources could not refresh. Try again shortly.';}finally{refresh.disabled=false;}
 });
 const credits=element('aside',undefined,'kuro-source-credits');credits.id='kuro-source-credits';credits.setAttribute('aria-label','Source and scanlation credits');credits.hidden=true;document.body.append(credits);
 window.addEventListener('kuro:active-chapter-changed',()=>{credits.hidden=true;});
 window.addEventListener('kuro:active-chapter-manifest',event=>{
  const data=event.detail;if(!data||!location.pathname.startsWith('/reader/'))return;
  credits.replaceChildren();for(const credit of data.credits||[]){if(!credit?.url?.startsWith('https://'))continue;const link=element('a',credit.name);link.href=credit.url;link.target='_blank';link.rel='noopener noreferrer';credits.append(link);}credits.hidden=!credits.childElementCount;
 });
 let priorRootHidden=null,shown=false;function route(){
  const open=/^\/providers\/?$/.test(location.pathname);entry.hidden=!/^\/settings\/?$/.test(location.pathname);view.hidden=!open;
  const root=document.getElementById('root');if(root&&open&&!shown){priorRootHidden=root.getAttribute('aria-hidden');root.setAttribute('aria-hidden','true');root.inert=true;}
  if(root&&!open&&shown){if(priorRootHidden===null)root.removeAttribute('aria-hidden');else root.setAttribute('aria-hidden',priorRootHidden);root.inert=false;}
  if(open&&!shown){render();updateReadable(true);}shown=open;if(!location.pathname.startsWith('/reader/'))credits.hidden=true;
 }
 for(const name of ['pushState','replaceState']){const original=history[name];history[name]=function(...args){const result=original.apply(this,args);route();return result;};}
 window.addEventListener('popstate',route);window.addEventListener('kuro:catalogue-updated',()=>{if(!view.hidden)render();});route();
}
