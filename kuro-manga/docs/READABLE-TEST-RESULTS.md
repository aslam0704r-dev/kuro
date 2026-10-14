# KURO 4.4.0 test results

Fresh verification on 14 October 2026, Node 22.23.3 and isolated Chromium browsers. Tests are local; this report does not claim live deployment or live Supabase account verification.

## Results

| Check | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| Full Node suite, dedicated real Redis | 205 | 0 | 0 |
| Strict content browser | 16 | 0 | 0 |
| Readable catalogue/reader browser | 6 | 0 | 0 |
| Email-only account browser | 4 | 0 | 0 |
| Device Library browser | 12 | 0 | 0 |
| Mobile artwork browser | 5 | 0 | 0 |
| Profile browser workflow | 13 | 0 | 0 |
| Profile interaction regressions | 3 | 0 | 0 |
| Native installation notice browser | 13 | 0 | 0 |
| Compact install toast browser | 10 | 0 | 0 |
| **Browser total** | **82** | **0** | **0** |

The catalogue-browser compatibility alias is the same strict-content suite and is not counted a second time.

`npm run build` passed: exported assets prepared, companion built, all **66 referenced resources** present, APK/EXE hashes, public certificate and Digital Asset Links validated. No dependencies were added or upgraded in this release. The original compiled Metro bundle retained its SHA256. Existing profile files, private avatar SQL and native binaries remain unchanged.

## Relevant regression coverage

- Phone/non-email channels and phone payloads are refused; old SMS challenges are cancelled in session/resend/verify; phone-only sessions are invalidated; verified email users retain login without phone disclosure.
- Email OTP, password login, signup verification, recovery, Google PKCE, HttpOnly cookies, CSRF and cross-process Redis auth behavior remain covered. Desktop/mobile show exactly password and email-code tabs; profile editing remains available.
- Corrupted middle pages cannot qualify. Pending validation publishes no tickets/count, resumes all pages, and publishes one proof only after every page passes. Stored page counts detect missing/duplicate manifest pages.
- Shared Redis processes see the same proof/count. Ordinary cache eviction does not erase the dedicated inventory. Expired proofs leave the count. Known failures cannot be revived by completed progress or cold-start seeds.
- The configured page-ticket key, deployment usage rules and scanlation opt-outs also constrain the readable count. A missing key or disabled reading produces zero with `readingConfigured:false`. Older seed proofs with unknown group provenance are withheld when opt-outs are configured.
- Complete-proof check time is authenticated in each reading ticket. A different newer chapter used for counting cannot block another valid chapter. Revoked, tampered and expired tickets fail.
- Compatible edition bridges merge regardless of order; conflicting work IDs and different numbered parts stay separate. Duplicate saved records are preserved while the Library displays one title group.
- Disabling the old optional readability preference cannot show unverified entries. A sample-only manifest cannot mount a reader or record history. The requested chapter is checked even when another chapter qualifies the title.
- Browser readiness expires at its server proof's expiry and rechecks. Cold setup returns a pending/preparing result within a 20-second whole-request deadline and resumes across later calls.
- Interrupted, rate-limited and server-timeout audit work stays pending; it is retried on resume. Chapter-specific restrictions try alternative chapters while a restricted parent remains blocked.
- Reviewed device imports, exact-byte checks, deletion, reversed-page editions, mobile artwork, profile name/photo operations, reduced motion and compact platform-aware installation notices retain their regression checks.

## Live public-data evidence

The separate live audit checked 100 candidates and fully fetched/decoded 2,134 pages in 72 qualifying chapters. It confirms 72 unique readable titles in that limited check window. See [the live audit report](READABLE-LIVE-AUDIT.md), the checkpoint and data/readable-audit.json.

## Limits

Account/private Storage checks used the controlled Supabase fixture, with SQL/RLS regression tests and dedicated real Redis. Actual Supabase RLS deployment, email delivery, Google consent, production Vercel behavior and native Android/Windows installation were not performed. The live manga check was a partial sweep, used provider rating/tag evidence, and did not visually review every image or check every chapter. Readability can change at a provider after validation.
