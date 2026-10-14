# KURO 4.4.0: email login and readable catalogue

## What changed

- Phone/SMS tabs, phone inputs and phone account copy were removed through KURO's existing startup companion. The immutable Metro bundle remains unchanged.
- The managed server rejects non-email OTP channels and phone payloads. Old SMS challenges are cancelled in session, resend and verification paths. Email password, email codes, recovery and Google retain their original managed session flow.
- New and existing sessions require a Supabase-verified email. Public account responses omit phone numbers. Existing users and data are not deleted. Phone-only users must have an email linked and verified before signing in again.
- A remote chapter receives reading tickets only after **every page** passes MIME, file signature, file size, dimensions and full decoding checks. Two images per bounded request allow long chapters to resume. Cold setup returns a pending state within a 20-second request deadline. Pending states contain no reading tickets.
- Home, search, saved Library and direct routes always enforce readability. A title needs at least one complete chapter. The client tries up to ten offered chapters on demand; the auditor tries the offered server chapter list. Failed or unverified titles remain hidden. Direct readers check the requested chapter before mounting or recording history.
- Confirmed editions are grouped by existing KURO aliases (all 147 preserved), trusted work identifiers and provider edition relationships. Later bridges merge compatible earlier groups. Contradictory IDs and different numbered parts stay separate. Similar names alone do not prove duplicate identity. Saved edition records remain intact.
- The mandatory adult/suggestive/unknown-content policy remains in force. AniList remains metadata only and never increases the readable count.

## Exact count and evidence

The supplied live audit checked **100 MangaDex candidate entries** and fully validated **72 complete chapters, containing 2,134 pages**. It confirmed **72 unique readable titles**; **28 entries were excluded or remained unverified**. No duplicate editions were found among those 72 proofs. Candidate enumeration reported 41,337 entries on 14 October 2026; that number is **not** a verified unique readable total.

Read `docs/READABLE-LIVE-AUDIT.md`, `data/readable-audit.json` and `docs/READABLE-AUDIT-CHECKPOINT.json` for timestamps, coverage, title/chapter IDs, per-page SHA256 hashes, MIME, dimensions and results. This is a **partial sweep**. A complete total across the provider has not been established. The live check used public metadata and actual image bytes; it did not use private account credentials or expose source image URLs to the reader.

`GET /api/catalogue/readable/count` reports the exact shared **recent verified KURO inventory**, with its as-of time, oldest/newest checks and qualification window. Proofs expire after six hours and known corruption/content rejection invalidates them. Expired, pending, failed, metadata-only and duplicated editions are excluded. Counts use a consistent shared-inventory revision. Private device imports are excluded from the remote count; their existing exact-file review and per-device storage continue.

The Providers screen labels this count and its scope. Opening a previously unverified eligible title or searching can add a fresh full-chapter proof. The broad provider candidate catalogue remains potential inventory until its chapters are checked. Redis stores the shared proof ledger outside the small upstream cache; ordinary cache eviction cannot restore a known failure or silently erase all inventory proofs. The bundled seed expires at its original proof times and cannot override newer failures.

The count also requires the existing server page-ticket key and follows the deployment's provider usage and scanlation opt-out settings. If the key is missing or reading is disabled by those rules, the count is zero and `readingConfigured` is false. Retain the existing account encryption key privately on the server; do not place it in client code. When group opt-outs are configured, older seed proofs without recorded group provenance are withheld until rechecked.

Availability may change after a check. Rating/tag controls follow supported provider metadata; byte validation does not perform a human review of each image's subject matter. This release does not claim that every remote chapter has been inspected or that every publisher rating is accurate.

## Setup and deployment

1. Extract the complete ZIP into a clean folder. Use Node 22.x; run `npm ci --ignore-scripts`, `npm run build`, then `npm start` for a local server.
2. Deploy the whole source to the existing Vercel project. Keep `data/readable-audit.json` and the client/server companions in the deployment. Retain the current private server environment settings; see `VERCEL-DEPLOY.md`.
3. Keep the existing Supabase project, email confirmation/SMTP, Google and shared Redis configuration. Disable phone sign-in under **Authentication → Providers → Phone** in your own dashboard; this is the provider control documented in [Supabase's phone sign-in guide](https://supabase.com/docs/guides/auth/phone-login). The exact dashboard labels may vary. No private key needs to be sent to anyone.
4. Link and verify an email for any existing phone-only accounts you want to retain. Do this through your own account administration. The application does not delete or silently convert those accounts.
5. Existing profile migration/storage policies remain `supabase/migrations/202610120001_private_avatars.sql`; no new SQL or image storage bucket is required by this release.
6. Reload existing browser tabs and reopen native apps after deployment. Android/Windows wrappers remain native release 3.9.0 and point to your existing live website. This work has not deployed that website or changed live Supabase settings.

## Resume the broader public audit

The source includes a resumable auditor. It respects provider budgets, validates actual pages, and saves each title's evidence. Pending interruptions/timeouts remain queued and are retried on the next run.

```powershell
# Start or resume another 100 candidate checks
npm run audit:readable -- --limit=100

# Start/resume a full candidate sweep; this can take many hours and use substantial bandwidth
npm run audit:readable -- --limit=0
```

To resume the delivered checkpoint, first copy `docs/READABLE-AUDIT-CHECKPOINT.json` to `work/readable-checkpoint.json`. The checkpoint holds public audit evidence only. Deploy the newly generated `data/readable-audit.json` to publish its fresh seed proofs. Proofs older than six hours no longer qualify for the recent inventory, even if historical checkpoint entries remain. The audit's completed/partial status and pending count must be checked before claiming a full sweep. Its chapter list is the provider's latest up to 500 eligible English entries; a failure to qualify means unverified, not proof that every older chapter is broken.

The auditor does not authenticate to gated providers, bypass restrictions, include adult/unrated sources, upload private device files or require private keys. The normal app continues its existing visible/on-demand refresh and checks new titles before admitting them.

## Verification

See `docs/READABLE-TEST-RESULTS.md` for fresh results and `docs/READABLE-REVIEW.md` for the independent review. Tests use controlled account/storage fixtures and a dedicated real Redis instance. Real Supabase email delivery, Google consent, live RLS, live deployment and actual Android/Windows installation remain owner-side checks.
