# KURO 3.9.0 native installation — local verification, 13 October 2026

## Executed checks

| Check | Result |
| --- | --- |
| Complete Node 22.23.3 suite, dedicated Redis 8.0.5 | 74 passed; 0 failed/skipped |
| New platform/release metadata tests | 8 included in runtime suite |
| Real-file release generation tests | 4 included in runtime suite |
| Missing/tampered binary/certificate/assetlinks build tests | 4 included in runtime suite |
| Windows installer and launcher compilation | Passed with installed Microsoft C# compiler |
| Windows file install/removal/rollback sandbox | 19 checks passed; no real system installation or registry writes |
| Android SDK36 / Gradle8.11.1 / JDK21 release compilation | Passed; Bubblewrap1.27.0/Android Browser Helper2.7.4 |
| APK alignment and official apksigner verification | Passed; 3072-bit RSA, v3 signature, SDK29 minimum |
| Native download popup Chromium suite | 13 checks passed; actual APK and EXE downloaded and hash/byte matched |
| Separate popup lifecycle regressions | 3 passed after 3 failures against the isolated pre-fix source |
| Existing profile browser suite | 13 checks passed; no page JavaScript errors |
| Existing profile motion suite | 11 checks passed; desktop/mobile/reduced motion |
| Existing profile interaction regressions | 3 passed |
| Existing PWA/account browser smoke | Passed; 12 preserved checks, no page JavaScript errors |
| Build | 46 web resources plus both installers, release hashes, public certificate and assetlinks validated |

Runtime evidence includes the original 58 authentication/profile/Storage-policy
checks. Browser suites use a controlled local Auth/Storage service, the real
Supabase SDK and the actual KURO HTTP routes. Windows tests write executable files
and simulate integration failures in an isolated directory; the GUI and actual
Start menu/registry integration were not exercised on this user's installation.

## Review findings and observed regressions

An independent read-only reviewer identified five important failure classes:
Windows installation integration rollback, Windows uninstall failure ordering,
install-popup re-entry/lifecycle, absent native build validation and a release-body
timeout that ended too early. These were fixed before packaging.

- A read-only uninstall payload originally removed earlier app files before failing.
  The regression failed first; removal now restores known payloads and ownership.
- Integrated install/uninstall transaction checks now restore prior payload and
  integration state after controlled shortcut/registry failures.
- Re-entry after appinstalled, explicit standalone re-entry and a stalled JSON
  response each failed in an isolated pre-fix browser fixture, then passed against
  the corrected module. The stall case uses a controlled browser response stream
  and a shortened deadline; it is not a live CDN outage test.
- Missing binaries, changed EXE bytes, missing assetlinks and wrong certificate
  metadata now fail deployment validation. Official APK signature verification is
  performed by apksigner; the portable Node build gate checks file hashes,
  certificate presence and corresponding public assetlinks.

One minor review item remains: temporary uninstaller helpers are left for normal
temporary-file cleanup. They contain only the public installer, with no credentials.

## Public site inspection and limits

Read-only requests to https://kuro-manga.vercel.app/ confirmed the home page and
manifest were available and the anonymous account service reported configured.
The existing assetlinks URL returned the site's HTML fallback before this update.
The new release files and JSON assetlinks have not been deployed by this task.

Physical Android installation, Windows installer UI/registry integration, browser
domain verification and live provider/session behavior have not been verified.
No Supabase production login, upload, metadata update or signing-secret inspection
was performed. The clients use the existing online website; they do not provide
a fully offline manga library or reconstruct missing Expo source.

Raw evidence is under `docs/test-results`: runtime tests, native browser checks,
Windows sandbox results, APK signature/badging, lifecycle failures/pass results,
and refreshed profile/PWA checks. Reproduction and device checks are in
NATIVE-INSTALL-SETUP.md and tests/README.md.
