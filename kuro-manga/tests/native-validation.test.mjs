import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
const model=await import('../scripts/validate-native.mjs').catch(error=>{if(error.code==='ERR_MODULE_NOT_FOUND')return {};throw error;});
const ready=()=>assert.equal(typeof model.validateNative,'function','Native deployment validation is not implemented');
const dist=fileURLToPath(new URL('../dist/',import.meta.url));
async function copy(action) {
  const root=await mkdtemp(path.join(os.tmpdir(),'kuro-native-check-'));
  try { await cp(path.join(dist,'downloads'),path.join(root,'downloads'),{recursive:true}); await cp(path.join(dist,'.well-known'),path.join(root,'.well-known'),{recursive:true}); await action(root); }
  finally { await rm(root,{recursive:true,force:true}); }
}
test('native build gate validates both actual installers and assetlinks',async()=>{ready();await model.validateNative(dist,'3.9.0');});
test('native build gate fails when a binary changed after metadata generation',async()=>{ready();await copy(async root=>{const file=path.join(root,'downloads/KURO-3.9.0-windows.exe');const data=await readFile(file);data[data.length-1]^=1;await writeFile(file,data);await assert.rejects(model.validateNative(root,'3.9.0'),/metadata/i);});});
test('native build gate fails when assetlinks names a different signing certificate',async()=>{ready();await copy(async root=>{const file=path.join(root,'.well-known/assetlinks.json');const data=JSON.parse(await readFile(file,'utf8'));data[0].target.sha256_cert_fingerprints=['FF:FF'];await writeFile(file,JSON.stringify(data));await assert.rejects(model.validateNative(root,'3.9.0'),/certificate/i);});});
test('native build gate fails when APK or assetlinks was omitted',async()=>{ready();for(const name of ['downloads/KURO-3.9.0-android.apk','.well-known/assetlinks.json'])await copy(async root=>{await rm(path.join(root,name));await assert.rejects(model.validateNative(root,'3.9.0'));});});
