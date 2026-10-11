import { Readable } from 'node:stream';
export async function invokeApi(handler, input) {
  const req = Readable.from([]);
  req.url = '/api/kuro?__route=' + encodeURIComponent('/api/auth/' + input.action) + (input.query ? '&' + input.query : '');
  req.method = input.method || 'POST';
  req.headers = { host: 'localhost:8081', origin: input.origin || 'http://localhost:8081',
    'content-type': 'application/json', cookie: input.cookie || '' };
  req.socket = { remoteAddress: input.ip || '198.51.100.1' };
  if (req.method === 'POST') req.body = input.body || {};
  const res = { headers: {}, setHeader(name, value) { this.headers[name] = value; }, getHeader(name) { return this.headers[name]; },
    writeHead(status, headers) { this.statusCode = status; Object.assign(this.headers, headers); },
    end(body = '') { this.body = body; } };
  await handler(req, res);
  return { status: res.statusCode, headers: res.headers, body: res.body ? JSON.parse(res.body) : null };
}
export function mergeCookies(jar, response) {
  for (const cookie of response.headers['Set-Cookie'] || []) {
    const [name, value] = cookie.split(';')[0].split('=');
    if (/Max-Age=0(?:;|$)/.test(cookie)) jar.delete(name); else jar.set(name, value);
  }
}
export const cookies = jar => [...jar].map(([name, value]) => name + '=' + value).join('; ');
