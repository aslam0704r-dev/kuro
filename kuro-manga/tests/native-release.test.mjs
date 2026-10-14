import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
const module = await import('../scripts/native-release-model.mjs').catch(error => { if(error.code==='ERR_MODULE_NOT_FOUND')return {}; throw error; });
const ready = () => assert.equal(typeof module.makeRelease,'function','Native release generator is not implemented');
test('release refuses absent installer files instead of publishing dummy links', async()=>{
  ready(); const root=await mkdtemp(path.join(os.tmpdir(),'kuro-release-'));
  try { await assert.rejects(module.makeRelease(root,'3.9.0')); } finally { await rm(root,{recursive:true,force:true}); }
});
test('release rejects HTML and renamed non-binary installers', async()=>{
  ready(); const root=await mkdtemp(path.join(os.tmpdir(),'kuro-release-')); await mkdir(path.join(root,'downloads'));
  try {
    for(const type of ['android.apk','windows.exe']) await writeFile(path.join(root,'downloads','KURO-3.9.0-'+type),'<h1>KURO website</h1>');
    await assert.rejects(module.makeRelease(root,'3.9.0'),/Invalid/);
  } finally { await rm(root,{recursive:true,force:true}); }
});
test('release version cannot escape the download directory',async()=>{ ready(); await assert.rejects(module.makeRelease('.', '../secret'),/version/i); });
test('actual delivered installers produce accurate sizes and digests',async()=>{
  ready(); const root=fileURLToPath(new URL('../dist/',import.meta.url));
  const release=await module.makeRelease(root,'3.9.0');
  for(const platform of ['android','windows']) {
    const file=await readFile(path.join(root,release[platform].url.slice(1)));
    assert.equal(release[platform].bytes,file.length); assert.equal(release[platform].sha256,createHash('sha256').update(file).digest('hex'));
  }
});
