# KURO Vercel repair — 11 October 2026

## Version 3.6.2 popup correction

The user's screenshot showed only Not now. Version 3.6.1 only created Install KURO
when beforeinstallprompt was offered, leaving no primary action otherwise.
Version 3.6.2 always presents Install KURO in a normal browser tab. It opens the
native installer when offered, or expands device-specific installation/opening
instructions. Queued popup refreshes are canceled on click to prevent the dialog
reopening after an accepted install prompt.

The new browser regression failed on 3.6.1's missing button and passed after the
change. All twelve browser smoke checks passed on 3.6.2, with zero captured main
page JavaScript errors. Desktop and mobile popup screenshots were inspected.
Build/resource and asset checks were rerun. Server/API files are unchanged from
the previously verified 3.6.1 release; the full 35-test result below is from that
auth implementation.

## Changes

| Area | Diagnosis and change |
|---|---|
| Icons/navigation images | 31 bundle references used assets/node_modules paths. Vercel CLI excludes that directory name. Assets now live under assets/vendor; references and the JS fingerprint were updated. |
| Project root | The old ZIP wrapped the project in kuro-main/Kuro-manga. The new ZIP has the project files at its root. |
| Install dialog | Modern Chromium opened the old native dialog; removing native dialog support reproduced a failure. The script now provides a modal fallback with focus trapping, Escape and dismissal. |
| Auth POST requests | The old body reader required an unread stream. It now accepts Vercel's already-parsed JSON bodies with the same validation and size bound. |
| Vercel auth state | Instance-local SQLite cannot supply shared sessions/PKCE state/limits. Production now requires encrypted Upstash Redis; local development retains SQLite. All store callers are asynchronous. |
| Concurrency/revocation | Shared Lua operations and leases provide atomic limits, serialized session operations and user-session deletion. Refresh updates cannot recreate deleted sessions. |
| Storage integrity | Encryption authenticates the cookie hash, record kind, user index and expiry. Moving ciphertext or editing expiry fails validation. |
| Setup/outage behavior | Missing/invalid auth settings leave guest routes usable. Storage failures fail auth closed. Logout clears local cookies and reports incomplete remote revocation; it also cancels pending Google flows. |
| Client IP | Vercel limits use its validated platform client-address header. Arbitrary forwarding headers are ignored outside Vercel. |

Google login was already present in the compiled client/server. The repair makes
its PKCE/session state usable across Vercel instances and supplies the required
provider configuration instructions. No client secrets were embedded.

## Checks performed

- Full runtime suite: **35 passed, 0 failed, 0 skipped**, on Node **22.23.3**.
- Tests use the real **Supabase JS SDK 2.109.0**, a controlled local auth provider,
  and **Redis 8.0.5** behind a test-only Upstash-compatible HTTP boundary.
- Cross-process Google code exchange passed; wrong-browser and replay callbacks
  failed as expected. Password, signup/email verification, email/SMS OTP, recovery,
  global/local logout, body/origin checks, expiry, concurrency, encrypted record
  tampering and temporary outages were exercised.
- The development SQLite run passed its local cases; shared-state cases are
  explicitly skipped when TEST_REDIS_URL is absent.
- Build validation passed for all **42 referenced public resources**. This checks
  the supplied prebuilt export; the absent original Expo source cannot be rebuilt.
- Headless Chromium passed twelve checks for fonts/resources, first-visit popup,
  Install KURO without a native offer, dismissal/reopening, synthetic install
  handoff, mobile fallback, focus/Escape, standalone suppression, offline
  navigation and the Google UI redirect.
- The normal desktop app produced zero uncaught browser JavaScript errors during
  the UI smoke. External manga feed requests were excluded from that smoke.

## Practical limits

No live Vercel URL or provider credentials were supplied. Actual Google consent,
production email/SMS delivery, Upstash account settings and physical OS installation
were not verified. Configure your accounts using ../VERCEL-DEPLOY.md and test those
operations on the resulting deployment. The ZIP contains no native source or signed
APK. Libraries/history remain device-local.

The Node 22 SQLite experimental warning applies only to the development backend.
Production Redis does not initialize SQLite. See SECURITY-36.md for scope and
tests/README.md for reproduction commands.
