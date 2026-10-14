import http from 'node:http';
import { authRoute } from './auth/routes.mjs';
import { profileRoute } from './profile/routes.mjs';
import { catalogueRoute } from './catalogue/routes.mjs';
import { createReadStream } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { securityHeaders } from './security.mjs';
import path from 'node:path';
import { proxy } from './proxy.mjs';

const root = path.resolve(process.env.WEB_ROOT || 'dist');
const port = Number(process.env.PORT || 8081);
const types = { '.webmanifest': 'application/manifest+json', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.bcmap': 'application/octet-stream', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.apk': 'application/vnd.android.package-archive', '.exe': 'application/vnd.microsoft.portable-executable' };
await stat(path.join(root, 'index.html')).catch(() => {
  throw new Error('Web export missing. Run npm run build:web first.');
});
const headers = securityHeaders(await readFile(path.join(root, 'index.html'), 'utf8'), process.env.NODE_ENV === 'production');
const server = http.createServer(async (req, res) => {
  try {
    for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
    const url = new URL(req.url, 'http://localhost');
    if (await authRoute(req, res, url)) return;
    if (await profileRoute(req, res, url)) return;
    if (await catalogueRoute(req, res, url)) return;
    if (url.pathname === '/__proxy') return await proxy(req, res, url);
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    if (url.pathname === '/healthz') { res.end('ok'); return; }
    let file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(root + path.sep) && file !== root) {
      res.writeHead(403); res.end(); return;
    }
    let info = await stat(file).catch(() => null);
    if (!info?.isFile()) {
      if (path.extname(url.pathname)) { res.writeHead(404); res.end(); return; }
      file = path.join(root, 'index.html');
      info = await stat(file);
    }
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': file.includes(`${path.sep}_expo${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      ...(/\.(apk|exe)$/.test(file) ? { 'Content-Disposition': 'attachment; filename="' + path.basename(file) + '"' } : {}),
    });
    if (req.method === 'HEAD') res.end();
    else createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch {
    if (res.headersSent) res.destroy();
    else { res.writeHead(400); res.end('Invalid request'); }
  }
});
server.requestTimeout = 35000;
server.headersTimeout = 10000;
server.listen(port, '0.0.0.0', () => process.stdout.write(`Kuro listening on ${port}\n`));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close());
