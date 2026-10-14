# Deploy KURO 3.9.0 profiles

For APK/EXE downloads, also follow NATIVE-INSTALL-SETUP.md. This release preserves
the existing 3.8 account editor and its Supabase profile/storage implementation.

**Upgrading from 3.7.0:** replace the complete package and redeploy. No new Supabase
migration, environment variable or private key is required. The avatar policies
and authentication settings are unchanged. Refresh `/account` to load the new UI.

## What this package adds

Open `/account`, sign in, and use the **Edit profile** card. You can save a display
name, preview/upload a picture, replace it, or remove it. The display name uses
the existing Supabase Auth `display_name` metadata. The avatar reference also
belongs to that authenticated Auth user. No new public profiles table is needed.

Pictures are account-private. Other users and signed-out visitors cannot retrieve
them through KURO. This release does not add public community profiles.

## 1. Apply the Storage migration

In the **same Supabase project your KURO login already uses**, open **SQL Editor**.
Copy the contents of:

`supabase/migrations/202610120001_private_avatars.sql`

Run it once. It can also be reapplied. It reserves a bucket named `kuro-avatars`,
sets it private, limits stored files to 1,048,576 bytes and `image/webp`, and creates
two policies on `storage.objects`: `kuro_avatar_owner_actions` and
`kuro_avatar_isolation`. The restrictive isolation policy protects this bucket
even if another existing policy grants broad Storage access. Existing policies
for other buckets retain their behavior.

If you already use a bucket named `kuro-avatars` for something else, review its
contents before applying this migration: the migration makes that bucket private
and narrows its upload settings. The inspected KURO baseline had no avatar bucket
or profile-photo code.

Confirm the result under **Storage → kuro-avatars**:

- Public bucket: **off**.
- File-size limit: **1 MiB** (1,048,576 bytes).
- Allowed MIME types: **image/webp**.
- The two named policies exist on `storage.objects`.
- Storage RLS is enabled, as in the normal Supabase Storage schema.

The app accepts JPEG, PNG and WebP inputs, decodes them and stores normalized WebP.
The bucket's WebP-only restriction applies to the stored result.

## 2. Keep the existing account settings

Your working login configuration stays in your server/Vercel environment:

| Setting | Required value |
| --- | --- |
| `SUPABASE_URL` | The existing standard HTTPS Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | The existing publishable key or legacy anon key |
| `PUBLIC_ORIGIN` | Exact public HTTPS origin used in the address bar |
| `AUTH_ENCRYPTION_KEY` | The existing private session-encryption key |
| `UPSTASH_REDIS_REST_URL` | Existing HTTPS REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Existing private full REST token |
| `AUTH_KEY_PREFIX` | Existing deployment-specific namespace |

No additional environment variable or service-role key is required. Keep private
values in the deployment settings. Do not put them in `dist/`, commit them, or send
them in chat. Preserve the current encryption key so existing sessions remain
readable. Existing Google/email configuration remains as described in
[VERCEL-DEPLOY.md](VERCEL-DEPLOY.md).

## 3. Deploy the complete package

Extract the ZIP. Its root contains `package.json`, `vercel.json`, `api/`, `server/`,
`dist/`, `scripts/`, `supabase/`, `docs/`, and `tests/`. Replace the project's files
with this complete package so the new API routes, rewrite rules and UI assets all
arrive together. Use the existing KURO deployment/project.

| Vercel field | Setting |
| --- | --- |
| Framework | Other |
| Root Directory | Folder containing `vercel.json`; preferably the repository root |
| Node.js | 22.x |
| Install | `npm ci --ignore-scripts` |
| Build | `npm run build` |
| Output | `dist` |

Avoid a repository wrapper folder containing spaces, such as `kuro manga`, because
it can produce invalid function names. Keep optional npm dependencies enabled;
Sharp uses a platform-specific binary. Do not install a Windows `node_modules`
folder into the Linux deployment. Let Vercel run the lockfile installation there.

Redeploy after changing project files. Refresh `/account` on the exact
`PUBLIC_ORIGIN`. A stable origin is needed for the existing cookie and CSRF checks.

## 4. Check your deployed app

1. Sign in with an account you control and open **Edit profile**.
2. Save a name, close the editor, then sign out and sign in again. Confirm it persists.
3. Upload a static JPEG, PNG or WebP no larger than 1 MiB and 4096 × 4096 pixels.
4. Replace it, reload, then remove it. Check the current file in your own Storage
   folder is removed during a successful removal/replacement.
5. Sign in as a second account in a separate browser profile. Confirm it starts
   with its own profile. A signed-out request to `/api/profile/avatar` must return 401.
6. Try an unsupported image format and a file larger than 1 MiB. Both should fail.
7. Recheck the account methods you use, the install popup on the home screen and
   basic manga navigation after deployment.

This is the required live check. Local tests did not apply your migration or access
your live Supabase, Redis, Google, email provider, or Vercel deployment.

## Errors and cleanup

| Symptom | Action |
| --- | --- |
| Picture upload says Storage unavailable | Confirm the migration was run in the same project as `SUPABASE_URL`; check bucket privacy/settings/policies and Storage availability |
| 403 on a write | Confirm the exact `PUBLIC_ORIGIN` matches the browser; complete recovery and sign in normally |
| 409 after an account change | Reload the account page before saving |
| 429 | Wait 15 minutes; new mutations are limited to 20 per account per 15 minutes, including at most 10 picture uploads |
| Invalid/damaged image | Use a static JPEG/PNG/WebP with the stated byte and dimension limits |
| New UI absent | Confirm `profile-editor.js` and `.css` deployed, `index.html` is current, and refresh the page |
| Picture cleanup warning | The profile change succeeded but deletion of an old private file failed. Review unused files in the Storage dashboard |

Storage and Auth updates are separate remote operations. The server preserves a
potentially committed picture when a write's result is uncertain, and reconciles
it when a verified read succeeds. Outages can leave unused private files. After
service recovery, allow the pending write to settle and reload the account before retrying. An administrator can compare
each user's `raw_user_meta_data.avatar_path` with files in that UID folder and use
the **Storage API or dashboard** to remove unused objects. Do not delete rows from
`storage.objects` directly: that would not delete the backing files.

## Local development and tests

Use Node 22.13+ in the 22.x line. Install with `npm ci --ignore-scripts`, then run
`npm run build`. Use a private `.env.server` for the existing account configuration;
the example file contains setting names only. `npm start` runs the local server.

`npm test` uses a controlled local Supabase fixture and PGlite SQL tests. With no
`TEST_REDIS_URL`, shared Redis cases are explicitly skipped. To run those cases,
start a dedicated local Redis, set `TEST_REDIS_URL=redis://127.0.0.1:PORT`, and run
`npm test`. Test prefixes are unique; only their own keys are removed.

For profile browser checks install Playwright, start `node tests/profile-server.mjs`
in one terminal, and run `python tests/profile-browser.py` in another. This starts
only a local fixture server on port 4181; it has no production credentials.
Use `python tests/browser-smoke.py` with `APP_URL=http://127.0.0.1:4181` for the
preserved PWA/account smoke. See [tests/README.md](tests/README.md).

## Source limitation

The provided baseline contained the editable Node server and a compiled Expo web
export, without React/Expo screen source or source maps. This ZIP includes all of
that release plus editable source for the new profile feature. It cannot rebuild
the original Expo screens or produce a native APK. The unchanged compiled bundle
preserves the existing reading UI; the separate profile editor is scoped to
`/account` and maintained in `dist/profile-editor.js` and `.css`.
