import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function inspect(extra = {}, mode = 'config') {
  const directory = mkdtempSync(path.join(root, 'tests/.config-'));
  const env = { ...process.env, NODE_ENV: 'production', AUTH_DB: path.join(directory, 'managed.sqlite') };
  for (const key of ['VERCEL', 'SUPABASE_URL', 'SUPABASE_PUBLISHABLE_KEY', 'PUBLIC_ORIGIN',
    'AUTH_ENCRYPTION_KEY', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'AUTH_TEST_MODE']) delete env[key];
  Object.assign(env, extra);
  const code = mode === 'config'
    ? 'const m=await import("./server/managed/config.mjs"); console.log(JSON.stringify({configured:m.configured}));'
    : 'const m=await import("./server/auth/routes.mjs"); const req={method:"GET",headers:{host:"localhost"},socket:{remoteAddress:"127.0.0.1"}};' +
      'const res={headers:{},setHeader(k,v){this.headers[k]=v},getHeader(k){return this.headers[k]},writeHead(s,h){this.status=s;Object.assign(this.headers,h)},end(b){this.body=JSON.parse(b)}};' +
      'await m.authRoute(req,res,new URL("https://kuro.example/api/auth/session"));console.log(JSON.stringify({status:res.status,...res.body}));';
  const result = spawnSync(process.execPath, ['--input-type=module', '-e',
    'try{' + code + '}catch{console.log(JSON.stringify({initializationFailed:true}))}'], { cwd: root, env, encoding: 'utf8' });
  rmSync(directory, { recursive: true, force: true });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout.trim());
}

test('unconfigured production auth leaves guest endpoints usable without opening SQLite', () => {
  const result = inspect({ VERCEL: '1' }, 'session');
  assert.equal(result.initializationFailed, undefined);
  assert.equal(result.status, 200);
  assert.equal(result.configured, false);
  assert.equal(result.user, null);
});

test('privileged Supabase credentials disable authentication without an import crash', () => {
  const result = inspect({ SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_secret_fixture',
    PUBLIC_ORIGIN: 'https://kuro.example' });
  assert.deepEqual(result, { configured: false });
});

test('test-only HTTP provider transport cannot enable production auth', () => {
  assert.deepEqual(inspect({ SUPABASE_URL: 'http://127.0.0.1:1234', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture',
    PUBLIC_ORIGIN: 'https://kuro.example', AUTH_TEST_MODE: '1' }), { configured: false });
});

test('Vercel auth stays disabled when Supabase is set but shared state is missing', () => {
  const result = inspect({ VERCEL: '1', SUPABASE_URL: 'https://fixture.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture', PUBLIC_ORIGIN: 'https://kuro.example',
    AUTH_ENCRYPTION_KEY: randomBytes(32).toString('base64') }, 'session');
  assert.equal(result.initializationFailed, undefined);
  assert.equal(result.configured, false);
  assert.equal(result.user, null);
});
