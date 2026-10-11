# KURO 3.6.2 — Vercel web release

This ZIP contains the prebuilt Expo web client and editable Node auth/proxy server.
The project files are at the ZIP root. Start with [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md)
for Vercel, or [START-HERE.md](START-HERE.md) for a local preview.

The fixes move icon/navigation assets out of deployment-excluded node_modules paths,
add an install-dialog fallback, accept Vercel's parsed JSON request bodies, and use
encrypted shared Upstash Redis state for production authentication. The existing
Google, password, email OTP, SMS OTP, signup and recovery flows use Supabase Auth.

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
