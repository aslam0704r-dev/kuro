// Replace only the legacy MangaDex metadata transport. Other app/account
// request helpers retain their original behavior. A source cooldown is shared
// across metadata URLs and the listing page validator.
export function retryDate(value,clock=Date.now){const now=clock(),seconds=Number(value),date=Number.isFinite(seconds)&&seconds>0?now+seconds*1000:Date.parse(value);return Math.max(now+1000,Math.min(now+3600000,Number.isFinite(date)?date:now+60000));}
export function createCatalogueHttp(original,resolveUrl,{clock=Date.now,getRetryAt=()=>0,onBackoff=()=>{}}={}){
 const cache=new Map(),inflight=new Map();let failure;
 const applies=value=>{try{const url=new URL(value);return url.origin==='https://api.mangadex.org'&&!url.username&&!url.password;}catch{return false;}};
 function responseError(response){const error=new Error('Source request failed (HTTP '+response.status+').');error.status=response.status;
  if(response.status===429||response.status===503)error.retryAt=retryDate(response.headers?.get('Retry-After'),clock);return error;
 }
 async function requestText(url,options={}){
  if(!applies(url))return original.requestText(url,options);
  const method=options.method||'GET',key=method+':'+url,hit=cache.get(key);if(method==='GET'&&options.ttlMs!==0&&hit?.expires>clock())return hit.value;
  const retryAt=Math.max(failure?.retryAt||0,getRetryAt());if(retryAt>clock()){const error=new Error(failure?.message||'Source rate limit reached. Retry later.');error.status=failure?.status||429;error.retryAt=retryAt;throw error;}
  if(method==='GET'&&inflight.has(key))return inflight.get(key);
  const task=(async()=>{const controller=new AbortController();let timedOut=false;const abort=()=>controller.abort(),timer=setTimeout(()=>{timedOut=true;controller.abort();},Math.max(1,Math.min(25000,Number(options.timeoutMs)||12000)));options.signal?.addEventListener('abort',abort,{once:true});if(options.signal?.aborted)controller.abort();
   try{const response=await fetch(resolveUrl(url),{method,headers:options.headers,body:options.body,credentials:'same-origin',cache:'no-store',signal:controller.signal});if(!response.ok)throw responseError(response);const value=await response.text();
    if(method==='GET'&&options.ttlMs!==0){let expires=clock()+Math.max(0,Math.min(10000,Number(options.ttlMs)||10000));try{const json=JSON.parse(value),rows=Array.isArray(json.data)?json.data:[json.data];for(const row of rows)if(Number.isFinite(row?.kuroContentApproval?.checkedAt))expires=Math.min(expires,row.kuroContentApproval.checkedAt+30000);}catch{}cache.set(key,{value,expires});while(cache.size>240)cache.delete(cache.keys().next().value);}return value;
   }catch(error){if(timedOut){error.status=503;error.retryAt=clock()+30000;}if(error.retryAt){failure=error;onBackoff(error.retryAt);}throw error;}
   finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);inflight.delete(key);}
  })();if(method==='GET')inflight.set(key,task);return task;
 }
 return {...original,requestText,requestJson:async(url,options)=>applies(url)?JSON.parse(await requestText(url,options)):original.requestJson(url,options),clearHttpCache:()=>{cache.clear();original.clearHttpCache?.();}};
}
