import test from 'node:test';
import assert from 'node:assert/strict';
const model = await import('../dist/install-model.mjs').catch(error => {
  if (error.code === 'ERR_MODULE_NOT_FOUND') return {}; throw error;
});
const required = name => { assert.equal(typeof model[name], 'function', name + ' feature is not implemented'); return model[name]; };
const release = () => ({ schema: 1, version: '3.9.0', android: { url: '/downloads/KURO-3.9.0-android.apk', bytes: 765432, sha256: 'a'.repeat(64), minimumSystem: 'Android 10+' }, windows: { url: '/downloads/KURO-3.9.0-windows.exe', bytes: 50000, sha256: 'b'.repeat(64), minimumSystem: 'Windows 10/11' } });

test('platform chooses Android ahead of compatibility strings', () => assert.equal(required('detectPlatform')({userAgent:'Mozilla Android 14 Windows compatible',platform:'Linux aarch64'}), 'android'));
test('platform chooses Windows desktop and UA client hints', () => {
  const detect = required('detectPlatform');
  assert.equal(detect({userAgent:'Windows NT 10.0; Win64; x64'}), 'windows');
  assert.equal(detect({userAgentData:{platform:'Windows'},userAgent:'Chromium'}), 'windows');
});
test('iPad desktop mode does not offer a Windows EXE', () => assert.equal(required('detectPlatform')({platform:'MacIntel',maxTouchPoints:5,userAgent:'Safari'}), 'ios'));
test('unsupported systems do not get a primary native installer', () => {
  const detect=required('detectPlatform');
  for (const userAgent of ['Macintosh', 'Linux x86_64', 'Windows Phone Android compatible']) assert.equal(detect({userAgent}), 'other');
});
test('release validates actual download metadata', () => {
  const value=required('validRelease')(release()); assert.equal(value.version,'3.9.0'); assert.equal(value.android.bytes,765432);
});
test('release rejects unsafe URLs and suffix mismatches', () => {
  const validate=required('validRelease');
  for (const url of ['https://evil.invalid/file.apk','//evil.invalid/file.apk','javascript:alert(1)','/downloads/../private.apk','/downloads/file.apk?x=1','/downloads/file.exe','/downloads/%2e%2e/file.apk']) {
    const value=release(); value.android.url=url; assert.equal(validate(value).android,undefined,url);
  }
});
test('release rejects invalid manifest shape, sizes, hashes and text injection', () => {
  const validate=required('validRelease');
  for (const value of [null,[],{schema:2}, {schema:1,version:'<img src=x>'}]) assert.equal(validate(value),null);
  for (const change of [{bytes:0},{bytes:-1},{bytes:NaN},{bytes:1.2},{sha256:'bad'},{minimumSystem:'<b>Android</b>'}]) {
    const value=release(); Object.assign(value.android,change); assert.equal(validate(value).android,undefined);
  }
});
test('native entry marker recognizes only the two built clients', () => {
  const entry=required('nativeEntry'); assert.equal(entry('?kuro-native=android'),true); assert.equal(entry('?kuro-native=windows'),true);
  assert.equal(entry('?kuro-native=evil'),false); assert.equal(entry(''),false);
});
