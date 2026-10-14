# KURO4.3 strict content checks

Run `npm test` with Node22. Set TEST_REDIS_URL to a dedicated local Redis fixture if you want all shared-store checks to run without skips.

Against the local fixture server (`PORT=4184 node tests/profile-server.mjs`), set APP_URL=http://127.0.0.1:4184 and run these isolated browser suites with Python/Playwright and Pillow:

- content-browser.py: strict policy, direct links, saved views, startup failure, local fingerprints/race.
- local-library-browser.py: reviewed import, duplicates, order, restore/delete, multi-tab preservation and no upload.
- mobile-artwork-browser.py: approved cover quality, fallback and desktop/mobile component behavior.
- profile-browser.py / profile-ui-regressions.py: unchanged account/private-photo operations.
- native-install-browser.py / install-toast.py: unchanged native download and notice behavior.

catalogue-browser.py uses the same strict fixture suite as content-browser.py; count it once when reporting unique checks. Current fixtures use positive rating evidence. Unverified Guya/Asura fixtures are no longer allowed to bypass the policy.

These checks use isolated synthetic metadata and account/storage fixtures, with no live deployment or real Supabase policy verification. The original exported app and native binaries are validated by the production build.

## Earlier testing reference

# Reproduce KURO 3.9.1 checks

Run `python tests/install-toast.py` against the local preview for compact dimensions,
non-modal behavior, automatic platform selection, focus, announcement, dismissal,
navigation and reduced-motion checks. The existing native/PWA suites now use the
compact notice controls; installer binaries remain version 3.9.0.

For native installation, run `npm test` and
`powershell -NoProfile -File tests/windows-installer-checks.ps1` after building
the Windows client. With a local fixture on port 4182, set APP_URL and run
`python tests/native-install-browser.py` and `python tests/install-lifecycle.py`.
APK signature verification runs in native/android/build.ps1 with the Android SDK.
NATIVE-INSTALL-SETUP.md lists remaining deployment/device checks.

For animation/design checks, use the same local profile test server and run
`python tests/profile-motion.py`. It exercises advancing animation transforms,
pointer tilt, live text preview, drag-and-drop through the secure API, animated
closing, mobile reachability, and reduced-motion behavior. It writes screenshots,
a local WebM recording and a JSON report under `work/motion-evidence/`.

Run `python tests/profile-ui-regressions.py` for the shared-context account-switch,
unsaved name draft, and request-timeout regression cases. Timeout response handling
is tested with a held local request and a shortened browser timer.

The current runtime suite includes the original authentication/store checks,
profile lifecycle and security regressions, and an executed Storage-policy
migration test using PGlite with fixture auth/storage schemas. With dedicated local
Redis all 58 tests run; without it 12 shared-store cases are skipped.

For the new profile browser tests, install Playwright and Chromium, run
`node tests/profile-server.mjs`, then `python tests/profile-browser.py`.
The test server uses port 4181 and mock local provider credentials only. The
browser tests use the real KURO API and Supabase SDK with a local Storage fixture.
They exercise the account panel, avatar lifecycle, delayed-response race, safe
text display, navigation, sign-out, separate accounts and mobile layout.
Results/screenshots are written under `work/profile-evidence/`.

These fixtures cannot verify a live Supabase Storage service or Vercel deployment.
The original reproduction details follow; their historical 35-test count predates
the profile additions.

Use Node 22.13+ in the 22.x line:

~~~sh
npm ci --ignore-scripts
npm run build
npm test
~~~

The build command prepares and validates the supplied Expo export; it cannot
recompile the absent source tree. Default tests use a controlled local Supabase
transport and development SQLite. They never send real codes or contact Google.

To run all shared-state tests, start a **dedicated local Redis** on 127.0.0.1.
The test fixture requires a local server without credentials. It uses unique
test prefixes and deletes only its own keys. For example, with Redis on port 16379:

~~~powershell
$env:TEST_REDIS_URL="redis://127.0.0.1:16379"
npm test
~~~

All 35 tests run when that variable is set. Without it, 12 Redis/cross-process
cases are explicitly skipped. The real Supabase SDK runs against a local fixture;
production refuses the fixture's HTTP transport. Test codes and fixture secrets
exist only in tests/, which .vercelignore excludes.

For browser checks, start npm start in one terminal. In another:

~~~sh
python -m pip install playwright
python -m playwright install chromium
python tests/browser-smoke.py
~~~

APP_URL defaults to http://localhost:8081. You can set it to another local test
server. PLAYWRIGHT_CHROMIUM_EXECUTABLE is optional if you use an existing Chromium.
Screenshots and a JSON report are saved under work/browser-evidence/.
The browser suite excludes external manga feeds, exercises the real compiled UI,
checks the install action both with and without a browser offer, and uses a
synthetic install event and OAuth handoff response. It does not claim real OS
installation, email/SMS delivery or a live Google consent exchange.
