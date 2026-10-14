import { readFile } from 'node:fs/promises';
import { X509Certificate } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { makeRelease } from './native-release-model.mjs';
export async function validateNative(dist, version) {
  const expected = await makeRelease(dist, version);
  const actual = JSON.parse(await readFile(path.join(dist,'downloads/releases.json'),'utf8'));
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('Native release metadata does not match the actual installer files. Rebuild and run npm run release:native.');
  const der = await readFile(path.join(dist,'.well-known/android-signing-cert.der'));
  const certificate = new X509Certificate(der);
  const apk = await readFile(path.join(dist,actual.android.url.slice(1)));
  if (!apk.includes(der)) throw new Error('APK does not contain the expected public signing certificate.');
  const links = JSON.parse((await readFile(path.join(dist,'.well-known/assetlinks.json'),'utf8')).replace(/^\uFEFF/,''));
  if (!Array.isArray(links) || !links.some(link => Array.isArray(link.relation) && link.relation.includes('delegate_permission/common.handle_all_urls') && link.target?.namespace === 'android_app' && link.target.package_name === 'app.kuro.manga' && Array.isArray(link.target.sha256_cert_fingerprints) && link.target.sha256_cert_fingerprints.includes(certificate.fingerprint256)))
    throw new Error('Digital Asset Links must match KURO’s public Android signing certificate.');
  return expected;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root=fileURLToPath(new URL('../',import.meta.url));
  const {version,nativeReleaseVersion}=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
  await validateNative(path.join(root,'dist'),nativeReleaseVersion || version);
  console.log('Native release validated: APK/EXE bytes, hashes, public certificate and Digital Asset Links. APK cryptographic verification is recorded separately by apksigner.');
}
