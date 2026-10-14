export function mobileCoverCandidates(value){
 try{
  const original=new URL(value);if(!['https:','http:','blob:'].includes(original.protocol)||original.username||original.password)return [];
  const full=new URL(original.href);
  if(full.hostname==='uploads.mangadex.org')full.pathname=full.pathname.replace(/\.(256|512)\.jpg$/,'');
  else if(full.pathname.startsWith('/wp-content/uploads/')&&!full.search)full.pathname=full.pathname.replace(/-\d{2,4}x\d{2,4}(?=\.(jpe?g|png|webp)$)/i,'');
  else if(full.hostname.endsWith('.compsci88.com')||full.hostname.endsWith('.planeptune.us'))full.pathname=full.pathname.replace('/cover/small/','/cover/normal/');
  return [...new Set([full.href,original.href])];
 }catch{return [];}
}
export function artworkExtension(React,Original,dimensions,resolveSource){
 const h=React.createElement;
 function MobileArtwork({uri,title}){
  const candidates=React.useMemo(()=>mobileCoverCandidates(uri),[uri]);const [index,setIndex]=React.useState(0),[failed,setFailed]=React.useState(false);
  React.useEffect(()=>{setIndex(0);setFailed(false);},[uri]);
  const value=candidates[Math.min(index,candidates.length-1)],source=value?resolveSource(value):undefined;
  return h('div',{'data-testid':'quality-artwork',className:'kuro-mobile-artwork'},
   h('div',{'data-testid':'premium-hero-art',className:'kuro-mobile-artwork-image'},source&&!failed?h('img',{key:value,src:source.uri,alt:title+' cinematic artwork',loading:'eager',decoding:'async',fetchPriority:'high',referrerPolicy:'no-referrer',
    onError:()=>{if(index<candidates.length-1)setIndex(index+1);else setFailed(true);}}):h('span',{className:'kuro-mobile-artwork-fallback','aria-label':'Artwork unavailable'},'KURO /')));
 }
 return function ResponsiveArtwork(props){const {width}=dimensions();return width<700&&!props.detail?h(MobileArtwork,props):h(Original,props);};
}
