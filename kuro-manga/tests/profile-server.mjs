// Local test server only: the fixture, mock keys, and controls are never deployed.
import { supabaseFixture } from './helpers/supabase-fixture.mjs';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const fixture = await supabaseFixture();
const port = process.env.PORT || '4181';
await mkdir('work', { recursive: true });
Object.assign(process.env, { AUTH_TEST_MODE: '1', SUPABASE_URL: fixture.url, SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture',
  PUBLIC_ORIGIN: 'http://127.0.0.1:' + port, PORT: port, AUTH_DB: 'work/profile-browser.sqlite', AUTH_ENCRYPTION_KEY: randomBytes(32).toString('base64') });
delete process.env.UPSTASH_REDIS_REST_URL; delete process.env.UPSTASH_REDIS_REST_TOKEN;
await writeFile('work/profile-input.png', await sharp({ create: { width: 512, height: 512, channels: 3, background: '#b79259' } }).png().toBuffer());
await writeFile('work/profile-input.jpg', await sharp({ create: { width: 512, height: 512, channels: 3, background: '#668885' } }).jpeg().toBuffer());
await import('../server/index.mjs');
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, async () => { await fixture.close(); process.exit(0); });
