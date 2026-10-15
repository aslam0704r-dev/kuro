import { Readable } from 'node:stream';
export async function invokeProfile(handler, input = {}) {
  const req = Readable.from(input.stream ? [input.body] : []);
  req.url = input.requestUrl || '/api/kuro?__route=' + encodeURIComponent(input.path || '/api/profile');
  req.method = input.method || 'GET';
  req.headers = { host: 'localhost:8081', origin: input.origin ?? 'http://localhost:8081',
    'content-type': input.type || 'application/json', cookie: input.cookie || '', ...input.headers };
  req.socket = { remoteAddress: input.ip || '203.0.113.2' };
  if (!input.stream && input.body !== undefined) req.body = input.body;
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, getHeader(k) { return this.headers[k]; },
    writeHead(s, h) { this.statusCode = s; Object.assign(this.headers, h); }, end(v = '') { this.raw = Buffer.from(v); } };
  await handler(req, res);
  return { status: res.statusCode, headers: res.headers, raw: res.raw,
    body: String(res.headers['Content-Type'] || '').includes('application/json') ? JSON.parse(res.raw.toString()) : null };
}
