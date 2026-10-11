import { DatabaseSync } from 'node:sqlite';
import { chmodSync } from 'node:fs';

export function createSQLiteStore(file) {
  const db = new DatabaseSync(file); chmodSync(file, 0o600);
  db.exec('PRAGMA journal_mode=WAL;' +
    'CREATE TABLE IF NOT EXISTS managed_sessions (id TEXT PRIMARY KEY, kind TEXT, data TEXT, expires INTEGER, user_id TEXT);' +
    'CREATE TABLE IF NOT EXISTS managed_limits (id TEXT PRIMARY KEY, hits INTEGER, expires INTEGER);');
  const locks = new Map();
  return {
    read(id) {
      const row = db.prepare('SELECT * FROM managed_sessions WHERE id = ? AND expires > ?').get(id, Date.now());
      return row ? { kind: row.kind, data: row.data, expires: row.expires, user: row.user_id } : null;
    },
    save(id, record, update) {
      db.prepare('DELETE FROM managed_sessions WHERE expires <= ?').run(Date.now());
      if (update && !db.prepare('SELECT 1 FROM managed_sessions WHERE id = ?').get(id)) return 0;
      if (!update && db.prepare('SELECT count(*) AS n FROM managed_sessions').get().n >= 20000) return -1;
      db.prepare('INSERT OR REPLACE INTO managed_sessions VALUES (?, ?, ?, ?, ?)').run(id, record.kind, record.data, record.expires, record.user);
      return 1;
    },
    remove(id) { db.prepare('DELETE FROM managed_sessions WHERE id = ?').run(id); },
    removeUser(user) { db.prepare('DELETE FROM managed_sessions WHERE user_id = ?').run(user); },
    limited(id, max, seconds) {
      const now = Date.now(); db.prepare('DELETE FROM managed_limits WHERE expires <= ?').run(now);
      const old = db.prepare('SELECT hits FROM managed_limits WHERE id = ?').get(id);
      if (!old && db.prepare('SELECT count(*) AS n FROM managed_limits').get().n >= 10000) return true;
      if (old) db.prepare('UPDATE managed_limits SET hits = hits + 1 WHERE id = ?').run(id);
      else db.prepare('INSERT INTO managed_limits VALUES (?, 1, ?)').run(id, now + seconds * 1000);
      return (old?.hits || 0) >= max;
    },
    async serialize(id, task) {
      const previous = locks.get(id) || Promise.resolve();
      const next = previous.catch(() => undefined).then(task); locks.set(id, next);
      try { return await next; } finally { if (locks.get(id) === next) locks.delete(id); }
    },
  };
}
