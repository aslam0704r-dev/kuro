import test from 'node:test';
import assert from 'node:assert/strict';
const module=await import('../client/listing-queue.mjs').catch(()=>({}));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
function queue(options){assert.equal(typeof module.createListingQueue,'function','the shared fair listing queue must exist');return module.createListingQueue(options);}

test('a pending long chapter yields to later titles with only two active steps',async()=>{
 const calls=[],releases=[],visible=[];let active=0,max=0;
 const q=queue({retryMs:1,step:async row=>{active++;max=Math.max(max,active);calls.push(row.id);try{if(row.id!=='short'&&!releases.includes(row.id)){releases.push(row.id);return {pending:true};}return {ready:true};}finally{active--;}}});
 const off=q.watch([{id:'long-a'},{id:'long-b'},{id:'short'}],(row,value)=>{if(value.ready)visible.push(row.id);});
 for(let i=0;i<10&&!visible.includes('short');i++)await tick();
 assert.ok(visible.includes('short'));assert.ok(calls.indexOf('short')<calls.lastIndexOf('long-a')||calls.filter(id=>id==='long-a').length===1);assert.ok(max<=2);off();q.dispose();
});
test('multiple mounted collections share the same two workers and same title request',async()=>{
 const gate=deferred(),calls=[];let active=0,max=0;
 const q=queue({step:async row=>{calls.push(row.id);active++;max=Math.max(max,active);await gate.promise;active--;return {ready:true};}});
 const a=q.watch([{id:'a'},{id:'b'}],()=>{}),b=q.watch([{id:'a'},{id:'c'}],()=>{});await tick();assert.equal(calls.length,2);assert.equal(new Set(calls).size,2);gate.resolve();for(let i=0;i<5;i++)await tick();assert.equal(calls.filter(id=>id==='a').length,1);assert.ok(max<=2);a();b();q.dispose();
});
test('unmount prevents queued work and completion notifications for that owner',async()=>{
 const gate=deferred(),calls=[],updates=[];const q=queue({step:async row=>{calls.push(row.id);await gate.promise;return {ready:true};}});
 const off=q.watch([{id:'a'},{id:'b'},{id:'c'}],row=>updates.push(row.id));await tick();off();gate.resolve();for(let i=0;i<5;i++)await tick();assert.equal(calls.length,2);assert.deepEqual(updates,[]);q.dispose();
});
test('a rate-limited title waits without holding up a different title',async()=>{
 let now=1000;const calls=[];const q=queue({clock:()=>now,retryMs:1,step:async row=>{calls.push(row.id);return row.id==='limited'&&now<2000?{pending:true,retryAt:2000}:{ready:true};}});
 const off=q.watch([{id:'limited'},{id:'ready'}],()=>{});for(let i=0;i<5;i++)await tick();assert.deepEqual(calls,['limited','ready']);now=2000;q.resume();for(let i=0;i<3;i++)await tick();assert.deepEqual(calls,['limited','ready','limited']);off();q.dispose();
});
test('hidden pages do not begin new source work',async()=>{
 let visible=false;const calls=[];const q=queue({isVisible:()=>visible,step:async row=>{calls.push(row.id);return {ready:true};}});const off=q.watch([{id:'a'}],()=>{});await tick();assert.deepEqual(calls,[]);visible=true;q.resume();await tick();assert.deepEqual(calls,['a']);off();q.dispose();
});
test('finished unmounted jobs release capacity for later collections',async()=>{
 const calls=[];const q=queue({maxJobs:2,step:async row=>{calls.push(row.id);return {ready:true};}});const off=q.watch([{id:'a'},{id:'b'}],()=>{});for(let i=0;i<4;i++)await tick();off();await tick();const next=q.watch([{id:'c'}],()=>{});for(let i=0;i<4;i++)await tick();assert.ok(calls.includes('c'));next();q.dispose();
});
