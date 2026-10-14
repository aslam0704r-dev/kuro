// Reject incomplete/split comic containers before exposing their first pages.
export function validateContainer(input){
 const b=new Uint8Array(input),v=new DataView(b.buffer,b.byteOffset,b.byteLength),same=(offset,bytes)=>bytes.every((x,i)=>b[offset+i]===x);
 const split=()=>{throw new Error('Multipart comic archives are not supported. Combine the volumes into one complete archive first.');};
 const damaged=()=>{throw new Error('This comic archive is damaged or incomplete. Try another copy.');};
 let rar=same(0,[82,97,114,33,26,7])?0:-1;
 if(rar<0&&same(0,[77,90]))for(let p=0;p<Math.min(b.length-8,1024*1024);p++)if(same(p,[82,97,114,33,26,7])){rar=p;break;}
 if(rar>=0&&b[rar+6]===0){
  let p=rar+7,main=false;
  while(p+7<=b.length){const type=b[p+2],flags=v.getUint16(p+3,true),length=v.getUint16(p+5,true);if(length<7||p+length>b.length)damaged();
   if(type===115){main=true;if(flags&1)split();}
   if(type===116&&flags&3||type===123&&flags&1)split();
   let data=0;if(flags&32768){if(length<11)damaged();data=v.getUint32(p+7,true);if(type===116&&flags&256){if(length<40||v.getUint32(p+32,true))damaged();}}
   p+=length+data;if(p>b.length)damaged();if(type===123)break;
  }
  if(!main)damaged();return;
 }
 if(rar>=0&&b[rar+6]===1&&b[rar+7]===0){
  let p=rar+8,main=false;
  const vint=()=>{let n=0,shift=0;for(;;){if(p>=b.length||shift>49)damaged();const x=b[p++];n+=(x&127)*2**shift;if(!(x&128))return n;shift+=7;}};
  while(p+5<=b.length){p+=4;const length=vint(),start=p,end=start+length;if(length<2||end>b.length)damaged();const type=vint(),flags=vint();if(flags&24)split();if(flags&1)vint();const data=flags&2?vint():0;
   if(type===1){main=true;if(vint()&1)split();}if(type===5&&vint()&1)split();if(p>end||end+data>b.length)damaged();p=end+data;if(type===5)break;
  }
  if(!main)damaged();return;
 }
 if(same(0,[80,75])||same(0,[77,90])){
  let end=-1;for(let p=b.length-22;p>=Math.max(0,b.length-65557);p--)if(same(p,[80,75,5,6])&&p+22+v.getUint16(p+20,true)===b.length){end=p;break;}
  if(end<0)damaged();
  if(v.getUint16(end+4,true)||v.getUint16(end+6,true)||v.getUint16(end+8,true)!==v.getUint16(end+10,true))split();
  if(v.getUint32(end+12,true)!==0xffffffff&&v.getUint32(end+16,true)!==0xffffffff&&v.getUint32(end+12,true)+v.getUint32(end+16,true)>end)damaged();
 }
}
