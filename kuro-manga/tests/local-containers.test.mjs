import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
let guard;try{guard=(await import('../client/local/containers.mjs')).validateContainer;}catch{}
test('RAR multipart flags are rejected even after renaming the first volume',()=>{
 assert.equal(typeof guard,'function');
 const input=readFileSync(new URL('./fixtures/local/Comic.cbr',import.meta.url));const split=Buffer.from(input);split.writeUInt16LE(0x101,10);
 assert.throws(()=>guard(split),/multipart/i);assert.doesNotThrow(()=>guard(input));
});
test('ZIP requires a complete single-disk central directory',()=>{
 assert.equal(typeof guard,'function');const input=readFileSync(new URL('./fixtures/local/Comic.cbz',import.meta.url));const split=Buffer.from(input);const end=split.lastIndexOf(Buffer.from('504b0506','hex'));split.writeUInt16LE(1,end+4);
 assert.throws(()=>guard(split),/multipart/i);assert.throws(()=>guard(input.subarray(0,end)),/incomplete|damaged/i);assert.doesNotThrow(()=>guard(input));
});
test('RAR5 header structure accepts complete comics and rejects volume flags',()=>{
 assert.equal(typeof guard,'function');const input=readFileSync(new URL('./fixtures/local/Comic-rar5.cbr',import.meta.url));const split=Buffer.from(input);split[15]=1;
 assert.throws(()=>guard(split),/multipart/i);assert.doesNotThrow(()=>guard(input));
});
