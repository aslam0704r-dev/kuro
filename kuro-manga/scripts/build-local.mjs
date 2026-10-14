import {build} from 'esbuild';
import {mkdir,copyFile,readdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';import {fileURLToPath} from 'node:url';
// Bound the memory type in WASM itself, including direct memory.grow calls.
export function boundedArchiveWasm(input,maxPages=8192){
 const b=new Uint8Array(input);let pos=8,found=false;const out=[...b.subarray(0,8)];
 function read(data,offset){let value=0,shift=0,p=offset;for(;;){const x=data[p++];if(x===undefined||shift>28)throw new Error('Invalid WASM section.');value+=(x&127)*2**shift;if(!(x&128))return [value,p];shift+=7;}}
 const leb=n=>{const v=[];do{let x=n&127;n=Math.floor(n/128);v.push(x|(n?128:0));}while(n);return v;};
 while(pos<b.length){const id=b[pos++],[length,start]=read(b,pos),end=start+length;let data=b.subarray(start,end);if(end>b.length)throw new Error('Invalid WASM length.');
  if(id===5){let [count,p]=read(data,0);if(count!==1)throw new Error('Expected one libarchive WASM memory.');const flags=data[p++];if(flags!==0&&flags!==1)throw new Error('Unexpected WASM memory type.');const [min,next]=read(data,p);p=next;if(min>maxPages)throw new Error('WASM minimum exceeds memory cap.');if(flags===1){[,p]=read(data,p);}if(p!==data.length)throw new Error('Unexpected WASM memory data.');data=Uint8Array.from([1,1,...leb(min),...leb(maxPages)]);found=true;}
  out.push(id,...leb(data.length));for(const x of data)out.push(x);pos=end;
 }
 if(!found)throw new Error('WASM memory section missing.');return Uint8Array.from(out);
}
async function copyTree(from,to,filter=()=>true){await mkdir(to,{recursive:true});for(const entry of await readdir(from,{withFileTypes:true})){if(!filter(entry.name))continue;const a=path.join(from,entry.name),b=path.join(to,entry.name);if(entry.isDirectory())await copyTree(a,b,filter);else await copyFile(a,b);}}
export async function buildLocalAssets(){
 await mkdir('dist/vendor/local',{recursive:true});
 await copyFile('client/local/pdf-worker.mjs','dist/local-pdf-worker.mjs');
 await build({entryPoints:['client/local/archive-worker.mjs'],outfile:'dist/local-archive-worker.js',format:'esm',bundle:true,minify:true,target:'es2020',platform:'browser',external:['fs','path','crypto'],legalComments:'inline'});
 await writeFile('dist/vendor/local/libarchive.wasm',boundedArchiveWasm(await readFile('node_modules/libarchive-wasm/dist/libarchive.wasm')));
 for(const name of ['pdf.mjs','pdf.worker.mjs'])await copyFile('node_modules/pdfjs-dist/build/'+name,'dist/vendor/local/'+name);
 for(const dir of ['cmaps','standard_fonts','wasm'])await copyTree('node_modules/pdfjs-dist/'+dir,'dist/vendor/local/'+dir,name=>!name.startsWith('quickjs-'));
 await copyFile('client/local/LICENSE-libarchive-wasm','dist/vendor/local/LICENSE-libarchive-wasm');
 await copyFile('node_modules/pdfjs-dist/LICENSE','dist/vendor/local/LICENSE-pdfjs');
 await copyTree('client/local/licenses','dist/vendor/local/licenses');
 console.log('Local import tools built: bounded archive worker and PDF assets with licenses.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildLocalAssets();
