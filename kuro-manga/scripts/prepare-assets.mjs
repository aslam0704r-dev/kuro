import { readdir, readFile, writeFile, rename, unlink, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(fileURLToPath(new URL('../dist/', import.meta.url)));
function inside(relative) {
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep)) throw new Error('Asset path escaped dist');
  return target;
}
const source = inside('assets/node_modules'), destination = inside('assets/vendor');
if (await stat(source).catch(() => null)) {
  if (await stat(destination).catch(() => null)) throw new Error('Both old and new asset directories exist; inspect before moving.');
  await rename(source, destination);
}
const directory = inside('_expo/static/js/web');
for (const entry of await readdir(directory)) {
  if (!/^entry-.*\.js$/.test(entry)) continue;
  const oldFile = inside('_expo/static/js/web/' + entry), original = await readFile(oldFile, 'utf8');
  const prepared = original.replaceAll('/assets/node_modules/', '/assets/vendor/');
  if (original === prepared) continue;
  const newName = 'entry-' + createHash('sha256').update(prepared).digest('hex').slice(0, 32) + '.js';
  const newFile = inside('_expo/static/js/web/' + newName);
  await writeFile(newFile, prepared, { flag: 'wx' });
  for (const name of ['index.html', 'metadata.json']) {
    const file = inside(name), text = await readFile(file, 'utf8');
    await writeFile(file, text.replaceAll(entry, newName));
  }
  await unlink(oldFile);
}
console.log('Exported vendor assets prepared for Vercel upload.');
