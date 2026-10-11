import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { bodyOf, assertOrigin } from '../server/managed/http.mjs';
import * as http from '../server/managed/http.mjs';

test('accepts Vercel JSON bodies after the request stream has been consumed', async () => {
  const req = Readable.from([]);
  req.body = { email: 'reader@example.com', password: 'twelve-characters' };
  const result = await bodyOf(req).catch(error => ({ failure: error.message }));
  assert.deepEqual(result, { email: 'reader@example.com', password: 'twelve-characters' });
});

test('rejects oversized pre-parsed bodies', async () => {
  const req = Readable.from([]);
  req.body = { password: 'a'.repeat(9000) };
  await assert.rejects(bodyOf(req), /too large/i);
});

test('still reads raw JSON streams on the local Node server', async () => {
  assert.deepEqual(await bodyOf(Readable.from([Buffer.from('{"code":"123456"}')])), { code: '123456' });
});

test('rejects arrays and null instead of treating them as auth forms', async () => {
  for (const body of ['[]', 'null']) {
    await assert.rejects(bodyOf(Readable.from([Buffer.from(body)])), /invalid request/i);
  }
});

test('does not accept a lookalike JSON content type', () => {
  const req = { headers: { host: 'localhost:8081', origin: 'http://localhost:8081', 'content-type': 'application/jsonp' } };
  assert.throws(() => assertOrigin(req), error => error.status === 415);
});

test('uses Vercel client addresses only on Vercel and validates the header', () => {
  const old = process.env.VERCEL;
  const req = { headers: { 'x-vercel-forwarded-for': '198.51.100.8', 'x-forwarded-for': '203.0.113.1' }, socket: { remoteAddress: '127.0.0.1' } };
  try {
    process.env.VERCEL = '1';
    assert.equal(http.clientAddress?.(req), '198.51.100.8');
    req.headers['x-vercel-forwarded-for'] = 'invalid';
    assert.equal(http.clientAddress(req), '127.0.0.1');
    delete process.env.VERCEL;
    req.headers['x-vercel-forwarded-for'] = '198.51.100.8';
    assert.equal(http.clientAddress(req), '127.0.0.1');
  } finally { if (old === undefined) delete process.env.VERCEL; else process.env.VERCEL = old; }
});
