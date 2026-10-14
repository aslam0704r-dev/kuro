import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveRequestUrl } from '../api/kuro.mjs';
import { createCatalogueRoutes } from '../server/catalogue/routes.mjs';

const request = (url, query) => ({ url, query, method: 'GET', headers: { host: 'kuro.example', 'x-forwarded-proto': 'https' }, socket: { remoteAddress: '127.0.0.1' } });

test('Vercel count rewrite removes its transport fields', () => {
  const url = resolveRequestUrl(request('/api/kuro?__route=%2Fapi%2Fcatalogue%2Freadable%2Fcount&kuroPath=readable%2Fcount'));
  assert.equal(url.pathname, '/api/catalogue/readable/count');
  assert.equal(url.search, '');
});

test('Vercel parsed route is accepted when not retained in the raw URL', () => {
  const url = resolveRequestUrl(request('/api/kuro?provider=mangadex&id=example&kuroPath=readable%2Fcheck', { __route: '/api/catalogue/readable/check' }));
  assert.equal(url.pathname, '/api/catalogue/readable/check');
  assert.deepEqual([...url.searchParams.entries()], [['provider', 'mangadex'], ['id', 'example']]);
});

test('MangaDex public path parameter survives the transport rewrite', () => {
  const path = 'manga?limit=1&contentRating[]=safe';
  const url = resolveRequestUrl(request('/api/kuro?__route=%2Fapi%2Fcatalogue%2Fmangadex&kuroPath=mangadex&path=' + encodeURIComponent(path)));
  assert.equal(url.pathname, '/api/catalogue/mangadex');
  assert.equal(url.searchParams.get('path'), path);
});

test('Google callback code and state survive the transport rewrite', () => {
  const url = resolveRequestUrl(request('/api/kuro?__route=%2Fapi%2Fauth%2Fcallback&kuroPath=callback&code=fixture-code&state=fixture-state'));
  assert.equal(url.pathname, '/api/auth/callback');
  assert.equal(url.searchParams.get('code'), 'fixture-code');
  assert.equal(url.searchParams.get('state'), 'fixture-state');
  assert.equal(url.searchParams.has('kuroPath'), false);
});

test('public query fields are not silently discarded from a count request', async () => {
  const req = request('/api/kuro?__route=%2Fapi%2Fcatalogue%2Freadable%2Fcount&kuroPath=readable%2Fcount&extra=1');
  const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, writeHead(code, headers) { this.statusCode = code; Object.assign(this.headers, headers); }, end(body) { this.body = JSON.parse(body); } };
  const routes = createCatalogueRoutes({ budget: async () => true, readableSummary: async () => ({ uniqueCount: 1 }) });
  await routes(req, res, resolveRequestUrl(req));
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Count accepts no parameters');
});

test('count route accepts a normalized Vercel request', async () => {
  const req = request('/api/kuro?__route=%2Fapi%2Fcatalogue%2Freadable%2Fcount&kuroPath=readable%2Fcount');
  const res = { headers: {}, setHeader(key, value) { this.headers[key] = value; }, writeHead(code, headers) { this.statusCode = code; Object.assign(this.headers, headers); }, end(body) { this.body = JSON.parse(body); } };
  const routes = createCatalogueRoutes({ budget: async () => true, readableSummary: async () => ({ uniqueCount: 1 }) });
  await routes(req, res, resolveRequestUrl(req));
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.uniqueCount, 1);
});

test('all dynamic function rewrites use a transport-specific capture name', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  const rewrites = config.rewrites.filter(row => row.destination.startsWith('/api/kuro?'));
  assert.ok(rewrites.length >= 5);
  for (const rewrite of rewrites) {
    assert.equal(rewrite.source.includes(':path'), false);
    if (rewrite.source.includes(':')) {
      assert.ok(rewrite.source.includes(':kuroPath*'));
      assert.ok(rewrite.destination.includes(':kuroPath*'));
    }
  }
});
