export function readingSourceNotice(core,sourceId=''){
 const all=core.registry.providers,providers=sourceId?all.filter(p=>p.id===sourceId):all,states=providers.map(p=>core.sourceState(p.id));
 if(states.some(state=>state.active&&state.reading))return null;
 const preferences=core.store.getState().sourcePreferences;
 const previous=providers.filter(p=>preferences[p.id]?.unavailableSelection),metadata=states.filter(state=>state.active&&!state.reading);
 const messages=[];
 if(sourceId){const state=states[0];if(!state)messages.push('This source has no usable KURO connection.');else if(!state.canEnable)messages.push(state.name+': '+state.description);else if(!state.reading)messages.push(state.name+' supplies catalogue information, not reading pages.');else messages.push(state.name+' is Off.');}
 else {for(const provider of previous.slice(0,3)){const state=core.sourceState(provider.id);messages.push(state.name+': '+state.description);}if(previous.length>3)messages.push((previous.length-3)+' other unavailable selections were also switched Off.');for(const state of metadata)messages.push(state.name+' supplies catalogue information, not reading pages.');}
 if(!messages.length)messages.push('Choose a usable reading source to load manga and manhwa.');
 if(!sourceId&&preferences.local?.enabled)messages.push('Device imports remain available in your Library.');
 const mangaDex=core.sourceState('mangadex');
 return {title:sourceId?'No reader for this source':'No online reader is On',messages,canEnableMangaDex:mangaDex.canEnable,mangaDexActive:mangaDex.active};
}

// Reuse the exported app's existing empty-state component. A working reading
// selection renders the original Home/Search screen without a layout wrapper.
export function sourceScreen(React,Screen,core,require,search=false){
 const h=React.createElement,{EmptyState}=require(1396),router=require(11);
 const subscribe=listener=>core.store.subscribe(listener),snapshot=()=>core.store.getState().sourcePreferences;
 return function SourceAwareScreen(props){
  React.useSyncExternalStore(subscribe,snapshot,snapshot);
  const params=router.useLocalSearchParams(),sourceId=search&&typeof params.source==='string'?params.source:'';
  const notice=readingSourceNotice(core,sourceId);
  if(!notice)return h(Screen,props);
  const enable=()=>{core.store.getState().setSourceEnabled('mangadex',true);if(search)router.router.replace({pathname:'/search',params:{source:'mangadex',...typeof params.q==='string'?{q:params.q}:{}}});};
  return h('section',{className:'kuro-source-empty','aria-label':'Reading source status'},
   h('p',{className:'kuro-source-empty-brand'},'KURO / YOUR SOURCES'),
   h(EmptyState,{icon:'book-outline',title:notice.title,message:notice.messages.join('\n'),...notice.canEnableMangaDex?{actionLabel:notice.mangaDexActive?'Use MangaDex':'Turn on MangaDex',onAction:enable}:{}}),
   h('div',{className:'kuro-source-empty-actions'},h('button',{type:'button',onClick:()=>router.router.push('/providers')},'Manage providers')),
   h('p',{className:'kuro-source-empty-footnote'},'Unavailable entries stay Off. Adult, suggestive and unverified titles stay hidden.'));
 };
}

export function sourceSettingsCard(React,Card,core){
 const subscribe=listener=>core.store.subscribe(listener),snapshot=()=>core.store.getState().sourcePreferences;
 return function UsableSourceSettingsCard(props){
  React.useSyncExternalStore(subscribe,snapshot,snapshot);
  if(props.sourceId!=='local'&&!core.sourceState(props.sourceId).canEnable)return null;
  return React.createElement(Card,props);
 };
}
