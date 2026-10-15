# KURO 4.4.2 profile routing review

**Result: scoped clean review. No blocking or actionable findings.**

Reviewed the uncommitted follow-up in `C:/Users/Aslam/Documents/Codex/KURO-Update-4.4/kuro-manga` against base `ee17e59048a0ded16172856a2d1e6de223b54822` on 15 October 2026. Scope: `vercel.json`, package/version metadata, the two new profile regressions, their request helper change, `docs/PROFILE-ROUTING-4.4.2.md`, and the `/work/` ignore rule. This review is limited to restoring profile visibility and the existing profile flows.

## Findings

None in the reviewed changes.

- `vercel.json:28` places the exact `/api/profile` rule before the wildcard. It produces the canonical `/api/profile` handler path for the root request, avoiding the empty wildcard capture's `/api/profile/` destination.
- The nested `/api/profile/:kuroPath*` destination is preserved at `vercel.json:32`; moving the exact root rule does not change the avatar path or broaden its scope. Catalogue, authentication, proxy, static fallback, function settings, and response-header definitions are unchanged by this patch.
- `tests/profile.test.mjs:44` selects the first of the actual configured profile rewrite rules and models the observed empty-capture expansion. Both new tests invoke the real API handler, with controlled Supabase authentication, rather than directly invoking the profile service. They cover the guest session guard and authenticated loading, saving, and rereading of the same account's display name.
- The optional `requestUrl` override at `tests/helpers/invoke-profile.mjs:4` changes only the test request target. The existing default target, cookies, origins, method, headers, body, and response handling remain available to the existing tests.
- The profile handler's canonical-path whitelist, verified-session requirement, recovery restriction, mutation origin checks, account binding, and private avatar handling are preserved. No production authentication or storage check is relaxed by this configuration change.
- Package and lockfile root versions consistently change from 4.4.1 to 4.4.2, without dependency changes. The app's native release version remains 3.9.0.
- The `/work/` addition is confined to generated artifacts within the app checkout. Existing private-data, environment-file, database, and signing-file ignore rules remain present.
- The release note accurately separates fixture/browser verification from production sign-in, live avatar storage/RLS, device installation, and the earlier partial catalogue audit. Its reported full-suite/browser/build results were supplied by the implementer; this reviewer independently ran only the focused checks below.

## Independent execution

Executed the existing test file with the bundled Node 22 runtime and a test-name filter. All **6 selected tests passed, 0 failed**, including both new deployed-profile regressions:

1. Deployed profile root reaches the session guard rather than a missing route.
2. Deployed profile root loads and saves the authenticated account.
3. Profile requests require a verified KURO session.
4. Cross-origin and missing-origin profile mutations are rejected.
5. Recovery-only sessions cannot read or edit normal profile data.
6. Upload, replacement and removal persist and keep photos owner-authenticated.

The independent run used the controlled Supabase fixture and freshly generated temporary test authentication storage; `TEST_REDIS_URL` was disabled for this run. No private environment file, user session database, or credential was inspected. The existing SQLite experimental warning did not fail execution.

## Scope limits

These tests model the Vercel rewrite shape reported in the pre-fix production evidence; they do not execute Vercel's hosted router locally. The reviewer did not deploy this patch or independently perform a new production probe or live authenticated profile/photo test. The implementer reported a separate full suite with dedicated Redis (214 passed), 31 fresh fixture browser checks, and a passing build/native integrity check. Those broader runs were not independently repeated here.

No implementation source was mutated during this review. This report is the reviewer's only new artifact for this follow-up.
