import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {boundedArchiveWasm} from '../scripts/build-local.mjs';
import {securityHeaders} from '../server/security.mjs';
test('the shipped archive module enforces its 512 MiB memory maximum',async()=>{
 const bytes=boundedArchiveWasm(await readFile(new URL('../node_modules/libarchive-wasm/dist/libarchive.wasm',import.meta.url)));
 const mod=await WebAssembly.compile(bytes),imports={};for(const item of WebAssembly.Module.imports(mod)){imports[item.module]??={};imports[item.module][item.name]=()=>0;}
 const instance=await WebAssembly.instantiate(mod,imports),memory=Object.values(instance.exports).find(x=>x instanceof WebAssembly.Memory);
 assert.ok(memory);assert.throws(()=>memory.grow(8192),RangeError);
});
test('local tools keep JavaScript eval and embedded objects blocked',()=>{
 const csp=securityHeaders('<html></html>')['Content-Security-Policy'];assert.ok(csp.includes("'wasm-unsafe-eval'"));assert.ok(csp.includes("worker-src 'self'"));assert.ok(csp.includes("object-src 'none'"));assert.ok(!csp.includes("'unsafe-eval'"));
});
