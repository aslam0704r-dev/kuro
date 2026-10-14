import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {reviewedDeviceBooks} from '../client/local/reviewed-content.mjs';import {admitDevicePages,reviewedHashes,reviewedIdentity} from '../client/local/content.mjs';import {bookIdentity} from '../client/local/model.mjs';
test('unreviewed images and caller supplied approval flags do not admit a device book',async()=>{
 const blob=new Blob(['some image bytes']);await assert.rejects(admitDevicePages([{blob,approved:true,isAdult:false}]),/not been reviewed/);
 await assert.rejects(admitDevicePages([{blob,hash:reviewedDeviceBooks[0].pageHashes[0]}]),/no longer match/);
 assert.equal(reviewedHashes(['a'.repeat(64)]),undefined);
});
test('reviewed device identities cover the exact full book and its reversed safe order only',async()=>{
 const hashes=reviewedDeviceBooks[0].pageHashes;assert.ok(reviewedHashes(hashes));assert.ok(reviewedHashes([...hashes].reverse()));assert.equal(reviewedHashes(hashes.slice(0,2)),undefined);
 assert.equal(await reviewedIdentity(await bookIdentity(hashes)),true);assert.equal(await reviewedIdentity('local-'+'0'.repeat(64)),false);
});
