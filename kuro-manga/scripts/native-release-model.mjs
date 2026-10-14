import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
export async function makeRelease(dist, version) {
  if (!/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(version)) throw new Error('Invalid release version');
  const result = { schema: 1, version };
  for (const [platform, extension, minimumSystem] of [['android','apk','Android 10+'],['windows','exe','Windows 10/11 + Edge']]) {
    const name = 'KURO-' + version + '-' + platform + '.' + extension, data = await readFile(path.join(dist, 'downloads', name));
    if (extension === 'apk') {
      if (data.length < 4096 || !data.subarray(0,4).equals(Buffer.from('504b0304','hex')) || !data.includes(Buffer.from('APK Sig Block 42')) || !data.includes(Buffer.from('AndroidManifest.xml')) || !data.includes(Buffer.from('classes.dex'))) throw new Error('Invalid signed APK');
    } else {
      if (data.length < 128 || data[0] !== 77 || data[1] !== 90) throw new Error('Invalid Windows EXE');
      const offset = data.readUInt32LE(60);
      if (offset < 64 || offset > data.length - 4 || !data.subarray(offset,offset+4).equals(Buffer.from('50450000','hex'))) throw new Error('Invalid Windows PE image');
    }
    result[platform] = { url: '/downloads/' + name, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex'), minimumSystem };
  }
  return result;
}
