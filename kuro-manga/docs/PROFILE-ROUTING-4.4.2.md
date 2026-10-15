# KURO 4.4.2 — restore the deployed profile editor

Date: 15 October 2026. Repository: `aslam0704r-dev/kuro`, existing Vercel project: `kuro-manga`.

## Reported problem and cause

The live `/account` page included the editor JavaScript and stylesheet, but no **Edit profile** control appeared. The editor initializes only after an authenticated `GET /api/profile` succeeds.

Anonymous production probes reproduced the route failure before this patch:

| Public request | Before patch |
| --- | --- |
| `/api/profile` | 404, JSON `Not found` |
| `/api/profile/avatar` | 401, sign-in required |
| `/api/kuro?__route=/api/profile` | 401, sign-in required |
| `/profile-editor.js` | 200, JavaScript |

The wildcard `/api/profile/:kuroPath*` preceded the exact `/api/profile` rule. Its empty capture produced `/api/profile/` for the root endpoint. The handler correctly rejected this as an unknown endpoint. The local HTTP server bypasses Vercel rewrites, which explains why the earlier local editor checks did not catch this deployment difference.

## Correction

Move the exact `/api/profile` rewrite before the wildcard. The root endpoint now reaches the existing authenticated profile handler. Nested avatar requests keep their existing route. No authentication or storage checks are relaxed.

The animated editor, original compiled app, email/Google authentication, private avatar storage, content policy, catalogue and native installers retain their existing behavior. Version metadata is 4.4.2; native installer binaries remain 3.9.0.

## Fresh verification

- Two new tests execute the first matching profile-root rewrite through the real API handler and controlled Supabase fixture. Before the correction both failed with 404; afterward both passed. They cover the guest session guard and authenticated loading, saving and rereading a display name.
- Full Node suite with a dedicated real Redis instance: **214 passed, 0 failed, 0 skipped**.
- Profile browser flow: **13 checks passed**, including upload, replacement, removal, name persistence, XSS text rendering, sign-out, account separation and mobile sizing.
- Profile interaction regressions: **3 passed**, covering unsaved name preservation, shared-cookie account switching and interrupted saves.
- Profile design and motion: **11 checks passed**, including live preview, actual advancing animation, drag and drop, mobile layout and reduced motion.
- Email account browser flow: **4 passed**, including OTP sign-in and profile editor appearance after sign-in.
- Build passed: **66 referenced resources** and the existing APK/EXE integrity checks.

Total fresh browser checks: **31**. These use test accounts and a controlled private-storage fixture. The remaining browser suites were not rerun for this configuration-only correction. Node emitted its existing experimental SQLite warning; it did not fail the run.

Production deployment and anonymous smoke checks are recorded separately in `KURO-PUSH-DEPLOYMENT-4.4.2.json` after the push. The checks above do not establish live sign-in, photo storage/RLS configuration or installation on an actual device.

## Use the editor

1. Open `https://kuro-manga.vercel.app/account` and sign in.
2. Select **Edit profile** at the bottom right of the account screen.
3. Edit **Display name** and select **Save name**. For a photo, choose a JPEG, PNG or WebP image and select **Upload picture**. Choose another image to replace it, or select **Remove picture**.

After deployment, reload an already-open account page so its failed initialization is retried. Guest and password-recovery sessions remain unable to edit an account profile.

## Owner configuration

This correction needs **no new environment variable, private key or SQL migration**. It uses the existing Supabase setup. The avatar bucket and per-user policies from `supabase/migrations/202610120001_private_avatars.sql` must already be applied for photo upload to work. If they have not been applied, follow `PROFILE-SETUP.md`; this patch does not apply them to the live project.

The previously documented partial manga audit is unchanged. This patch neither rechecks the full catalogue nor renews expired readability proofs.

Routing reference: [Vercel rewrite configuration](https://vercel.com/docs/project-configuration/vercel-json#rewrites).
