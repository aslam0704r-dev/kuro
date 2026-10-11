import { safeProxyType } from './security.mjs';
import https from 'node:https';
import dns from 'node:dns';
import { BlockList } from 'node:net';

const hosts = ['mangaread.org', 'mgeko.cc', 'imgsrv5.com', 'api.mangaupdates.com', 'cdn.mangaupdates.com', 'mangakatana.com', 'mangapill.com', 'cdn.readdetectiveconan.com', 'webtoons.com', 'webtoon-phinf.pstatic.net', 'swebtoon-phinf.pstatic.net', 'kitsu.io', 'media.kitsu.app', 'weebcentral.com', 'planeptune.us', 'compsci88.com', 'uploads.mangadex.org'];
const blocked = new BlockList();
for (const [base, prefix] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.168.0.0', 16],
  ['100.64.0.0', 10], ['224.0.0.0', 3]]) blocked.addSubnet(base, prefix);

export function permitted(url) {
  return url.protocol === 'https:' && !url.username && !url.password &&
    (!url.port || url.port === '443') &&
    hosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`));
}

function publicLookup(host, options, callback) {
  dns.lookup(host, { family: 4 }, (error, address) => {
    if (error) return callback(error);
    if (blocked.check(address)) return callback(new Error('Private upstream denied'));
    if (options.all) callback(null, [{ address, family: 4 }]);
    else callback(null, address, 4);
  });
}

export async function proxy(req, res, requestUrl) {
  const fail = (status, message) => {
    if (res.headersSent) return res.destroy();
    res.writeHead(status, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
    res.end(message);
  };
  if (!['GET', 'POST'].includes(req.method)) return fail(405, 'Method not allowed');
  let target;
  let supplied;
  try {
    target = new URL(requestUrl.searchParams.get('url'));
    supplied = JSON.parse(requestUrl.searchParams.get('headers') || '{}');
    if (!supplied || typeof supplied !== 'object' || Array.isArray(supplied)) throw new Error();
  } catch { return fail(400, 'Invalid proxy parameters'); }
  if (!permitted(target)) return fail(403, 'Upstream not allowed');
  const headers = {
    'user-agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/124.0.0.0 Mobile Safari/537.36',
    accept: 'text/html,application/xhtml+xml,image/avif,image/webp,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
  };
  if (target.hostname === 'www.webtoons.com' || target.hostname === 'm.webtoons.com') {
    headers['user-agent'] = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36';
  }
  for (const [key, value] of Object.entries(supplied)) {
    if (['accept', 'referer', 'content-type', 'hx-request'].includes(key.toLowerCase()) &&
        typeof value === 'string' && !/[\r\n]/.test(value)) headers[key.toLowerCase()] = value;
  }
  const chunks = [];
  let size = 0;
  try {
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 65536) return fail(413, 'Request too large');
      chunks.push(chunk);
    }
  } catch { return fail(400, 'Invalid request body'); }
  const body = Buffer.concat(chunks);
  const deadline = setTimeout(() => { active?.destroy(); fail(504, 'Proxy deadline exceeded'); }, 30000);
  let active;
  res.on('close', () => { clearTimeout(deadline); active?.destroy(); });
  function send(url, hops, method, payload) {
    if (!permitted(url)) return fail(403, 'Redirect upstream not allowed');
    active = https.request(url, { method, headers, lookup: publicLookup }, upstream => {
      const status = upstream.statusCode || 502;
      if (status >= 300 && status < 400 && upstream.headers.location) {
        upstream.resume();
        if (!hops) return fail(502, 'Too many redirects');
        let next;
        try { next = new URL(upstream.headers.location, url); }
        catch { return fail(502, 'Invalid redirect'); }
        const toGet = status === 303 || ((status === 301 || status === 302) && method === 'POST');
        return send(next, hops - 1, toGet ? 'GET' : method, toGet ? Buffer.alloc(0) : payload);
      }
      res.writeHead(status, {
        'Content-Type': safeProxyType(upstream.headers['content-type']),
        'Cache-Control': 'no-store',
        'Content-Security-Policy': "sandbox; default-src 'none'",
        'X-Content-Type-Options': 'nosniff',
      });
      let received = 0;
      upstream.on('data', chunk => {
        received += chunk.length;
        if (received > 32 * 1024 * 1024) active.destroy(new Error('Response too large'));
      });
      upstream.on('error', () => res.destroy());
      upstream.pipe(res);
    });
    active.on('error', () => fail(502, 'Upstream unavailable'));
    active.setTimeout(15000, () => active.destroy(new Error('Timeout')));
    active.end(payload);
  }
  send(target, 3, req.method, body);
}
