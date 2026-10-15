import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { supabaseFixture } from './helpers/supabase-fixture.mjs';
import { invokeApi, cookies, mergeCookies } from './helpers/invoke-api.mjs';
import { invokeProfile } from './helpers/invoke-profile.mjs';
import { redisFixture } from './helpers/redis-fixture.mjs';
let fixture, redis, handler, directory, png, jpeg, n = 1;
const prefix = 'profile_test:' + randomUUID();
before(async () => {
  fixture = await supabaseFixture(); directory = await mkdtemp(path.join(os.tmpdir(), 'kuro-profile-'));
  Object.assign(process.env, { AUTH_TEST_MODE: '1', SUPABASE_URL: fixture.url, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture',
    PUBLIC_ORIGIN: 'http://localhost:8081', AUTH_DB: path.join(directory, 'auth.sqlite'), AUTH_ENCRYPTION_KEY: randomBytes(32).toString('base64'), AUTH_KEY_PREFIX: prefix });
  delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN;
  if (process.env.TEST_REDIS_URL) {
    redis = await redisFixture(process.env.TEST_REDIS_URL);
    process.env.UPSTASH_REDIS_REST_URL = redis.url; process.env.UPSTASH_REDIS_REST_TOKEN = 'fixture-only-token';
  }
  handler = (await import('../api/kuro.mjs')).default;
  png = await sharp({ create: { width: 24, height: 24, channels: 3, background: '#bf914a' } }).png().toBuffer();
  jpeg = await sharp(png).jpeg().toBuffer();
});
after(async () => {
  await fixture?.close();
  if (redis) {
    const keys = await redis.command(['KEYS', prefix + ':*']); if (keys.length) await redis.command(['DEL', ...keys]);
    await redis.close();
  }
  await rm(directory, { recursive: true, force: true }).catch(() => {});
});
async function account(email = 'profile-' + n++ + '@example.com', recovery = false) {
  const jar = new Map(), ip = '203.0.113.' + n++;
  const auth = async (action, body = {}, method = 'POST') => { const r = await invokeApi(handler, { action, body, method, ip, cookie: cookies(jar) }); mergeCookies(jar, r); return r; };
  if (recovery) { await auth('recovery', { email }); await auth('verify', { code: '654321' }); }
  else assert.equal((await auth('login', { email, password: 'reader-password-123' })).status, 200);
  return { email, auth, async request(input) { const r = await invokeProfile(handler, { ...input, ip, cookie: cookies(jar) }); mergeCookies(jar, r); return r; } };
}
const upload = (bytes, imageType = 'image/png', stream = false) => ({ path: '/api/profile/avatar', method: 'POST', body: bytes, type: 'application/octet-stream', headers: { 'x-kuro-image-type': imageType }, stream });

async function deployedProfileRoot() {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  // Both configured patterns match /api/profile. Vercel takes the first one;
  // its zero-segment wildcard expands to an empty string in the destination.
  // This is the deployed request shape that the direct local server bypasses.
  const rule = config.rewrites.find(row => ['/api/profile', '/api/profile/:kuroPath*'].includes(row.source));
  assert.ok(rule, 'The public profile API must have a rewrite');
  return rule.destination.replace(':kuroPath*', '');
}

test('deployed profile root reaches the session guard rather than a missing route', async () => {
  const response = await invokeProfile(handler, { requestUrl: await deployedProfileRoot() });
  assert.equal(response.status, 401);
  assert.equal(response.body.error, 'Sign in to edit your profile.');
});

test('deployed profile root loads and saves the authenticated account', async () => {
  const reader = await account();
  const requestUrl = await deployedProfileRoot();
  const initial = await reader.request({ requestUrl });
  assert.equal(initial.status, 200);
  assert.equal(typeof initial.body.id, 'string');
  const saved = await reader.request({ requestUrl, method: 'POST', body: { name: 'Deployed Reader' } });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.id, initial.body.id);
  assert.equal((await reader.request({ requestUrl })).body.name, 'Deployed Reader');
});

test('profile requests require a verified KURO session', async () => {
  assert.equal((await invokeProfile(handler)).status, 401);
  assert.equal((await invokeProfile(handler, upload(png))).status, 401);
});
test('edited display name persists across a new login and appears in the existing session API', async () => {
  const a = await account(), updated = await a.request({ method: 'POST', body: { name: '  Kuro Reader  ' } });
  assert.equal(updated.status, 200); assert.equal(updated.body.name, 'Kuro Reader');
  const b = await account(a.email); assert.equal((await b.request()).body.name, 'Kuro Reader');
  assert.equal((await b.auth('session', {}, 'GET')).body.user.name, 'Kuro Reader');
});
test('names reject empty, long, control-character and non-string input', async () => {
  const a = await account();
  for (const name of ['', 'x', 'x'.repeat(61), 'name\u0000', 123]) assert.equal((await a.request({ method: 'POST', body: { name } })).status, 400);
});
test('markup in a name is persisted as display text', async () => {
  const a = await account(), r = await a.request({ method: 'POST', body: { name: '<b>Reader</b>' } });
  assert.equal(r.status, 200); assert.equal((await a.request()).body.name, '<b>Reader</b>');
});
test('cross-origin and missing-origin profile mutations are rejected', async () => {
  const a = await account();
  for (const origin of ['https://evil.example', '']) {
    assert.equal((await a.request({ method: 'POST', body: { name: 'Changed' }, origin })).status, 403);
    assert.equal((await a.request({ ...upload(png), origin })).status, 403);
    assert.equal((await a.request({ path: '/api/profile/avatar', method: 'DELETE', body: {}, origin })).status, 403);
  }
});
test('recovery-only sessions cannot read or edit normal profile data', async () => {
  const a = await account(undefined, true);
  assert.equal((await a.request()).status, 403);
  assert.equal((await a.request({ method: 'POST', body: { name: 'Changed' } })).status, 403);
});
test('MIME spoofing, SVG and unsupported payloads are rejected', async () => {
  const a = await account();
  assert.equal((await a.request(upload(jpeg))).status, 415);
  assert.equal((await a.request(upload(Buffer.from('<svg/>'), 'image/svg+xml'))).status, 415);
  assert.equal((await a.request(upload(Buffer.from('<html>bad</html>')))).status, 415);
});
test('header-only truncated images are rejected after decoding', async () => {
  const a = await account(); assert.equal((await a.request(upload(png.subarray(0, 30)))).status, 400);
});
test('oversized raw, streamed and content-length uploads are rejected', async () => {
  const a = await account(), large = Buffer.alloc(1048577);
  assert.equal((await a.request(upload(large))).status, 413);
  assert.equal((await a.request(upload(large, 'image/png', true))).status, 413);
  assert.equal((await a.request({ ...upload(png), headers: { 'content-length': '1048577' } })).status, 413);
});
test('image dimensions are bounded before pixel decoding', async () => {
  const a = await account(), big = await sharp({ create: { width: 4097, height: 1, channels: 3, background: 'black' } }).png().toBuffer();
  assert.equal((await a.request(upload(big))).status, 400);
});
test('upload, replacement and removal persist and keep photos owner-authenticated', async () => {
  const a = await account(); assert.equal((await a.request(upload(png))).status, 200);
  assert.equal((await a.request()).body.hasAvatar, true);
  const photo = await a.request({ path: '/api/profile/avatar' });
  assert.equal(photo.status, 200); assert.equal(photo.headers['Content-Type'], 'image/webp');
  assert.match(photo.headers['Cache-Control'], /no-store/); assert.equal(photo.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal((await sharp(photo.raw).metadata()).format, 'webp');
  const oldPath = fixture.user(a.email).user_metadata.avatar_path;
  assert.equal((await a.request(upload(jpeg, 'image/jpeg', true))).status, 200);
  assert.notEqual(fixture.user(a.email).user_metadata.avatar_path, oldPath); assert.equal(fixture.objects.has(oldPath), false);
  const b = await account(a.email); assert.equal((await b.request()).body.hasAvatar, true);
  assert.equal((await b.request({ path: '/api/profile/avatar', method: 'DELETE', body: {} })).status, 200);
  assert.equal((await b.request()).body.hasAvatar, false); assert.equal((await b.request({ path: '/api/profile/avatar' })).status, 404);
});
test('a different account and a manipulated metadata path cannot retrieve the first account image', async () => {
  const a = await account(), b = await account(); await a.request(upload(png));
  assert.equal((await b.request({ path: '/api/profile/avatar' })).status, 404);
  fixture.user(b.email).user_metadata.avatar_path = fixture.user(a.email).user_metadata.avatar_path;
  assert.equal((await b.request({ path: '/api/profile/avatar' })).status, 404);
  assert.equal((await invokeProfile(handler, { path: '/api/profile/avatar' })).status, 401);
});
test('Storage contents are revalidated and re-encoded when served even after a direct upload', async () => {
  const a = await account(); await a.request(upload(png)); const key = fixture.user(a.email).user_metadata.avatar_path;
  fixture.objects.set(key, { bytes: Buffer.from('<script>alert(1)</script>'), type: 'image/png' });
  assert.equal((await a.request({ path: '/api/profile/avatar' })).status, 415);
  fixture.objects.set(key, { bytes: Buffer.concat([png, Buffer.from('<script>injected</script>')]), type: 'image/png' });
  const r = await a.request({ path: '/api/profile/avatar' }); assert.equal(r.status, 200); assert.ok(!r.raw.includes(Buffer.from('injected')));
});
test('definite metadata rejection preserves the prior avatar and rolls back the new object', async () => {
  const a = await account(); await a.request(upload(png)); const key = fixture.user(a.email).user_metadata.avatar_path, count = fixture.objects.size;
  fixture.setMetadataFailure('reject');
  try { assert.equal((await a.request(upload(jpeg, 'image/jpeg'))).status, 503); }
  finally { fixture.setMetadataFailure(false); }
  assert.equal(fixture.user(a.email).user_metadata.avatar_path, key); assert.equal(fixture.objects.size, count);
  assert.equal((await a.request({ path: '/api/profile/avatar' })).status, 200);
});
test('storage outages fail closed without clearing a working avatar', async () => {
  const a = await account(); await a.request(upload(png)); fixture.setStorageFailure(true);
  try { assert.equal((await a.request(upload(jpeg, 'image/jpeg'))).status, 503); }
  finally { fixture.setStorageFailure(false); }
  assert.equal((await a.request()).body.hasAvatar, true);
});
test('profile mutation limits return 429 after the permitted actions', async () => {
  const a = await account();
  for (let i = 0; i < 20; i++) assert.equal((await a.request({ method: 'POST', body: { name: 'Reader ' + i } })).status, 200);
  const r = await a.request({ method: 'POST', body: { name: 'Limited' } }); assert.equal(r.status, 429); assert.ok(r.headers['Retry-After']);
});
test('a stale editor cannot save after the signed-in account changes', async () => {
  const a = await account(), b = await account();
  const r = await b.request({ method: 'POST', body: { name: 'Wrong account' }, headers: { 'x-kuro-user': fixture.user(a.email).id } });
  assert.equal(r.status, 409); assert.equal((await b.request()).body.name, 'Fixture Reader');
});
test('Vercel octet-stream parsed upload preserves binary bytes and validates its claimed image MIME', async () => {
  const a = await account();
  const r = await a.request({ path: '/api/profile/avatar', method: 'POST', body: png, type: 'application/octet-stream', headers: { 'x-kuro-image-type': 'image/png' } });
  assert.equal(r.status, 200); assert.equal((await a.request({ path: '/api/profile/avatar' })).status, 200);
});
test('failed avatar removal metadata update preserves the current picture', async () => {
  const a = await account(); await a.request(upload(png)); fixture.setMetadataFailure(true);
  try { assert.equal((await a.request({ path: '/api/profile/avatar', method: 'DELETE', body: {} })).status, 503); }
  finally { fixture.setMetadataFailure(false); }
  assert.equal((await a.request({ path: '/api/profile/avatar' })).status, 200);
});
test('an avatar metadata commit followed by an error response is reconciled without deleting the new photo', async () => {
  const a = await account(); await a.request(upload(png)); const old = fixture.user(a.email).user_metadata.avatar_path;
  fixture.setAmbiguousMetadata(true);
  try {
    const r = await a.request(upload(jpeg, 'image/jpeg')); assert.equal(r.status, 200); assert.ok(r.body.warning);
  } finally { fixture.setAmbiguousMetadata(false); }
  assert.notEqual(fixture.user(a.email).user_metadata.avatar_path, old); assert.equal((await a.request({ path: '/api/profile/avatar' })).status, 200);
});
test('an unreadable metadata result retains the potentially committed photo until reconciliation is possible', async () => {
  const a = await account(); await a.request(upload(png)); fixture.setAmbiguousMetadata('unreadable');
  try { assert.equal((await a.request(upload(jpeg, 'image/jpeg'))).status, 503); }
  finally { fixture.setAmbiguousMetadata(false); }
  assert.equal((await a.request({ path: '/api/profile/avatar' })).status, 200);
});
test('a timed-out metadata write that commits after reconciliation still has its uploaded image', async () => {
  const a = await account(); await a.request(upload(png)); fixture.setAmbiguousMetadata('delayed');
  try { assert.equal((await a.request(upload(jpeg, 'image/jpeg'))).status, 503); }
  finally { fixture.setAmbiguousMetadata(false); }
  await new Promise(resolve => setTimeout(resolve, 250));
  assert.equal((await a.request({ path: '/api/profile/avatar' })).status, 200);
});
