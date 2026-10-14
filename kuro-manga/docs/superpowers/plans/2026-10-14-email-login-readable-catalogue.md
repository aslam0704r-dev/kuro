# Email login and readable catalogue implementation plan

> **For agentic workers:** Use executing-plans for inline implementation in this session. The user's implementation request authorizes continuing without another design approval.

**Goal:** Remove phone login and admit/count only unique manga with one completely checked chapter.

**Architecture:** Keep the original Metro export unchanged and extend its existing startup bootstrap. Managed server authentication becomes email-only. Server-owned chapter validation progress and a shared readable ledger provide a common qualification rule for cards, reader manifests and counts.

**Tech stack:** Node 22 ESM, existing Supabase managed auth, Redis REST/local in-memory coordinator, Sharp, React/Metro bootstrap, Node tests and isolated Playwright.

**Spec:** `../specs/2026-10-14-email-login-readable-catalogue.md`

## Global constraints

- Preserve email password, email verification/recovery, Google, profile, native install, device import and strict adult-content restrictions.
- Original Metro bundle SHA256 remains `4ca7ae590a4065290203fe34e743fcb9e08253d93026aeee7a5bf25efd8b4e07`.
- Never request/read signing keys, service keys or the user's actual environment secrets.
- Exact count qualifies at least one complete chapter; candidate totals and page samples do not qualify.
- No live deployment or global provider audit claim without evidence.

## Review focus

- Old SMS cookies cannot resume, resend, verify or expose phone information.
- A missing/corrupted middle page never yields reading tickets or a count increment.
- Interrupted validation and concurrent workers do not invent completion or lose shared inventory.
- Related editions merge while different sequels and conflicting authority IDs stay separate.
- Previously disabled Ready to read preferences cannot show unverified catalogue-only entries.

### Task 1: Email-only login

**Files:** `server/managed/{challenges,http,provider,config}.mjs`, `server/auth/routes.mjs`, new `client/email-auth.mjs`, `client/catalogue-core.mjs`, `tests/auth.test.mjs`, new browser regression.

- [x] Replace the positive SMS test with rejection tests: `assert.equal((await b.request('otp',{channel:'sms',address:'+919876543210'})).status,400)`; seed an old server challenge and prove verify/resend/session cleanup. Run before implementation and confirm failure.
- [x] Explicitly reject `input.phone` and non-email channel values; remove SMS provider calls and maskers. Require `email_confirmed_at` in both establish/current. Keep verified email accounts usable.
- [x] Replace module 1700 CredentialForm with the existing reusable AuthField/AuthButton styles and email/Google actions; replace 1703/1697 static phone copy before startup. Keep the auth store/actions unchanged.
- [x] Run auth tests and phone-free browser flows; confirm email OTP/recovery and Google tests still pass.

### Task 2: Complete chapter proof and shared inventory

**Files:** `server/catalogue/service.mjs`, new `server/catalogue/readable.mjs`, `server/catalogue/cache.mjs`, `server/catalogue/routes.mjs`, `server/catalogue/content.mjs`, `dist/catalogue-model.mjs`, new `tests/readable.test.mjs`.

- [x] Write red tests with three-page manifests whose middle image fails, long manifests requiring multiple bounded requests, duplicate editions and separate parts. Assert partial validation returns no tickets and `verified:false`.
- [x] Add bounded image validation progress keyed by manifest digest; only all-page completion returns `verified:true`, `validation:'complete-chapter'`, `validatedPages===pageCount`, timestamps and tickets.
- [x] Keep persistent readable ledger buckets outside the ordinary small upstream cache. Count `groupSeries(validProofRows,true).length`, pruning expiry and denylist entries. Expose `/api/catalogue/readable/count` with scope/window/timestamps.
- [x] Carry provider edition relationships into canonical identity keys and use indexed grouping that preserves existing conflict/part rules.
- [x] Run targeted service/cache/route tests including shared Redis evidence.

### Task 3: Mandatory collection and reader checks

**Files:** `client/catalogue-core.mjs`, `client/content-runtime.mjs`, `dist/catalogue-bridge.js`, browser fixtures/regressions.

- [x] Write red tests where `active=false` and metadata-only rows are supplied; the returned collection must still be empty until full proof.
- [x] Repeat bounded pending-manifest requests until complete. Check alternative chapters after an individual page failure. Force all useReadyCollection call sites to enforce checks and always group editions.
- [x] Add a compact verified-count label with its meaning/check window. Keep desktop styling, mobile artwork and local import UX intact.
- [x] Run isolated desktop/mobile/library/account/reader tests against controlled fixtures.

### Task 4: Resumable live audit and release

**Files:** new `scripts/audit-readable.mjs`, audit evidence, `README`/release guides, package/version/manifest, ZIP packaging helper.

- [x] Audit public candidate metadata and at least one complete chapter per qualified title with bounded concurrency, rate limits and checkpointed progress. Store page evidence hashes/counts/check time and exact qualified identity groups; label partial sweep clearly.
- [x] Build, run the full requested regression suite, obtain independent scoped review and repair findings.
- [x] Package all 4.3 source plus changes; preserve native binaries and original export, exclude environments, databases and private signing files. Validate ZIP and checksums.
- [x] Report exact verified scope/count, broader unaudited candidates, tests, setup and the phone provider dashboard action the owner must perform.

## Release evidence

Implemented and locally verified for 4.4.0. The public audit checked 100 candidates and confirmed 72 unique readable titles; a complete provider sweep was not performed. The full source archive preserves all files from 4.3.0 and the protected original export, profile and native files. Fresh results: 205 Node tests, 82 browser checks and the build passed. Setup, audit scope, test results and independent review are included with the ZIP.
