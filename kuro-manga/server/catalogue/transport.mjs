import https from 'node:https';
import dns from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

const denied=new BlockList();
for(const [address,prefix] of [['0.0.0.0',8],['10.0.0.0',8],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.168.0.0',16],
 ['100.64.0.0',10],['192.0.0.0',24],['192.0.2.0',24],['192.88.99.0',24],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',3]])denied.addSubnet(address,prefix);
export const publicAddress=address=>isIP(address)===4&&!denied.check(address,'ipv4');
export function permittedURL(value,policy){
 try{const u=new URL(value);const pathname=decodeURIComponent(u.pathname);
  return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&!u.hash&&u.href.length<=4096&&
   policy?.hosts?.includes(u.hostname)&&!/[\x00-\x1f\x7f\\]/.test(pathname)&&!pathname.split('/').includes('..')&&
   (!policy.paths||policy.paths.some(p=>pathname.startsWith(p)));
 }catch{return false;}
}
export const sourceError=(message,status=502,retryAfter=0)=>Object.assign(new Error(message),{status,retryAfter});

export async function fetchPublic(value,policy,{method='GET',body,accept='text/html,application/json',maxBytes=3*1024*1024,
 timeoutMs=12000,lookup=dns.lookup,request=https.request,redirects=3,signal}={}){
 const deadline=Date.now()+Math.min(timeoutMs,20000);
 async function send(value,hops,verb,payload){
  if(signal?.aborted)throw sourceError('Catalogue refresh deadline reached',503);
  if(!permittedURL(value,policy))throw sourceError('Provider URL is not allowed',403);
  const url=new URL(value); let addresses;
  try{addresses=await Promise.race([lookup(url.hostname,{family:4,all:true}),new Promise((_,reject)=>{const t=setTimeout(()=>reject(sourceError('Source DNS timed out',504)),Math.max(1,deadline-Date.now()));t.unref?.();})]);}
  catch(e){throw e?.status?e:sourceError('Source DNS is unavailable');}
  if(signal?.aborted)throw sourceError('Catalogue refresh deadline reached',503);
  if(!Array.isArray(addresses)||!addresses.length||addresses.some(x=>!publicAddress(x.address)))throw sourceError('Public address required',403);
  const pinned=addresses[0].address;
  const reply=await new Promise((resolve,reject)=>{
   let active,timer,settled=false;const fail=e=>{if(settled)return;settled=true;clearTimeout(timer);active?.destroy();reject(signal?.aborted?sourceError('Catalogue refresh deadline reached',503):e?.status?e:sourceError('Source connection failed'));};
   timer=setTimeout(()=>fail(sourceError('Source request timed out',504)),Math.max(1,deadline-Date.now()));
   const headers={'user-agent':'KURO/4.0 (+https://kuro-manga.vercel.app/; public reader)','accept':accept,'accept-encoding':'identity'};
   if(policy.referer)headers.referer=policy.referer;
   if(policy.hxRequest)headers['hx-request']='true';
   if(payload){headers['content-type']=verb==='POST'&&accept==='application/json'?'application/json':'application/x-www-form-urlencoded';headers['content-length']=Buffer.byteLength(payload);}
   try{active=request(url,{method:verb,headers,signal,lookup:(_host,options,callback)=>options.all?callback(null,[{address:pinned,family:4}]):callback(null,pinned,4)},response=>{
    const status=response.statusCode||502;
    if(status>=300&&status<400&&response.headers.location){let redirect;try{redirect=new URL(response.headers.location,url).href;}catch{response.resume();fail(sourceError('Invalid provider redirect'));return;}response.resume();settled=true;clearTimeout(timer);resolve({redirect,status});return;}
    if(status<200||status>=300){response.resume();const raw=response.headers['retry-after'];const seconds=/^\d+$/.test(raw||'')?Number(raw):Math.ceil((Date.parse(raw)-Date.now())/1000);
     fail(sourceError(status===429?'Source rate limit reached':status===401||status===403?'Source access is restricted':`Source unavailable (HTTP ${status})`,status===429?429:502,Math.min(3600,Math.max(60,seconds||60))));return;}
    if(response.headers['content-encoding']&&!/^(identity)$/i.test(response.headers['content-encoding'])){response.destroy();fail(sourceError('Unexpected source encoding'));return;}
    if(Number(response.headers['content-length']||0)>maxBytes){response.destroy();fail(sourceError('Source response size exceeded',413));return;}
    const chunks=[];let size=0;
    response.on('data',chunk=>{size+=chunk.length;if(size>maxBytes){response.destroy();fail(sourceError('Source response size exceeded',413));}else chunks.push(chunk);});
    response.on('error',()=>fail(sourceError('Source response interrupted')));response.on('aborted',()=>fail(sourceError('Source response interrupted')));
    response.on('end',()=>{if(settled)return;settled=true;clearTimeout(timer);resolve({body:Buffer.concat(chunks),status,headers:response.headers,url:url.href});});
   });active.on('error',fail);active.end(payload);}catch(e){fail(e);}
  });
  if(reply.redirect){if(hops<=0)throw sourceError('Too many provider redirects');const useGet=reply.status===303||([301,302].includes(reply.status)&&verb==='POST');return send(reply.redirect,hops-1,useGet?'GET':verb,useGet?undefined:payload);}
  return reply;
 }return send(value,redirects,method,body);
}
