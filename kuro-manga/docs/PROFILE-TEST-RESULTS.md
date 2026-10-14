# KURO 3.9.0 profile regression results — 13 October 2026

The account implementation and motion module are unchanged from 3.8.0. This
release re-ran the profile suites alongside the new installers. The combined
native/profile report is NATIVE-INSTALL-TEST-RESULTS.md.

## Result

| Check | Result |
| --- | --- |
| Node 22.23.3 runtime suite with dedicated Redis 8.0.5 | 74 passed, 0 failed, 0 skipped; includes all 58 original account/profile cases |
| Original authentication, shared-store and HTTP/resource tests | 35 included in the runtime suite |
| Profile lifecycle, validation, authorization and failure-path tests | 22 included in the runtime suite |
| Executed Storage-policy migration test | 1 included in the runtime suite |
| Chromium profile browser suite | 13 checks passed; 0 uncaught page errors |
| Chromium motion/design suite | 11 checks passed across desktop, mobile and reduced-motion contexts |
| Profile interaction regressions | 3 passed: shared-cookie picture ownership, draft preservation and timeout feedback |
| Preserved PWA/account browser smoke | Passed: resources/fonts, install dialog and fallback, dismissal/re-entry, prompt handoff, mobile focus/Escape, standalone, offline navigation and Google UI handoff |
| Build/export resource validation | Passed; 46 referenced resources plus native release validation |
| Production dependency advisory check | npm audit found 0 reported vulnerabilities for installed production dependencies |
| Original compiled Expo bundle | SHA-256 identical to the KURO 3.6.2 baseline |
| Account/profile preservation comparison | All API/auth/profile/Storage files and profile JS/CSS are byte-identical to delivered 3.8.0; server/index.mjs adds native download and module MIME/attachment headers |

The source uses the real Supabase JS SDK 2.109.0 against a controlled local Auth and
Storage HTTP fixture. Profile mutations and the original shared-state cases use
the actual Redis driver and Lua operations through a local Upstash-compatible HTTP
fixture backed by Redis 8.0.5. No production Redis was contacted.

PGlite 0.5.9 executes the supplied SQL migration with fixture `auth.uid()` and
Storage schemas. The test applies it twice, checks bucket privacy/type/size values,
and verifies own-folder access, cross-user/anonymous denial, unsafe-path denial,
and protection alongside a pre-existing permissive policy. This executes RLS SQL;
it is not a live Supabase Storage policy or object-service test.

## Profile coverage

Version 3.8 adds a redesigned live reader-card editor, opening/closing motion,
avatar orbit/aura effects, pointer tilt, drag-and-drop, live name preview and save
feedback. The new motion suite asserts advancing transforms rather than relying
on static screenshots. It verifies that changing reduced-motion preferences stops
active effects without losing edits.

Three additional browser regressions failed before their fixes: a different account
could retain the first account's decoded picture, a picture action could overwrite
an unsaved name draft, and a request timeout could leave the feedback spinner
running. The fixes are verified with shared-context tabs and different photo colors,
actual upload/removal actions, and a held POST with a shortened browser deadline.

- Name persistence across new logins and the existing session response; invalid
  names, control characters and text that looks like markup.
- Signed-out and recovery-only access denial; origin and Fetch Metadata handling;
  owner-derived paths and wrong-account editor saves.
- Upload, replacement and removal; JPEG/PNG to WebP normalization; MIME/signature
  spoofing, SVG, truncated images, streamed/parsed/oversized bodies and dimensions.
- Validation and safe re-encoding on serving even after direct fixture Storage
  tampering; private no-store and nosniff responses.
- Provider/storage outages, definite rejection rollback, deletion metadata failure,
  commit-before-error reconciliation, unavailable reconciliation, and a delayed
  metadata commit after an error and follow-up read.
- Mutation limits and Vercel's parsed octet-stream binary-body shape.
- Real local UI/API integration, previews, name refresh in the existing compiled
  app, keyboard controls, mobile sizing, sign-out/account switching and stale GET
  responses arriving after a completed save.

The initial profile tests failed against missing routes/editor. The Vercel binary,
delete ordering, delayed write and stale browser snapshot regressions were observed
failing before their fixes, then passed. An independent read-only source review
identified the failure cases; their fixes are represented by these tests. A final
read-only recheck confirmed all identified findings resolved with no remaining
actionable finding in the reviewed profile changes. That review did not run tests;
the runtime/browser results above were executed separately.

## Reproduction

Use Node 22.x:

```powershell
npm ci --ignore-scripts
npm run build
$env:TEST_REDIS_URL = 'redis://127.0.0.1:16479'
npm test
```

Use a dedicated local Redis. With no `TEST_REDIS_URL`, the 12 shared Redis cases are
explicitly skipped and profile cases use development SQLite. Its Node experimental
warning applies only to that development backend.

For the profile UI use the local `tests/profile-server.mjs` and
`tests/profile-browser.py` instructions in PROFILE-SETUP.md. Playwright 1.62.0 was
used with headless Chromium. External manga feed traffic is excluded from browser
smoke checks. The profile actions use the real local KURO routes, not stubbed UI
responses, except the deliberate delayed-response regression.

## Unverified live behavior

These checks did not configure or contact the user's live Supabase/Vercel project.
Actual bucket creation, the complete live policy set, production Sharp packaging,
Google consent, email/SMS delivery and production Redis configuration remain to be
checked after deployment. No editable original Expo app source or native build was
available. The build validates the prebuilt web export and new account module.

Auth/Storage writes cannot be made atomic across the two services. Uncertain writes
and cleanup outages can leave unused private files. The server retains potentially
current images and documents administrator cleanup rather than deleting them on
an uncertain response.
