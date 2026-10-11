import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory()
    ? files(path.join(directory, entry.name)) : path.join(directory, entry.name)))).flat();
}

test('all exported asset URLs survive Vercel CLI default directory exclusions', async () => {
  const exported = await files(root);
  const upload = new Set(exported.filter(file => !path.relative(root, file).split(path.sep).includes('node_modules')));
  const scripts = exported.filter(file => file.endsWith('.js'));
  const refs = new Set();
  for (const script of scripts) {
    for (const match of (await readFile(script, 'utf8')).matchAll(/["'](\/assets\/[^"']+)["']/g)) refs.add(match[1]);
  }
  assert.ok(refs.size >= 20, 'The exported bundle must include its font/navigation assets.');
  const missing = [...refs].filter(url => !upload.has(path.join(root, url.slice(1))));
  assert.deepEqual(missing, [], 'Referenced assets must be included in a Vercel CLI upload.');
});

test('manifest icons are PNGs at the advertised dimensions', async () => {
  const manifest = JSON.parse(await readFile(path.join(root, 'manifest.webmanifest'), 'utf8'));
  for (const icon of manifest.icons) {
    const bytes = await readFile(path.join(root, icon.src.slice(1)));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(icon.sizes, bytes.readUInt32BE(16) + 'x' + bytes.readUInt32BE(20));
  }
});

test('the exported page includes existing install resources', async () => {
  const html = await readFile(path.join(root, 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map(match => match[1]);
  assert.ok(refs.includes('/install.js'));
  assert.ok(refs.includes('/manifest.webmanifest'));
  for (const ref of refs) assert.ok((await stat(path.join(root, ref.slice(1)))).isFile(), ref);
});
