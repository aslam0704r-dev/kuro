# KURO 4.6.0 — optional sources and progressive loading

Open **Settings → All 1,236 providers**. Verified sources start on; additional sources start off and have saved selection switches. Status labels distinguish a saved choice from a working reader, external platform or unresolved connection. Mandatory adult/unrated-content and complete-chapter checks remain in force.

Home/search share a fair incremental chapter-check queue. Discovery publishes each provider/page independently, and source cooldowns honor Retry-After. Read [the 4.6 report](docs/PROVIDER-LOADING-4.6.0.md), [source setup](PROVIDERS-SETUP.md) and [START-HERE.md](START-HERE.md). No new environment setting or SQL migration is needed. The provider inventory is not a claim of 1,236 working readers.

## Previous routing correction — 4.4.1

Version 4.4.1 keeps the 4.4.0 features and corrects Vercel rewrite query handling. The internal capture uses `kuroPath`, which the server adapter removes before endpoint validation. Public MangaDex `path` values and Google callback `code`/`state` remain intact. See [docs/VERCEL-ROUTING-4.4.1.md](docs/VERCEL-ROUTING-4.4.1.md) for the correction and verification scope.

# KURO 4.4.0 — email login and verified readable titles

Read [READABLE-CATALOGUE.md](READABLE-CATALOGUE.md) first. Phone/SMS login is removed; email password, email codes and Google remain. Collections always hide titles without one completely checked chapter and group confirmed editions. The Providers page shows an exact count of the recent verified KURO inventory. The bundled live audit is a **partial sweep of 100 candidate entries**, not the full provider catalogue. All 2,134 pages of the 72 qualifying chapters were fetched, MIME/signature checked and fully decoded. Device imports remain private to their device.

The original exported app, cinematic profile editor, private avatar migration and Android/Windows binaries remain included. Existing phone-only users need a verified email linked before signing in. Disable the Phone provider in your own Supabase dashboard; the app already refuses phone requests. No additional private keys are required.

## Previous release: 4.3.0 — mandatory strict content rules

Start with [START-HERE.md](START-HERE.md) and [STRICT-CONTENT.md](STRICT-CONTENT.md). Adult, suggestive and unverified titles are hidden and refused. Saved records are preserved. The current provider policy audit and test report are under docs/CONTENT-*.

## Earlier release notes

The material below records previous delivered features and historical availability. Current source admission follows STRICT-CONTENT.md.

# KURO 4.2.0 — device Library and mobile artwork

Open **Library → Import manga** to read device comics. See [LOCAL-LIBRARY.md](LOCAL-LIBRARY.md) for supported files, storage limits and deployment. Existing profile, login, providers and installers are included.

# KURO 4.1 — expanded providers, validated reading and automatic refresh

Start with **[PROVIDERS-SETUP.md](PROVIDERS-SETUP.md)** for this release. The directory covers the 1,254 uploaded names and earlier providers, with **109 installed readers**, six metadata sources and WEBTOON’s catalogue. Fresh KURO gateway checks passed 96 of 101 selected server connections; five timed out and are reported as intermittent. Exact current samples are in [the provider report](docs/PROVIDER-STATUS.md), [one row per uploaded name](docs/PROVIDER-STATUS.csv), [machine-readable evidence](docs/PROVIDER-AUDIT.json) and [test results](docs/PROVIDER-TEST-RESULTS.md).

The private cinematic profile editor, compact installation notice, original exported app and native release 3.9.0 are included. Native wrappers receive the website update after deployment.

## Earlier release: 3.9.1 — Compact install notice and cinematic profiles

The install prompt is now a small notification-style rectangle in the bottom-right.
Its **Install** action detects the current system and downloads the existing Android
APK or Windows EXE. It preserves page focus and scrolling, with close/Later controls
and a secondary browser-install choice. See docs/INSTALL-TOAST-TEST-RESULTS.md.

Website version 3.9.1 reuses native release 3.9.0; the native clients already open
the live website and receive this UI after redeployment. No native rebuild is needed.

This release adds real Android APK and Windows EXE installers for
https://kuro-manga.vercel.app/ and platform-aware downloads in the existing install
popup. Start with [NATIVE-INSTALL-SETUP.md](NATIVE-INSTALL-SETUP.md) for deployment
and installation, and [native test results](docs/NATIVE-INSTALL-TEST-RESULTS.md)
for the executed checks and remaining device verification. Both installers are
included; native compilers are not needed on Vercel.

The complete 3.8 profile feature and animations described below are preserved.

Version 3.8.0 redesigns Edit profile as a cinematic reader card and editing studio:
animated opening/closing, avatar orbit and ambient effects, pointer tilt, live name
preview, drag-and-drop picture selection, picture transitions, button feedback and
save confirmation. Reduced-motion settings disable the effects. Existing profile
security and Supabase policies from 3.7.0 are retained.

Signed-in readers can edit their display name and upload, replace, or remove a
profile picture from the **Edit profile** card on `/account`. Profile data persists
in the existing Supabase Auth account. Photos use a private Storage bucket and
are served through the authenticated KURO API.

Start with [PROFILE-SETUP.md](PROFILE-SETUP.md). Apply the included Storage SQL
migration before using pictures, then deploy this entire package. Existing working
authentication environment values continue to be used; no new private key is needed.

This package contains the complete available release, editable server/profile
code and the new account module. The original React/Expo screen source was absent
from the supplied archive. The compiled Expo bundle is retained byte-for-byte;
the new UI is maintained in `dist/profile-editor.js` and `profile-editor.css`.
The build validates/prepares this web export rather than recompiling Expo.

See [docs/PROFILE-SECURITY.md](docs/PROFILE-SECURITY.md) and
[docs/PROFILE-TEST-RESULTS.md](docs/PROFILE-TEST-RESULTS.md) for security scope and
local verification. The remaining notes describe the preserved 3.6.2 release.

This ZIP contains the prebuilt Expo web client and editable Node auth/proxy server.
The project files are at the ZIP root. Start with [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md)
for Vercel, or [START-HERE.md](START-HERE.md) for a local preview.

The fixes move icon/navigation assets out of deployment-excluded node_modules paths,
add an install-dialog fallback, accept Vercel's parsed JSON request bodies, and use
encrypted shared Upstash Redis state for production authentication. The existing
Google, email password, email OTP, signup and recovery flows use Supabase Auth. Phone/SMS sign-in is disabled in 4.4.0.

Version 3.6.2 keeps Install KURO visible in the welcome popup even when the browser
does not offer its native installer. The action opens that installer when available
or shows device-specific steps, including how to open an already-installed app.

Guest browsing works without provider settings. Real accounts require your own
Supabase project, provider configuration and Upstash database. No live credentials
are included. See [docs/ACCOUNTS.md](docs/ACCOUNTS.md).

Requires Node 22.13+ in the 22.x line. The uploaded archive did not include editable
React/Expo source, source maps, native build files, or its original test suite.
The build command prepares/validates the supplied web export; it does not recompile
Expo. This release includes focused runtime and browser tests in [tests/](tests/README.md).
# KURO 4.0 provider update

See **[PROVIDERS-SETUP.md](PROVIDERS-SETUP.md)** for the new provider directory, real reader adapters, image checks, release refresh, deployment configuration and remaining integrations. Exact results and all 190 requested names are in [the provider status report](docs/PROVIDER-STATUS.md). Native installers remain release 3.9.0 and load the updated website after deployment.

