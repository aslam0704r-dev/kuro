# KURO 4.3.0 test results

Date: 2026-10-14. Source: current 4.3.0 companion modules over the unchanged original export. Release checks ran against a fresh local fixture server at 4184 and isolated browser contexts.

## Results

| Check | Result | Evidence scope |
| --- | --- | --- |
| Complete Node suite | **182 passed, 0 failed, 0 skipped** | Includes real dedicated Redis fixtures, existing account/profile/storage/transport/parser checks and new content rules. |
| Strict content browser suite | **16 passed** | Startup failure, provider controls, direct-link metadata/cover spoofing, safe reader, preserved hidden Library/history, unreviewed imports, reviewed demo, second-snapshot race and mobile blocked page. |
| Device Library browser regressions | **12 passed** | Duplicate progress/status, reversed order, literal title text, adult-label rejection, cancellation, resize, no upload, two-tab bookmarks, delete and restore. |
| Mobile artwork regressions | **5 passed** | Approved full-resolution cover, neutral failure state, high-density/mobile scaling and original desktop component. |
| Profile browser checks | **13 passed** | Local API and Supabase/private-Storage fixtures; name/photo upload/replace/remove, text rendering, account separation and sign-out. |
| Profile interaction regressions | **3 passed** | Unsaved name retention, shared-cookie account switch and uncertain save timeout. |
| Native installer browser checks | **13 passed** | Correct APK/EXE downloads, metadata failure handling, supported device selection, hashes and reentry behavior. |
| Compact install notice checks | **10 passed** | Android/Windows selection, small rectangle, keyboard focus, dismissal, reader behavior and reduced motion. |
| Production build | **Passed** | 66 referenced public resources, original export hash and preserved native release hashes/certificate/assetlinks. |

**72 distinct browser checks passed.** `catalogue-browser.py` invokes the same strict fixture suite as `content-browser.py` and is counted once.

## Provider and content coverage

- Every one of the **1,236 registry entries** was classified against the supported positive rating contracts: 2 eligible, 1,213 restricted, 21 blocked.
- A server regression calls search/details/chapters/pages for **all 1,234 restricted/blocked entries** and confirms403 refusal with **zero upstream acquisitions**. This establishes enforcement coverage rather than live website availability.
- MangaDex policy cases include safe, suggestive, erotica, pornographic, adult, unknown, malformed/type-confused ratings, sexual tags, Unicode/invisible label variants and legitimate romance tags.
- AniList cases require exact non-adult Booleans, complete non-adult tag evidence and valid labels. Missing, malformed, adult and ecchi data are refused.
- Server cases cover forced safe-only queries, unsafe/unrated result removal, details/feeds/chapters/at-home/covers, canonical chapter relationships, browser-supplied safe flags, obsolete tickets, later rating changes and legacy proxy closure.
- The original three-page KURO demo was visually inspected in full. Its bytes, hashes, identity and both permitted page orders are exercised in import and reading. Arbitrary unreviewed bytes and forged stored hashes fail.

Earlier adapter/parser regressions remain unit checks of their formats. Those tests do not grant unsupported providers admission. Existing route/pacing fixtures now use positively rated MangaDex records. The readiness epoch race test isolates timing with an in-process verifier stub; production has no equivalent bypass setting.

## Reproduce

Use Node22.x. Run `npm ci --ignore-scripts`, `npm run build` and `npm test`. Provide a dedicated `TEST_REDIS_URL` for the shared-state tests to run without skips. Do not use a production Redis database for fixtures.

For browsers, run `PORT=4184 node tests/profile-server.mjs`, set `APP_URL=http://127.0.0.1:4184`, and execute the suites listed in tests/README.md with Python/Playwright and Pillow. Use fresh browser contexts; the fixture server supplies synthetic account/storage services.

## Limits

These tests establish implementation behavior with controlled metadata and files. They do not prove that every public provider rating is correct or every manga chapter is visually free of adult content. No universal external-page inspection, live Vercel deployment, live Supabase RLS/storage verification or native OS installation was performed. Approved public content depends on the supported upstream labels; quarantine mislabelled items using the deployment-owned denylist.

The original editable Expo source was unavailable. The immutable exported bundle and the existing profile/auth/native source are preserved. The full updated ZIP contains the maintained companion source, existing migration/storage policies, deployment instructions and current audit/review evidence.
