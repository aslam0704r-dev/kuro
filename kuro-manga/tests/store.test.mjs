import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { redisFixture } from './helpers/redis-fixture.mjs';

const redisUrl = process.env.TEST_REDIS_URL;
const options = { skip: !redisUrl };
let fixture, first, second, directory;
const prefix = 'kuro_test:' + randomUUID();
before(async () => {
  if (!redisUrl) return;
  fixture = await redisFixture(redisUrl);
  directory = await mkdtemp(fileURLToPath(new URL('./.state-', import.meta.url)));
  Object.assign(process.env, { NODE_ENV: 'test', AUTH_TEST_MODE: '1', AUTH_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
    UPSTASH_REDIS_REST_URL: fixture.url, UPSTASH_REDIS_REST_TOKEN: 'fixture-only-token', AUTH_KEY_PREFIX: prefix });
  delete process.env.VERCEL;
  process.env.AUTH_DB = path.join(directory, 'first.sqlite');
  first = await import('../server/managed/store.mjs?first=' + randomUUID());
  process.env.AUTH_DB = path.join(directory, 'second.sqlite');
  second = await import('../server/managed/store.mjs?second=' + randomUUID());
});
after(async () => {
  if (!fixture) return;
  const keys = await fixture.command(['KEYS', prefix + ':*']);
  if (keys.length) await fixture.command(['DEL', ...keys]);
  await fixture.close();
  // The baseline's SQLite handles stay open until process exit on Windows.
  await rm(directory, { recursive: true, force: true }).catch(() => {});
});

test('OAuth state survives a request served by another function instance', options, async () => {
  const id = await first.save('flow', { entries: { verifier: 'fixture-verifier' } }, 600);
  assert.deepEqual((await second.read(id, 'flow'))?.entries, { verifier: 'fixture-verifier' });
  assert.equal(await second.read(id, 'session'), null);
});

test('provider tokens and PKCE verifiers are encrypted in the shared database', options, async () => {
  await first.save('flow', { access_token: 'fixture-provider-secret', verifier: 'fixture-code-verifier' }, 600);
  const keys = await fixture.command(['KEYS', prefix + ':*']);
  const strings = [];
  for (const key of keys) if (await fixture.command(['TYPE', key]) === 'string') strings.push(await fixture.command(['GET', key]));
  assert.ok(strings.length > 0, 'The shared store must contain the saved record.');
  assert.ok(strings.every(value => !value.includes('fixture-provider-secret') && !value.includes('fixture-code-verifier')));
});

test('auth reads use the primary even when ordinary replica reads are stale', options, async () => {
  const id = await first.save('flow', { entries: { verifier: 'primary-verifier' } }, 600);
  fixture.setStaleReads(true);
  try { assert.deepEqual((await second.read(id, 'flow'))?.entries, { verifier: 'primary-verifier' }); }
  finally { fixture.setStaleReads(false); }
});

test('an encrypted session cannot be moved to another cookie record', options, async () => {
  const victim = await first.save('session', { session: { access_token: 'victim-token' } }, 600, 'victim');
  const attacker = await first.save('session', { session: { access_token: 'attacker-token' } }, 600, 'attacker');
  const keys = await fixture.command(['KEYS', prefix + ':*']);
  const hash = id => createHash('sha256').update(id).digest('hex');
  const victimKey = keys.find(key => key.endsWith(hash(victim))), attackerKey = keys.find(key => key.endsWith(hash(attacker)));
  await fixture.command(['SET', attackerKey, await fixture.command(['GET', victimKey]), 'EX', 600]);
  assert.equal(await second.read(attacker, 'session'), null);
  assert.ok(await second.read(victim, 'session'));
});

test('editing a stored expiry cannot extend an authenticated record', options, async () => {
  const id = await first.save('flow', { entries: {} }, 600);
  const keys = await fixture.command(['KEYS', prefix + ':*']);
  const hash = createHash('sha256').update(id).digest('hex'), key = keys.find(key => key.endsWith(hash));
  const record = JSON.parse(await fixture.command(['GET', key])); record.expires += 86400000;
  await fixture.command(['SET', key, JSON.stringify(record), 'EX', 600]);
  assert.equal(await second.read(id, 'flow'), null);
});

test('concurrent instances share one atomic rate-limit budget', options, async () => {
  const results = await Promise.all(Array.from({ length: 25 }, (_, n) => (n % 2 ? first : second).limited('parallel-login', 5, 60)));
  assert.equal(results.filter(blocked => !blocked).length, 5);
});

test('global logout removes only that user and refresh cannot resurrect a deleted session', options, async () => {
  const one = await first.save('session', { session: { user: { id: 'owner' } } }, 600, 'owner');
  const two = await second.save('session', { session: { user: { id: 'owner' } } }, 600, 'owner');
  const other = await second.save('session', { session: { user: { id: 'other' } } }, 600, 'other');
  await second.removeUser('owner');
  assert.equal(await first.read(one, 'session'), null);
  assert.equal(await first.read(two, 'session'), null);
  assert.ok(await first.read(other, 'session'));
  assert.equal(await first.save('session', { session: {} }, 600, 'owner', one), null);
  assert.equal(await second.read(one, 'session'), null);
});

test('requests using the same session are serialized across instances', options, async () => {
  let active = 0, peak = 0;
  const task = async () => { active++; peak = Math.max(peak, active); await delay(120); active--; };
  await Promise.all([first.serialize('same-session', task), second.serialize('same-session', task)]);
  assert.equal(peak, 1);
});

test('expired records are unavailable from every instance', options, async () => {
  const id = await first.save('challenge', { address: 'reader@example.com' }, 1);
  assert.ok(await second.read(id, 'challenge'));
  await delay(1100);
  assert.equal(await second.read(id, 'challenge'), null);
});

test('shared-store failures reject auth operations with a safe temporary error', options, async () => {
  fixture.setFailure(true);
  try {
    await assert.rejects(async () => first.save('flow', {}, 60), error => error.status === 503 && !error.message.includes('fixture-only-token'));
  } finally { fixture.setFailure(false); }
});
