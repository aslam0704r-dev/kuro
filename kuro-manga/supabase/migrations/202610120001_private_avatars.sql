-- KURO 3.7.0: run in your existing Supabase project's SQL editor.
-- Uses the user's JWT and existing Storage RLS; no service-role key is required.
BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kuro-avatars', 'kuro-avatars', false, 1048576, ARRAY['image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 1048576,
  allowed_mime_types = ARRAY['image/webp'];

DROP POLICY IF EXISTS kuro_avatar_owner_actions ON storage.objects;
CREATE POLICY kuro_avatar_owner_actions ON storage.objects
FOR ALL TO authenticated
USING (bucket_id = 'kuro-avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text)
WITH CHECK (bucket_id = 'kuro-avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

-- Restrictive policies are ANDed with permissive policies. This also protects
-- the avatar bucket when a pre-existing policy grants broad Storage access.
-- Other buckets continue to use their existing policies.
DROP POLICY IF EXISTS kuro_avatar_isolation ON storage.objects;
CREATE POLICY kuro_avatar_isolation ON storage.objects AS RESTRICTIVE
FOR ALL TO public
USING (bucket_id <> 'kuro-avatars' OR (
  name ~ '^[a-f0-9-]{36}/[a-f0-9]{48}\.webp$'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
))
WITH CHECK (bucket_id <> 'kuro-avatars' OR (
  name ~ '^[a-f0-9-]{36}/[a-f0-9]{48}\.webp$'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
));
COMMIT;
