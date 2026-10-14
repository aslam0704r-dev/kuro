import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
const a = '11111111-1111-4111-8111-111111111111', b = '22222222-2222-4222-8222-222222222222';
const key = id => id + '/' + 'a'.repeat(48) + '.webp';
test('migration enforces owner-only access even alongside an existing permissive policy', async () => {
  const db = new PGlite();
  try {
    await db.exec("CREATE SCHEMA auth; CREATE SCHEMA storage; CREATE ROLE authenticated; CREATE ROLE anon; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$; CREATE FUNCTION storage.foldername(text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$ SELECT string_to_array($1,'/') $$; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE TABLE storage.objects(id int GENERATED ALWAYS AS IDENTITY,bucket_id text,name text); ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; GRANT USAGE ON SCHEMA auth,storage TO authenticated,anon; GRANT SELECT,INSERT,UPDATE,DELETE ON storage.objects TO authenticated,anon; GRANT USAGE ON SEQUENCE storage.objects_id_seq TO authenticated,anon; CREATE POLICY old_broad_policy ON storage.objects FOR ALL TO public USING(true) WITH CHECK(true);");
    const sql = await readFile(new URL('../supabase/migrations/202610120001_private_avatars.sql', import.meta.url), 'utf8');
    await db.exec(sql); await db.exec(sql);
    const bucket = (await db.query("SELECT public,file_size_limit,allowed_mime_types FROM storage.buckets WHERE id='kuro-avatars'")).rows[0];
    assert.equal(bucket.public, false); assert.equal(Number(bucket.file_size_limit), 1048576); assert.deepEqual(bucket.allowed_mime_types, ['image/webp']);
    await db.exec("SET ROLE authenticated; SET request.jwt.claim.sub = '" + a + "';");
    await db.query('INSERT INTO storage.objects(bucket_id,name) VALUES ($1,$2)', ['kuro-avatars', key(a)]);
    await assert.rejects(db.query('INSERT INTO storage.objects(bucket_id,name) VALUES ($1,$2)', ['kuro-avatars', key(b)]), /row-level security/);
    await assert.rejects(db.query('INSERT INTO storage.objects(bucket_id,name) VALUES ($1,$2)', ['kuro-avatars', a + '/unsafe.svg']), /row-level security/);
    assert.equal((await db.query("SELECT * FROM storage.objects WHERE bucket_id='kuro-avatars'")).rows.length, 1);
    await db.exec("SET request.jwt.claim.sub = '" + b + "';");
    assert.equal((await db.query("SELECT * FROM storage.objects WHERE bucket_id='kuro-avatars'")).rows.length, 0);
    assert.equal((await db.query("DELETE FROM storage.objects WHERE bucket_id='kuro-avatars' RETURNING *")).rows.length, 0);
    await db.exec("RESET ROLE; SET ROLE anon; SET request.jwt.claim.sub = '';");
    assert.equal((await db.query("SELECT * FROM storage.objects WHERE bucket_id='kuro-avatars'")).rows.length, 0);
    await assert.rejects(db.query('INSERT INTO storage.objects(bucket_id,name) VALUES ($1,$2)', ['kuro-avatars', key(a)]), /row-level security/);
    await db.exec("RESET ROLE; SET ROLE authenticated; SET request.jwt.claim.sub = '" + a + "';");
    assert.equal((await db.query("DELETE FROM storage.objects WHERE bucket_id='kuro-avatars' RETURNING *")).rows.length, 1);
    await db.query('INSERT INTO storage.objects(bucket_id,name) VALUES ($1,$2)', ['other-existing-bucket', 'ordinary-file']);
    assert.equal((await db.query("SELECT * FROM storage.objects WHERE bucket_id='other-existing-bucket'")).rows.length, 1);
  } finally { await db.close(); }
});
