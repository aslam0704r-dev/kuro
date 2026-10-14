# KURO 3.9.1 compact install notice — 13 October 2026

The centered install dialog is replaced by a compact, non-modal notification near
the bottom-right, above the app's navigation. The visible Install action selects
the existing Android APK or Windows EXE from verified release metadata. Native
release 3.9.0 is reused; no native binary or signing-key change was made.

| Executed check | Result |
| --- | --- |
| New compact-notice Chromium suite | 10 checks passed |
| Existing native-download/browser suite adapted to the new controls | 13 checks passed |
| Popup lifecycle/fault regressions | 3 passed |
| Existing account/PWA smoke adapted to a non-modal notice | 12 checks passed; no page errors |
| Full Node22.23.3 suite with Redis8.0.5 | 74 passed; 0 failed/skipped |
| Existing profile browser suite | 13 checks passed; no page errors |
| Existing profile interaction regressions | 3 passed |
| Export/build gate | 48 referenced resources plus native artifact validation passed |
| Preservation comparison against delivered 3.9.0 | 67 native/server/API/Storage/profile files byte-identical, including both installer binaries |

Compact layout checks assert a desktop width of at most 370px and initial height
of at most 185px, bottom-right placement, mobile fit/clearance, page navigation
while open, absence of a backdrop/modal state, unchanged typing focus and normal
keyboard navigation. Desktop screenshots show an initial 360×130px card.

The new design tests first failed against the old large modal. A test expectation
for the Explore route was corrected to the app's actual `/search` route; this was
a harness assumption and did not change product navigation.

An independent read-only review identified two focus cases. A late browser install
offer now updates its shared offer without replacing focused controls. A delayed
manual open followed by navigation and typing on another screen failed before
its fix, then passed after pending opens were invalidated on every URL change.
The initial announcement accessibility case also failed before adding a stable
polite status. Automatic appearance still does not move focus. The review did not
run tests; these browser results were executed separately.

Install actions downloaded the actual APK/EXE and matched the release SHA-256.
The notice gives a short next step after clicking and does not claim the operating
system has installed the app. Browser fallback, dismissal, explicit re-entry,
stalled release-body timeout and reduced-motion behavior remain covered.

This is a website UI update. No live deployment or new physical-device/native
installation test was performed. Native verification/limitations from 3.9.0 remain
in NATIVE-INSTALL-TEST-RESULTS.md and NATIVE-INSTALL-SETUP.md, including the unsigned
Windows publisher certificate and temporary uninstaller helper. The original
profile animation module is byte-identical to 3.9.0/3.8.0.
