# Native installation implementation plan

**Goal:** Deliver real APK/EXE files and a popup that downloads the correct build.
**Architecture:** Retain KURO 3.8's website, server and secure profile module;
add browser-hosted native clients, bounded per-user Windows installation, and
same-origin release discovery. Work inline in the isolated `work/kuro-native`
copy; previous ZIPs and the user's current preview remain available.
**Spec:** NATIVE-INSTALL-DESIGN.md

## Constraints and review focus

- Public origin: `https://kuro-manga.vercel.app`; Android package `app.kuro.manga`.
- 3.9.0/code 390; Android SDK 29–36; Windows 10/11, .NET 4.8 and Microsoft Edge.
- No server key/client bridge, embedded Google login or disabled TLS checks.
- Missing/corrupt release files must preserve PWA installation and hide native links.
- Reject cross-origin, traversal, HTML masquerading as a binary and wrong extension.
- Windows uninstall must affect only known KURO files under its bounded directory;
  symbolic links/reparse points and unrelated files must remain protected.
- OS installation cannot be performed silently by a webpage.

## Task 1: Release and platform model

- [ ] Write `tests/install-model.test.mjs` using real exported pure functions.
  Android UA must yield `android`; Windows UA must yield `windows`; touch-capable
  MacIntel must yield `ios`; Windows Phone must yield `other`.
- [ ] Run `node --test tests/install-model.test.mjs`; expect missing-feature assertions.
- [ ] Add `dist/install-model.mjs`: `detectPlatform(navigatorLike)`,
  `validRelease(value)` returning validated platform entries, and
  `nativeEntry(search)` for launch-query detection. Reject unsafe URL schemes,
  cross-origin paths, missing bytes/checksums, bad versions and invalid suffixes.
- [ ] Re-run those tests; expect all passing.

## Task 2: Native builds

- [ ] Add Windows harness first, exercising actual destination validation,
  deployment, rollback and known-file removal in a sandbox with no registry writes.
- [ ] Build `native/windows` C# source with the installed Microsoft compiler;
  include icon/manifest, launcher, installer and uninstaller. The launcher passes
  the fixed HTTPS URL to installed Edge without shell interpolation.
- [ ] Generate `native/android` with Bubblewrap core 1.27.0; use Custom Tabs
  fallback, disabled notification delegation, no extra trusted origin, SDK 36.
- [ ] Build, align, sign and verify the APK using approved Android SDK tooling.
  The private keystore/password stay in workspace-private signing storage.
- [ ] Run Windows sandbox harness and inspect APK package/permissions/signature.

## Task 3: Download publication and popup

- [ ] Add `scripts/release-native.mjs` to read actual binary files and generate
  `/downloads/releases.json` with `schema:1`, `version`, `android` and `windows`.
  Platform entries have `url`, `bytes`, `sha256` and `minimumSystem`.
- [ ] Add popup browser regressions first: Windows download, Android download,
  unavailable manifest, wrong binary type, iframe, PWA fallback, native suppression.
- [ ] Integrate the model into `dist/install.js` and update its scoped stylesheet.
  Native download links use `/downloads/` paths and ordinary browser download
  behavior. Never say installation completed after download.
- [ ] Serve APK/EXE/MJS/assetlinks with appropriate types and attachment headers;
  preserve server auth/profile routes. Validate release files in the build step.
- [ ] Run download/browser checks with actual generated binaries and verify bytes.

## Task 4: Regression and delivery

- [ ] Run the complete runtime suite, profile suites and existing PWA smoke checks.
- [ ] Obtain an independent source review under requesting-code-review; address
  important findings with observed failing then passing regression cases.
- [ ] Record exact build/test/signature evidence and unverified live/device cases.
- [ ] Package complete 3.9.0 source, APK, EXE, public assetlinks, setup instructions,
  binary checksums and preview. Exclude build caches, secrets and private signing files.
