# KURO 3.9 native installation

The user requested real Android APK and Windows EXE installation from the existing
install popup and supplied https://kuro-manga.vercel.app/ as the public app URL.
The existing 3.8 reader and secure account/profile functionality must be retained.

Android uses Google's Trusted Web Activity implementation, with a Custom Tabs
fallback. It uses the browser's existing authenticated website session and image
picker; no JavaScript/native bridge or copy of server credentials is introduced.
The package is `app.kuro.manga`, version 3.9.0/code 390, minSdk 29 and targetSdk 36.
It launches `https://kuro-manga.vercel.app/?kuro-native=android`. A signed APK and
matching public certificate fingerprint in `/.well-known/assetlinks.json` are
required. The signing key is retained privately outside the delivered source ZIP.

Windows uses a per-user .NET Framework 4.8 installer and launcher, with Microsoft
Edge hosting KURO in a dedicated app window. This preserves the full browser
authentication behavior, including external provider navigation, without an
embedded-login WebView. The installer creates an application folder, Start menu
shortcut, optional desktop shortcut, and normal uninstall entry. It requires
Windows 10/11 with Edge. It does not change browser settings or request admin
rights. Binary signing with a trusted Windows publisher certificate is a separate
release configuration; an unsigned EXE must not claim a verified publisher.

The popup detects Android/Windows and makes the corresponding native download
primary. Browser installation remains available. Native choices are displayed
only when a same-origin release manifest and actual downloadable binary pass the
client availability checks. The release generator computes byte counts and
SHA-256 values from the actual files. Downloads never trigger a fake installed
status. The operating system completes installation after the user opens the file.

Installed PWA/native launch entries suppress the automatic install popup. Explicit
re-entry remains available from the existing installation control. Existing focus,
Escape, iframe, dismissal, reduced-motion and offline behavior are preserved.

The full deployment includes both binaries, release metadata and Digital Asset
Links. Live auth configuration and native device behavior are reported separately
from local browser/build/signature checks. No Supabase migration or secret change
is required.
