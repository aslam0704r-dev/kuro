import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const references = new Set([...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map(match => match[1]));
const manifest = JSON.parse(await readFile(path.join(root, 'manifest.webmanifest'), 'utf8'));
for (const icon of manifest.icons) references.add(icon.src);
references.add('/offline.html'); references.add('/sw.js');
references.add('/install-model.mjs'); references.add('/native-install.js');
references.add('/install-toast.js'); references.add('/install-toast.css');
references.add('/startup.js');references.add('/content-policy.css');references.add('/_expo/static/js/web/entry-4ca7ae590a4065290203fe34e743fcb9.js');
for (const name of ['catalogue-core.js','catalogue-bridge.js','catalogue-runtime.mjs','catalogue-model.mjs','provider-directory.js','provider-directory.css','provider-registry.json']) references.add('/'+name);
for(const name of ['local-archive-worker.js','local-pdf-worker.mjs','local-library.css','mobile-artwork.css','vendor/local/libarchive.wasm','vendor/local/pdf.mjs','vendor/local/pdf.worker.mjs','vendor/local/LICENSE-pdfjs','vendor/local/LICENSE-libarchive-wasm'])references.add('/'+name);
const scripts = await readdir(path.join(root, '_expo/static/js/web'));
for (const script of scripts.filter(name => name.endsWith('.js'))) {
  const js = await readFile(path.join(root, '_expo/static/js/web', script), 'utf8');
  for (const match of js.matchAll(/["'](\/assets\/[^"']+)["']/g)) references.add(match[1]);
}
for (const url of references) {
  const relative = url.slice(1), target = path.resolve(root, relative);
  if (!target.startsWith(path.resolve(root) + path.sep) || relative.split('/').includes('node_modules')) throw new Error('Unsafe or ignored public asset: ' + url);
  if (!(await stat(target).catch(() => null))?.isFile()) throw new Error('Missing public asset: ' + url);
}
for (const icon of manifest.icons) {
  const bytes = await readFile(path.join(root, icon.src.slice(1)));
  if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || icon.sizes !== bytes.readUInt32BE(16) + 'x' + bytes.readUInt32BE(20)) throw new Error('Invalid manifest icon: ' + icon.src);
}
console.log('Prebuilt web release validated: ' + references.size + ' referenced resources exist and survive deployment exclusions.');
