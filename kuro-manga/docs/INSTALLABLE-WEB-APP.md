# Install KURO from the website

The export includes a manifest, valid 192/512px icons, a service worker and a
dismissible welcome dialog. Settings → Install KURO reopens it. Installation is
a PWA. This archive contains no signed APK or desktop executable.

The welcome dialog appears after about 3.5 seconds on a fresh visit. Dismissal is
remembered for seven days. It is suppressed in installed standalone mode and on
reader/auth routes. Browsers without showModal get a fixed dialog/backdrop with
keyboard focus trapping and Escape/dismissal support.

The popup shows Install KURO and Not now. Chrome/Edge choose whether to emit
beforeinstallprompt. Install KURO calls that event's prompt once when offered;
otherwise it expands instructions for the current device. Hide instructions
collapses those steps. Embedded views receive a link to open a normal tab.
On iPhone/iPad use Safari's Share → Add to Home Screen.

An already-installed PWA does not receive a new beforeinstallprompt event. If
Chrome shows Open in app in the address bar, use that to launch KURO. The website
cannot force a native installation prompt. See [browser installation behavior](https://web.dev/learn/pwa/installation-prompt)
and [Chrome's installation instructions](https://support.google.com/chrome/answer/9658361).

Run npm run build before deployment. It moves generated vendor assets away from
node_modules directories and validates all exported references. The supplied ZIP
is already prepared. Serve at the domain root over HTTPS; do not add a URL
subdirectory without adapting the root-relative manifest, worker and asset paths.

The worker caches only an offline HTML page. Chapters, auth, API and proxy data are
not cached. Installing does not download stories. Worker updates use the normal
waiting lifecycle; close old installed windows to let an update activate.

Chromium checks cover desktop/mobile dialog behavior, fonts, resources, the install
action without a native offer, dismissal, re-entry, fallback focus/Escape,
standalone suppression, offline navigation and a synthetic prompt handoff.
The handoff check also ensures the popup stays closed after acceptance.
The synthetic event does not prove an actual OS install.
Run tests/browser-smoke.py to reproduce; see [../tests/README.md](../tests/README.md).
