import { createHash, randomBytes } from 'node:crypto';
import { sourceError } from './transport.mjs';
import {catalogueSignal} from './deadline.mjs';

const hash=key=>createHash('sha256').update(key).digest('hex');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
export function createMemoryCoordinator(clock=Date.now){
 const rows=new Map(),budgets=new Map(),locks=new Map(),inventory=new Map();let inventoryRevision=0;
 const prune=map=>{for(const [key,row]of map)if(row.expires<=clock())map.delete(key);};
 return {
  async inventoryGet(bucket){const row=inventory.get(bucket);if(!row||row.expires<=clock()){inventory.delete(bucket);return {};}return structuredClone(row.value);},
  async inventoryAll(){for(let attempt=0;attempt<3;attempt++){const revision=inventoryRevision,data=await Promise.all(Array.from({length:256},(_,i)=>this.inventoryGet(i.toString(16).padStart(2,'0'))));if(revision===inventoryRevision)return data;}throw sourceError('Readable inventory changed during counting. Retry shortly.',503);},
  async inventorySet(bucket,value,ttl){if(!/^[a-f0-9]{2}$/.test(bucket)||Buffer.byteLength(JSON.stringify(value))>512*1024)throw sourceError('Readable inventory capacity reached',503);inventory.set(bucket,{value:structuredClone(value),expires:clock()+ttl});inventoryRevision++;},
  async get(key){const row=rows.get(key);if(!row||row.expires<=clock()){rows.delete(key);return null;}return structuredClone(row.value);},
  async getMany(keys){return Promise.all(keys.map(key=>this.get(key)));},
  async set(key,value,ttl){prune(rows);if(!rows.has(key)&&rows.size>=2000)rows.delete(rows.keys().next().value);rows.set(key,{value:structuredClone(value),expires:clock()+ttl});},
  async budget(key,limit,ttl){prune(budgets);const row=budgets.get(key);if(!row){if(budgets.size>=4000)return false;budgets.set(key,{value:1,expires:clock()+ttl});return true;}return ++row.value<=limit;},
  async lock(key,task){const old=locks.get(key)||Promise.resolve();const current=old.catch(()=>{}).then(task);locks.set(key,current);try{return await current;}finally{if(locks.get(key)===current)locks.delete(key);}},
 };
}
const READ="local v=redis.call('GET',KEYS[1]); if v then local t=redis.call('PTTL',KEYS[1]); if t>0 then redis.call('PEXPIRE',KEYS[1],t) end end; return v";
const SET="redis.call('ZREMRANGEBYSCORE',KEYS[2],'-inf',ARGV[1]); if redis.call('EXISTS',KEYS[1])==0 and redis.call('ZCARD',KEYS[2])>=1000 then local old=redis.call('ZRANGE',KEYS[2],0,0); if old[1] then redis.call('DEL',old[1]);redis.call('ZREM',KEYS[2],old[1]) end end; redis.call('SET',KEYS[1],ARGV[2],'PX',ARGV[3]); redis.call('ZADD',KEYS[2],tonumber(ARGV[1])+tonumber(ARGV[3]),KEYS[1]); return 1";
const BUDGET="redis.call('ZREMRANGEBYSCORE',KEYS[2],'-inf',ARGV[1]); if redis.call('EXISTS',KEYS[1])==0 and redis.call('ZCARD',KEYS[2])>=4000 then return 0 end; local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[2]);redis.call('ZADD',KEYS[2],tonumber(ARGV[1])+tonumber(ARGV[2]),KEYS[1]) end; if n>tonumber(ARGV[3]) then return 0 end;return 1";
export function createRedisCoordinator(url,token,prefix='kuro:catalogue:v1'){
 if(!/^[a-zA-Z0-9:_-]{1,100}$/.test(prefix))throw new Error('Invalid catalogue namespace');
 const key=name=>prefix+':'+hash(name);
 async function command(values,cleanup=false){
  try{const res=await fetch(url,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(values),signal:!cleanup&&catalogueSignal()?AbortSignal.any([AbortSignal.timeout(3000),catalogueSignal()]):AbortSignal.timeout(3000)});
   if(!res.ok)throw new Error();const data=await res.json();if(data.error||!Object.hasOwn(data,'result'))throw new Error();return data.result;
  }catch{throw sourceError('Catalogue coordination is unavailable. Retry later.',503);}
 }
 const evaluate=(script,keys,args=[],cleanup=false)=>command(['EVAL',script,keys.length,...keys,...args],cleanup);
 return {
  async inventoryGet(bucket){if(!/^[a-f0-9]{2}$/.test(bucket))throw sourceError('Invalid inventory bucket',400);const data=await evaluate(READ,[prefix+':readable-v1:'+bucket]);try{return data===null?{}:JSON.parse(data);}catch{throw sourceError('Invalid readable inventory',503);}},
  async inventoryAll(){for(let attempt=0;attempt<3;attempt++){const revision=await evaluate("return redis.call('GET',KEYS[1]) or '0'",[prefix+':readable-revision']),values=[];for(let i=0;i<256;i+=32){const keys=Array.from({length:Math.min(32,256-i)},(_,j)=>prefix+':readable-v1:'+(i+j).toString(16).padStart(2,'0'));
   // Lua reads the primary consistently, avoiding a replica-lag count of zero.
   const data=await evaluate("local r={};for i,k in ipairs(KEYS) do local v=redis.call('GET',k);r[i]=v or false;end;return r",keys);
   if(!Array.isArray(data)||data.length!==keys.length)throw sourceError('Invalid readable inventory',503);for(const item of data){try{values.push(item===null||item===false?{}:JSON.parse(item));}catch{throw sourceError('Invalid readable inventory',503);}}}if(revision===await evaluate("return redis.call('GET',KEYS[1]) or '0'",[prefix+':readable-revision']))return values;}throw sourceError('Readable inventory changed during counting. Retry shortly.',503);},
  async inventorySet(bucket,value,ttl){if(!/^[a-f0-9]{2}$/.test(bucket))throw sourceError('Invalid inventory bucket',400);const data=JSON.stringify(value);if(Buffer.byteLength(data)>512*1024)throw sourceError('Readable inventory capacity reached',503);await evaluate("redis.call('SET',KEYS[1],ARGV[1],'PX',ARGV[2]);return redis.call('INCR',KEYS[2])",[prefix+':readable-v1:'+bucket,prefix+':readable-revision'],[data,Math.ceil(ttl)]);},
  async get(name){const data=await evaluate(READ,[key('cache:'+name)]);if(data===null)return null;try{return JSON.parse(data);}catch{throw sourceError('Invalid catalogue cache',503);}},
  async getMany(names){const values=[];for(let i=0;i<names.length;i+=100){const data=await command(['MGET',...names.slice(i,i+100).map(name=>key('cache:'+name))]);
   if(!Array.isArray(data)||data.length!==Math.min(100,names.length-i))throw sourceError('Invalid catalogue cache',503);
   for(const item of data){try{values.push(item===null?null:JSON.parse(item));}catch{throw sourceError('Invalid catalogue cache',503);}}}return values;},
  async set(name,value,ttl){const data=JSON.stringify(value);if(Buffer.byteLength(data)>512*1024)throw sourceError('Catalogue result is too large',413);
   if(!await evaluate(SET,[key('cache:'+name),prefix+':cache-entries'],[Date.now(),data,ttl]))throw sourceError('Catalogue cache is at capacity',503);},
  async budget(name,limit,ttl){return !!await evaluate(BUDGET,[key('budget:'+name),prefix+':budget-entries'],[Date.now(),ttl,limit]);},
  async lock(name,task){const lock=key('lock:'+name),value=randomBytes(16).toString('hex');let acquired=false;
   for(let i=0;i<24;i++){acquired=await command(['SET',lock,value,'NX','PX',35000])==='OK';if(acquired)break;await wait(100+Math.min(i*20,300));}
   if(!acquired)throw sourceError('Catalogue is busy. Retry shortly.',503);
   try{return await task();}finally{await evaluate("if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end",[lock],[value],true).catch(()=>{});}
  }
 };
}
export function createCatalogueCache(coordinator,clock=Date.now){
 const inflight=new Map();
 async function load(key,ttl,task){
  const cached=await coordinator.get('data:'+key);if(cached&&cached.expires>clock())return {...cached,stale:false};
  return coordinator.lock(key,async()=>{
   const cached=await coordinator.get('data:'+key);if(cached&&cached.expires>clock())return {...cached,stale:false};
   const negative=await coordinator.get('failure:'+key);if(negative)throw sourceError(negative.message,negative.status,negative.retryAfter);
   try{const value=await task();const row={value,checkedAt:clock(),expires:clock()+ttl};
    // Large HTML inputs can be parsed into a small catalogue result without
    // turning the shared cache into storage for entire remote sites.
    if(Buffer.byteLength(JSON.stringify(row))<=512*1024)await coordinator.set('data:'+key,row,ttl);return {...row,stale:false};}
   catch(error){const retryAfter=Math.min(3600,Math.max(30,error.retryAfter||60));
    if(catalogueSignal()?.aborted)throw sourceError('Catalogue refresh deadline reached',503);
    if(error.status!==503)await coordinator.set('failure:'+key,{message:error.status===429?'Source rate limit reached':'Source temporarily unavailable. Retry later.',status:error.status||502,retryAfter},retryAfter*1000).catch(()=>{});
    throw error;
   }
  });
 }
 return {getOrLoad(key,ttl,task){const scope=catalogueSignal()||null,bucket=inflight.get(scope)||new Map();inflight.set(scope,bucket);
  if(bucket.has(key))return bucket.get(key);const running=load(key,ttl,task).finally(()=>{bucket.delete(key);if(!bucket.size&&inflight.get(scope)===bucket)inflight.delete(scope);});bucket.set(key,running);return running;}};
}
