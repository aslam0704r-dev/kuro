import {readFileSync} from 'node:fs';
import vm from 'node:vm';
// Execute only the actual pure source manager/identity/deduplication definitions.
// No application startup, network adapters, account state or React is loaded.
export function metroProviders(){
 const ctx=vm.createContext({location:{origin:'http://127.0.0.1:4184'},URL,URLSearchParams},{codeGeneration:{strings:false,wasm:false}});
 vm.runInContext(`const defs=new Map();globalThis.__d=(f,id,deps)=>defs.set(id,{f,deps,e:{}});globalThis.__r=id=>{const d=defs.get(id);if(!d)throw Error('Module outside test boundary: '+id);if(!d.loaded){d.loaded=true;const m={exports:d.e};d.f(globalThis,__r,null,null,m,d.e,d.deps);d.e=m.exports;}return d.e;};__d((g,r,i,a,m,e)=>{e.bundledSources=[]},792,[]);__d(()=>{},118,[]);`,ctx,{timeout:1000});
 const bundle=readFileSync(new URL('../../dist/_expo/static/js/web/entry-4ca7ae590a4065290203fe34e743fcb9.js',import.meta.url),'utf8');
 for(const id of [789,790,791,794,870,893,1342,1598,1599,1706,862]){
  const line=bundle.split('\n').find(line=>line.startsWith('__d(')&&new RegExp('},'+id+',\\[').test(line));if(!line)throw new Error('Missing compiled module '+id);vm.runInContext(line,ctx,{timeout:1000});
 }
 return id=>ctx.__r(id);
}
