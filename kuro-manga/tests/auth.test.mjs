import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { supabaseFixture } from './helpers/supabase-fixture.mjs';
import { redisFixture } from './helpers/redis-fixture.mjs';
import { invokeApi, mergeCookies, cookies } from './helpers/invoke-api.mjs';

let provider, redis, directory, handler;
const prefix = 'auth_test:' + randomUUID();
before(async () => {
  provider = await supabaseFixture();
  directory = await mkdtemp(fileURLToPath(new URL('./.auth-', import.meta.url)));
  Object.assign(process.env, { NODE_ENV: 'test', AUTH_TEST_MODE: '1', PUBLIC_ORIGIN: 'http://localhost:8081',
    SUPABASE_URL: provider.url, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture',
    AUTH_DB: path.join(directory, 'test.sqlite'), AUTH_ENCRYPTION_KEY: randomBytes(32).toString('base64'), AUTH_KEY_PREFIX: prefix });
  delete process.env.VERCEL; delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN;
  if (process.env.TEST_REDIS_URL) {
    redis = await redisFixture(process.env.TEST_REDIS_URL);
    process.env.UPSTASH_REDIS_REST_URL = redis.url; process.env.UPSTASH_REDIS_REST_TOKEN = 'fixture-only-token';
  }
  handler = (await import('../api/kuro.mjs')).default;
});
after(async () => {
  await provider.close();
  if (redis) {
    const keys = await redis.command(['KEYS', prefix + ':*']); if (keys.length) await redis.command(['DEL', ...keys]);
    await redis.close();
  }
  await rm(directory, { recursive: true, force: true }).catch(() => {});
});
let ip = 2;
function browser() {
  const jar = new Map(), address = '198.51.100.' + ip++;
  return { jar, async request(action, body = {}, method = 'POST', query = '') {
    const result = await invokeApi(handler, { action, body, method, query, ip: address, cookie: cookies(jar) });
    mergeCookies(jar, result); return result;
  } };
}

test('password sign-in accepts a Vercel parsed body and returns only an opaque HttpOnly cookie', async () => {
  const b = browser();
  const result = await b.request('login', { email: 'password@example.com', password: 'reader-password-123' });
  assert.equal(result.status, 200); assert.equal(result.body.user.email, 'password@example.com');
  const cookie = result.headers['Set-Cookie'].find(value => value.includes('_session='));
  assert.match(cookie, /=([a-f0-9]{64});.*HttpOnly.*SameSite=Lax/);
  assert.ok(!JSON.stringify(result.body).includes('access_token'));
  assert.equal((await b.request('session', {}, 'GET')).body.user.email, 'password@example.com');
  assert.equal((await b.request('login', { email: 'password@example.com', password: 'wrong-password-123' })).status, 401);
});

test('signup waits for email verification and enforces the resend cooldown', async () => {
  const b = browser(), result = await b.request('signup', { email: 'signup@example.com', name: 'New Reader', password: 'reader-password-123' });
  assert.equal(result.status, 200); assert.equal(result.body.challenge.kind, 'signup'); assert.equal(result.body.user, undefined);
  assert.equal((await b.request('resend')).status, 429);
  const verified = await b.request('verify', { code: '654321' });
  assert.equal(verified.body.user.emailVerified, true); assert.equal(verified.body.recovery, false);
});

test('email OTP cannot promote an ordinary login into password recovery', async () => {
  const b = browser();
  assert.equal((await b.request('otp', { channel: 'email', address: 'emailotp@example.com' })).status, 200);
  assert.equal((await b.request('verify', { code: '654321', kind: 'recovery' })).body.recovery, false);
  assert.equal((await b.request('password', { password: 'changed-password-123' })).status, 403);
});

test('phone and non-email OTP requests cannot send a code or establish a session', async () => {
  for (const input of [{channel:'sms',address:'+919876543210'}, {channel:'phone',email:'no-phone@example.com'},
    {channel:'SMS',email:'no-phone@example.com'}, {phone:'+919876543210',email:'no-phone@example.com'}]) {
    const b = browser(), result = await b.request('otp', input);
    assert.equal(result.status, 400); assert.match(result.body.error, /email|phone/i);
    assert.equal(b.jar.has('kuro_m_challenge'), false);
    assert.equal((await b.request('verify', {code:'654321'})).status, 400);
    assert.equal((await b.request('session', {}, 'GET')).body.user, null);
  }
});

test('saved SMS challenges are cancelled in session, resend and verification paths', async () => {
  const {save,read} = await import('../server/managed/store.mjs');
  for (const action of ['session','resend','verify']) {
    const b=browser(), id=await save('challenge',{kind:'login',channel:'sms',address:'+919876543210',tries:0,sentAt:Date.now()-90000},600);
    b.jar.set('kuro_m_challenge',id);
    const result=await b.request(action,{code:'654321'},action==='session'?'GET':'POST');
    assert.equal(result.status,action==='session'?200:400);
    assert.equal(result.body.challenge??null,null); assert.ok(!JSON.stringify(result.body).includes('919876543210'));
    assert.equal(b.jar.has('kuro_m_challenge'),false); assert.equal(await read(id,'challenge'),null);
  }
});

test('phone-only accounts cannot keep old web sessions or create new ones', async () => {
  const {save}=await import('../server/managed/store.mjs'), b=browser(), phoneSession=provider.phoneSession('+919811111111');
  const id=await save('session',{session:phoneSession,recovery:false},600,phoneSession.user.id);
  b.jar.set('kuro_m_session',id);
  assert.equal((await b.request('session',{},'GET')).body.user,null); assert.equal(b.jar.has('kuro_m_session'),false);
  const account=provider.user('phone-only@example.com'); account.email_confirmed_at=null;account.phone_confirmed_at=new Date().toISOString();
  assert.equal((await browser().request('login',{email:account.email,password:'reader-password-123'})).status,403);
});

test('verified email accounts retain login without exposing linked phone information', async () => {
  const account=provider.user('linked-email@example.com'); account.phone='+919822222222';account.phone_confirmed_at=new Date().toISOString();
  const result=await browser().request('login',{email:account.email,password:'reader-password-123'});
  assert.equal(result.status,200); assert.equal(result.body.user.emailVerified,true);
  assert.ok(!JSON.stringify(result.body).includes(account.phone));
});

test('recovery codes authorize a password update and revoke existing web sessions', async () => {
  const old = browser(), recovery = browser(), email = 'recovery@example.com';
  assert.equal((await old.request('login', { email, password: 'reader-password-123' })).status, 200);
  assert.equal((await recovery.request('recovery', { email })).status, 200);
  assert.equal((await recovery.request('verify', { code: '654321' })).body.recovery, true);
  assert.equal((await recovery.request('password', { password: 'changed-password-123' })).status, 200);
  assert.equal((await old.request('session', {}, 'GET')).body.user, null);
  assert.equal((await browser().request('login', { email, password: 'changed-password-123' })).status, 200);
});

test('verification stops after five incorrect codes', async () => {
  const b = browser();
  await b.request('otp', { address: 'attempts@example.com' });
  for (let n = 0; n < 5; n++) assert.equal((await b.request('verify', { code: '000000' })).status, 400);
  const result = await b.request('verify', { code: '654321' });
  assert.equal(result.status, 400); assert.match(result.body.error, /expired/i);
});

test('Google uses S256 PKCE and rejects wrong-browser and replayed callbacks', async () => {
  const b = browser(), start = await b.request('google');
  assert.equal(start.status, 200);
  const url = new URL(start.body.url);
  assert.equal(url.searchParams.get('provider'), 'google');
  assert.equal(url.searchParams.get('code_challenge_method'), 's256');
  assert.equal(url.searchParams.get('redirect_to'), 'http://localhost:8081/api/auth/callback');
  provider.setGoogleChallenge(url.searchParams.get('code_challenge'));
  assert.match((await browser().request('callback', {}, 'GET', 'code=fixture-google-code')).headers.Location, /oauth_failed/);
  assert.equal((await b.request('callback', {}, 'GET', 'code=fixture-google-code')).headers.Location, '/account');
  assert.equal((await b.request('session', {}, 'GET')).body.user.email, 'google@example.com');
  assert.match((await b.request('callback', {}, 'GET', 'code=fixture-google-code')).headers.Location, /oauth_failed/);
});

test('Google callback can finish in a different process using shared Redis state', { skip: !process.env.TEST_REDIS_URL }, async () => {
  const b = browser(), start = await b.request('google');
  provider.setGoogleChallenge(new URL(start.body.url).searchParams.get('code_challenge'));
  const child = spawn(process.execPath, [fileURLToPath(new URL('./helpers/route-worker.mjs', import.meta.url))], { env: process.env });
  child.stdin.end(JSON.stringify({ action: 'callback', method: 'GET', query: 'code=fixture-google-code', cookie: cookies(b.jar), ip: '198.51.100.50' }));
  const result = await new Promise((resolve, reject) => {
    let output = '', errors = ''; child.stdout.on('data', data => output += data); child.stderr.on('data', data => errors += data);
    child.on('error', reject); child.on('close', code => code === 0 ? resolve(JSON.parse(output)) : reject(new Error(errors)));
  });
  assert.equal(result.status, 303); assert.equal(result.headers.Location, '/account');
  mergeCookies(b.jar, result);
  assert.equal((await b.request('session', {}, 'GET')).body.user.email, 'google@example.com');
});

test('CSRF requests cannot create an authenticated session', async () => {
  const result = await invokeApi(handler, { action: 'login', origin: 'https://evil.example', body: { email: 'csrf@example.com', password: 'reader-password-123' }, ip: '198.51.100.51' });
  assert.equal(result.status, 403); assert.equal(result.headers['Set-Cookie'], undefined);
});

test('local sign-out clears cookies when provider revocation is unavailable', async () => {
  const b = browser(); await b.request('login', { email: 'logout@example.com', password: 'reader-password-123' });
  provider.setFailure(true);
  try { const result = await b.request('logout'); assert.equal(result.status, 200); assert.equal(b.jar.has('kuro_m_session'), false); }
  finally { provider.setFailure(false); }
});

test('local sign-out clears cookies during a Redis outage', { skip: !process.env.TEST_REDIS_URL }, async () => {
  const b = browser(); await b.request('login', { email: 'redislogout@example.com', password: 'reader-password-123' });
  redis.setFailure(true);
  try {
    const result = await b.request('logout');
    assert.equal(result.status, 200); assert.equal(b.jar.has('kuro_m_session'), false); assert.match(result.body.message, /remote/i);
  } finally { redis.setFailure(false); }
});

test('sign-out also cancels a pending Google flow', async () => {
  const b = browser(), start = await b.request('google');
  provider.setGoogleChallenge(new URL(start.body.url).searchParams.get('code_challenge'));
  const pendingCookie = cookies(b.jar);
  assert.equal((await b.request('logout')).status, 200);
  assert.equal(b.jar.has('kuro_m_flow'), false);
  const callback = await invokeApi(handler, { action: 'callback', method: 'GET', query: 'code=fixture-google-code', cookie: pendingCookie });
  assert.match(callback.headers.Location, /oauth_failed/);
});
