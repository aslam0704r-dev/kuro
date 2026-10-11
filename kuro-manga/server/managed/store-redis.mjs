import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

const SAVE = [
  "local old = redis.call('GET', KEYS[1])",
  "if ARGV[5] == '1' and not old then return 0 end",
  "redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', ARGV[1])",
  "if not old and redis.call('ZCARD', KEYS[2]) >= 20000 then return -1 end",
  "if old then local ok,row = pcall(cjson.decode,old); if ok and row.user ~= '' then redis.call('ZREM',ARGV[6]..':user:'..row.user,KEYS[1]) end end",
  "redis.call('SET', KEYS[1], ARGV[2], 'PX', ARGV[3])",
  "redis.call('ZADD', KEYS[2], ARGV[4], KEYS[1])",
  "if KEYS[3] ~= KEYS[2] then",
  " redis.call('ZREMRANGEBYSCORE', KEYS[3], '-inf', ARGV[1])",
  " redis.call('ZADD', KEYS[3], ARGV[4], KEYS[1]); redis.call('PEXPIRE', KEYS[3], 604800000)",
  "end",
  "return 1",
].join('\n');
const REMOVE = [
  "local old = redis.call('GET', KEYS[1])",
  "if old then local ok,row = pcall(cjson.decode,old); if ok and row.user ~= '' then redis.call('ZREM',ARGV[1]..':user:'..row.user,KEYS[1]) end end",
  "redis.call('ZREM', KEYS[2], KEYS[1]); return redis.call('DEL', KEYS[1])",
].join('\n');
const REMOVE_USER = [
  "local entries = redis.call('ZRANGE', KEYS[1], 0, -1)",
  "for _,key in ipairs(entries) do",
  " local old = redis.call('GET',key)",
  " if old then local ok,row = pcall(cjson.decode,old); if ok and row.user == ARGV[1] then redis.call('DEL',key); redis.call('ZREM',KEYS[2],key) end end",
  "end",
  "return redis.call('DEL', KEYS[1])",
].join('\n');
const LIMIT = [
  "redis.call('ZREMRANGEBYSCORE', KEYS[2], '-inf', ARGV[1])",
  "if redis.call('EXISTS',KEYS[1]) == 0 and redis.call('ZCARD',KEYS[2]) >= 10000 then return tonumber(ARGV[3])+1 end",
  "local count = redis.call('INCR', KEYS[1])",
  "if count == 1 then redis.call('PEXPIRE',KEYS[1],ARGV[2]); redis.call('ZADD',KEYS[2],tonumber(ARGV[1])+tonumber(ARGV[2]),KEYS[1]) end",
  "return count",
].join('\n');
const RELEASE = "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end";
const READ = [
  "local value = redis.call('GET', KEYS[1])",
  "if value then local ttl = redis.call('PTTL',KEYS[1]); if ttl > 0 then redis.call('PEXPIRE',KEYS[1],ttl) end end",
  "return value",
].join('\n');
function unavailable() { return Object.assign(new Error('Account storage temporarily unavailable. Please retry.'), { status: 503 }); }

export function createRedisStore(url, token, prefix) {
  async function command(values) {
    try {
      const response = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(values), signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (data.error || !Object.hasOwn(data, 'result')) throw new Error();
      return data.result;
    } catch { throw unavailable(); }
  }
  const records = prefix + ':records';
  const recordKey = id => prefix + ':record:' + id;
  const userKey = user => prefix + ':user:' + user;
  const evalScript = (script, keys, args = []) => command(['EVAL', script, keys.length, ...keys, ...args]);
  return {
    async read(id) {
      // A write-capable EVAL reaches the primary instead of an eventually consistent read replica.
      // Reapplying its existing TTL does not extend the authenticated envelope's expiry.
      const value = await evalScript(READ, [recordKey(id)]);
      if (value === null) return null;
      try { return JSON.parse(value); } catch { throw unavailable(); }
    },
    save(id, record, update) {
      const ttl = Math.max(1, record.expires - Date.now());
      return evalScript(SAVE, [recordKey(id), records, record.user ? userKey(record.user) : records],
        [Date.now(), JSON.stringify(record), ttl, record.expires, update ? '1' : '0', prefix]);
    },
    remove(id) { return evalScript(REMOVE, [recordKey(id), records], [prefix]); },
    removeUser(user) { return evalScript(REMOVE_USER, [userKey(user), records], [user]); },
    async limited(id, max, seconds) {
      const count = await evalScript(LIMIT, [prefix + ':limit:' + id, prefix + ':limits'], [Date.now(), seconds * 1000, max]);
      return count > max;
    },
    async serialize(id, task) {
      const key = prefix + ':lock:' + id, value = randomBytes(24).toString('hex');
      let acquired = false;
      // The lease outlasts the configured 30-second Vercel invocation. Never retry writes.
      for (let attempt = 0; attempt < 6; attempt++) {
        acquired = await command(['SET', key, value, 'NX', 'PX', 60000]) === 'OK';
        if (acquired) break;
        await delay(150 * (attempt + 1));
      }
      if (!acquired) throw unavailable();
      try { return await task(); }
      finally { await evalScript(RELEASE, [key], [value]).catch(() => {}); }
    },
  };
}
