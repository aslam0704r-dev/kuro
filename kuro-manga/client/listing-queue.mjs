// Collections share one fair queue. A step may prepare a title or validate one
// hosted page batch; pending work goes to the back instead of occupying a slot
// until an entire long chapter has finished.
export function createListingQueue({step,clock=Date.now,isVisible=()=>true,retryMs=600,maxJobs=2400}){
 const jobs=new Map(),waiting=[],queued=new Set();let active=0,timer,scheduled=false,disposed=false;
 const enqueue=job=>{if(!queued.has(job.id)){queued.add(job.id);waiting.push(job.id);}};
 function schedule(){if(disposed||scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;pump();});}
 function pump(){
  clearTimeout(timer);timer=undefined;if(disposed||!isVisible())return;
  let earliest=Infinity,remaining=waiting.length;
  while(active<2&&remaining-->0&&waiting.length){const id=waiting.shift();queued.delete(id);const job=jobs.get(id);if(!job||!job.owners.size||job.running)continue;
   if(job.retryAt>clock()){earliest=Math.min(earliest,job.retryAt);enqueue(job);continue;}
   job.running=true;active++;
   Promise.resolve().then(()=>step(job.row)).catch(error=>({pending:true,retryAt:clock()+30000,error:error.message})).then(value=>{
    if(disposed)return;
    for(const listener of [...job.owners.values()])try{listener(job.row,value);}catch{}
    if(value?.pending||value?.obsolete){job.retryAt=Math.max(clock()+retryMs,Number.isFinite(value.retryAt)?value.retryAt:0);if(job.owners.size)enqueue(job);}
   }).finally(()=>{job.running=false;active--;if(!job.owners.size&&!queued.has(job.id))jobs.delete(job.id);schedule();});
  }
  if(active<2&&earliest<Infinity){timer=setTimeout(schedule,Math.max(1,earliest-clock()));timer.unref?.();}
 }
 return {
  watch(rows,listener){if(disposed)return()=>{};const owner=Symbol(),owned=[];
   for(const row of rows){if(typeof row?.id!=='string')continue;let job=jobs.get(row.id);
    if(!job){if(jobs.size>=maxJobs)continue;job={id:row.id,row,owners:new Map(),retryAt:0,running:false};jobs.set(row.id,job);}else job.row=row;
    job.owners.set(owner,listener);owned.push(job);if(!job.running)enqueue(job);
   }schedule();return()=>{for(const job of owned){job.owners.delete(owner);if(!job.owners.size&&!job.running){jobs.delete(job.id);queued.delete(job.id);}}schedule();};
  },
  resume:schedule,
  dispose(){disposed=true;clearTimeout(timer);waiting.length=0;queued.clear();for(const job of jobs.values())job.owners.clear();jobs.clear();},
 };
}
