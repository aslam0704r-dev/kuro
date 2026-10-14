import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { makeRelease } from './native-release-model.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const { version, nativeReleaseVersion } = JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const release = await makeRelease(path.join(root,'dist'),nativeReleaseVersion || version);
await writeFile(path.join(root,'dist/downloads/releases.json'),JSON.stringify(release,null,2)+'\n');
console.log('Published local release metadata from both actual KURO installer files:',release.version);
