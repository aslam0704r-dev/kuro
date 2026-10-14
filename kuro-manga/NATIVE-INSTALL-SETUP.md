# KURO website 3.9.1 — APK and Windows installer

**This UI update:** deploy the complete 3.9.1 source ZIP. It replaces the large
dialog with a small corner notice. Install automatically selects the APK on Android
or EXE on Windows; the OS still confirms installation. Both native binaries remain
version 3.9.0 and are included unchanged. `nativeReleaseVersion` in package.json
keeps their version separate from the website version. No new Supabase settings,
storage policies, native compilation or signing key is required for this update.

The complete package now contains real installer binaries, the website, backend,
native project source, deployment configuration and the existing secure profile
feature. Both native clients open **https://kuro-manga.vercel.app/**.

## Deploy the complete website package

1. Replace your existing project files with the complete source ZIP. Keep your
   existing Vercel environment settings private and unchanged.
2. Run `npm ci --ignore-scripts` with Node 22.x, then `npm run build`.
   The build checks the web assets, both binary files, release hashes and public
   Android certificate/Digital Asset Links. Native compilers are not needed on
   Vercel because the compiled installers are already included.
3. Deploy this source to the Vercel project serving `kuro-manga.vercel.app`.
   Keep the included `vercel.json`: output is `dist`, server routes stay enabled.
4. Confirm the following publicly accessible paths return their actual files:

   - `/downloads/KURO-3.9.0-android.apk`
   - `/downloads/KURO-3.9.0-windows.exe`
   - `/downloads/releases.json` — JSON, with this release's byte counts and hashes.
   - `/.well-known/assetlinks.json` — JSON, not the site's HTML fallback.
   - `/.well-known/android-signing-cert.der` — public certificate only.

5. Open installation from KURO's existing install control, or use a fresh browser
   visit. A prior “Not now”/“Later” dismissal still lasts seven days. Android gets the APK
   link; Windows gets the EXE link. Other systems get browser installation.
6. On a real Android device and Windows computer, check opening the installed app,
   login, reading, profile name save, photo upload/replacement/removal and sign-out.
   Local fixture tests do not substitute for these deployment checks.

No new Supabase table, bucket policy, private key or environment value is needed
when upgrading from KURO 3.8. If your live site is still on 3.6, also follow
PROFILE-SETUP.md for the existing private-avatar migration and account setup.
Do not upload `.env.server`, credentials, databases or signing key files.

## Android installation

Requirements: Android 10 or newer and a current browser supporting Trusted Web
Activities/Custom Tabs, such as Chrome. The APK installs a KURO launcher icon.

Download the APK, open it and follow Android's source-installation and Install
confirmation. The web page cannot grant those permissions or confirm installation
on the user's behalf. Internet is needed for account services and online stories.

The APK is signed with the project certificate; local `apksigner` verification
passed using the v3 scheme. The included Digital Asset Links file contains the
matching **public** certificate fingerprint. Publishing it on the exact KURO host
allows trusted presentation. If it is missing or not verified, the browser uses
Custom Tabs and may show browser controls. Google documents that behavior in its
[Trusted Web Activity guide](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start).

The public fingerprint is:

```text
00:B6:BE:3B:C1:43:71:5F:2A:4B:BB:A3:70:92:D7:20:2C:3A:E8:0F:C9:A9:FD:E1:26:FF:96:77:87:35:AA:71
```

This release uses package `app.kuro.manga`, version 3.9.0, version code 390,
minimum SDK 29, target/compile SDK 36. There is no native JavaScript bridge and no
embedded account WebView. The site's browser session and normal file picker are
used. Additional domain trust and notification delegation are disabled.

## Windows installation

Requirements: Windows 10/11, Microsoft Edge and .NET Framework 4.8 or later.
Download and open the EXE, choose **Install KURO**, then **Open KURO**. The setup
creates a per-user application folder and Start menu entry. A desktop shortcut is
optional. Uninstall through Windows Settings → Apps → KURO.

The client uses Edge's app window to open the existing website. It shares the
site's Edge browser data, so a user who previously read in a different browser may
need to sign in again and will retain that other browser's device-local library.
It does not embed Supabase secrets or change browser/TLS settings.

The EXE is **not Authenticode-signed with a trusted Windows publisher certificate**.
Windows may show an unknown-publisher/SmartScreen warning. The website must not
claim that Windows has installed the app merely because a download occurred.
For a public publisher-signed release, sign the EXE through your own trusted
Windows signing service, then run `npm run release:native` to refresh its hash.
Keep signing credentials in your local/CI secret store; do not send them in chat.

## Rebuild native clients

Windows source is in `native/windows`. From the project root:

```powershell
powershell -NoProfile -File native/windows/build.ps1
powershell -NoProfile -File tests/windows-installer-checks.ps1
```

Android source is in `native/android`, generated with Bubblewrap core 1.27.0.
Install Android SDK platform 36/build-tools 36.0.0 and JDK 21. Provide the existing
project signing keystore through `KURO_ANDROID_KEYSTORE` and its password through
the private process environment variable `KURO_APK_PASSWORD`; then run:

```powershell
powershell -NoProfile -File native/android/build.ps1
npm run release:native
npm run build
```

The build aligns/signs/verifies the APK and exports only its public certificate
and matching assetlinks. Gradle 8.11.1 is pinned with an official distribution
SHA-256. A local Gradle installation can be selected with `KURO_GRADLE` if wrapper
downloads are restricted. Bump the APK version code and version for later releases;
update versioned output names in native build scripts and the Windows assembly
version together with package.json's nativeReleaseVersion before refreshing
release metadata. Website-only updates can reuse the existing native release.

## Preserve the signing key privately

A new Android project key was created locally for this release. It is outside the
delivered source at the task workspace's `work/private-signing/kuro-release.jks`.
Its password is stored in `password.dpapi`, encrypted for this Windows user. These
private files are excluded from the ZIP and Vercel uploads. Back them up privately
before deleting the task workspace. DPAPI password storage is tied to this Windows
account/machine; make a secure signing backup for any future build machine.
Do not create a different key for updates to the already-installed package.

The source ZIP contains the public certificate and binaries, not a private key.
You can deploy the included files without rebuilding or accessing that key.

## Verification limits and known minor issue

The APK was built and cryptographically verified; browser download checks compared
both downloaded binaries byte-for-byte with their packaged originals. Windows
payload/rollback tests ran in a sandbox and did not install the app into this
user's actual Start menu or registry. Physical Android installation, Windows setup
UI integration, Chrome domain verification and live Google/email/SMS login remain
deployment/device checks. No production account changes were made.

The Windows uninstaller copies its helper into a unique temporary folder so it can
remove the installed EXE. The small temporary helper remains until normal temporary
file cleanup, including after cancellation. It contains no account credentials.
This is the one deferred minor issue recorded by the independent source review.
