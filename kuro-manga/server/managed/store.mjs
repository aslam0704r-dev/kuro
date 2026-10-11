import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { production } from './config.mjs';
import { digest, createSealer } from './store-crypto.mjs';
export { digest } from './store-crypto.mjs';

const restUrl = process.env.UPSTASH_REDIS_REST_URL || '';
const restToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const remote = !!restUrl || !!restToken;
const prefix = process.env.AUTH_KEY_PREFIX || 'kuro:managed:v1';
const file = path.resolve(process.env.AUTH_DB || 'private-data/managed.sqlite');
const encodedKey = process.env.AUTH_ENCRYPTION_KEY || '';
const key = encodedKey ? Buffer.from(encodedKey, 'base64') : null;
function issue() {
  if (!/^[a-zA-Z0-9:_-]{1,64}$/.test(prefix)) return 'Configure a valid AUTH_KEY_PREFIX for account storage.';
  if (encodedKey && (key.length !== 32 || key.toString('base64') !== encodedKey)) return 'AUTH_ENCRYPTION_KEY must be 32 random bytes encoded as base64.';
  if (production && !key) return 'Configure AUTH_ENCRYPTION_KEY on the production server.';
  if (production && !remote) return 'Configure Upstash Redis for production authentication. Local SQLite is for development.';
  if (remote) {
    if (!restUrl || !restToken || !key) return 'Configure the Upstash REST URL/token and AUTH_ENCRYPTION_KEY on the server.';
    try {
      const endpoint = new URL(restUrl);
      const testTransport = !production && process.env.AUTH_TEST_MODE === '1' && endpoint.protocol === 'http:' && endpoint.hostname === '127.0.0.1';
      if ((!testTransport && (endpoint.protocol !== 'https:' || !/^[a-z0-9-]+\.upstash\.io$/.test(endpoint.hostname))) ||
        endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/') throw new Error();
    } catch { return 'Configure a valid HTTPS Upstash Redis REST endpoint.'; }
  }
  return '';
}
export const storageIssue = issue();
let initialized;
async function storage() {
  if (storageIssue) throw Object.assign(new Error(storageIssue), { status: 503 });
  if (!initialized) initialized = (async () => {
    let secret = key, driver;
    if (remote) {
      const { createRedisStore } = await import('./store-redis.mjs');
      driver = createRedisStore(restUrl, restToken, prefix);
    } else {
      mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
      if (!secret) {
        const keyFile = path.join(path.dirname(file), 'managed.key');
        try { secret = readFileSync(keyFile); }
        catch { secret = randomBytes(32); writeFileSync(keyFile, secret, { mode: 0o600, flag: 'wx' }); }
      }
      if (secret.length !== 32) throw new Error('Invalid local encryption key');
      const { createSQLiteStore } = await import('./store-sqlite.mjs'); driver = createSQLiteStore(file);
    }
    return { driver, ...createSealer(secret) };
  })().catch(() => { initialized = null; throw Object.assign(new Error('Account storage temporarily unavailable. Please retry.'), { status: 503 }); });
  return initialized;
}
const validId = id => /^[a-f0-9]{64}$/.test(id || '');
const context = (id, row) => JSON.stringify([digest(id), row.kind, row.expires, row.user]);
export async function read(id, kind) {
  if (!validId(id)) return null;
  const store = await storage(), row = await store.driver.read(digest(id));
  if (!row || row.kind !== kind || row.expires <= Date.now()) return null;
  try { return { ...store.open(row.data, context(id, row)), expires: row.expires }; }
  catch { await remove(id); return null; }
}
export async function save(kind, value, seconds, user = '', id) {
  if (!['flow', 'session', 'challenge'].includes(kind) || !Number.isFinite(seconds) || seconds <= 0 || seconds > 604800) throw new Error('Invalid session storage request');
  const update = id !== undefined; id ||= randomBytes(32).toString('hex');
  if (!validId(id) || Buffer.byteLength(JSON.stringify(value)) > 65536) throw new Error('Invalid session storage request');
  const store = await storage();
  const record = { kind, expires: Date.now() + Math.ceil(seconds * 1000), user: user ? digest(user) : '' };
  record.data = store.seal(value, context(id, record));
  const result = await store.driver.save(digest(id), record, update);
  if (result === -1) throw Object.assign(new Error('Account storage is at capacity. Please try later.'), { status: 503 });
  return result ? id : null;
}
export async function remove(id) { if (validId(id)) await (await storage()).driver.remove(digest(id)); }
export async function removeUser(user) { if (user) await (await storage()).driver.removeUser(digest(user)); }
export async function limited(key, max, seconds) { return (await storage()).driver.limited(digest(key), max, seconds); }
export async function serialize(id, task) { return (await storage()).driver.serialize(digest(id), task); }
