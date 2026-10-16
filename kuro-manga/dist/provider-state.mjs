// Shared presentation/activation decision. Content and page authorization remain
// mandatory in the server; this helper cannot grant content approval.
export function providerState(provider,preference={},registered=false){
 const selected=preference?.enabled===true;
 let reason,label,description;
 if(provider?.contentPolicy?.state==='blocked'){
  reason='content-blocked';label='Blocked by content rules';description='This source cannot be enabled under your strict content rules.';
 }else if(!provider?.adapter){
  if(provider?.mode==='external'){reason='external-only';label='External platform';description='Read on the provider’s platform. This entry has no KURO reader connection.';}
  else {reason='missing-connection';label='Connection unavailable';description='This source needs a hosted KURO connector before it can supply manga.';}
 }else if(provider.contentPolicy?.state!=='eligible'){
  reason='rating-unsupported';label='Rating support needed';description='KURO cannot verify this source’s content ratings, so it stays Off under your strict rules.';
 }else if(!registered){
  reason='missing-connection';label='Connection unavailable';description='The KURO connection for this source is not installed.';
 }else if(provider.available!==true){
  reason='setup-required';label='Setup needed';description='This source needs deployment setup before it can be switched On.';
 }else{
  reason='usable';label=provider.readable===true?'Reader connection':'Metadata only';description=provider.readable===true?'Approved titles appear after a complete chapter has been checked.':'This source supplies catalogue information. It does not provide reading pages.';
 }
 const canEnable=reason==='usable';
 return {id:provider?.id,name:provider?.name||'Source',canEnable,active:canEnable&&selected,reading:canEnable&&provider.readable===true,reason,label,description,previousSelection:preference?.unavailableSelection===true};
}
