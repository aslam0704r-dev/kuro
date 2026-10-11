# KURO 3.6.2 auth changes and verification scope

Production uses shared Upstash Redis for sessions, challenges, OAuth state,
rate limits and request locks. Opaque cookie IDs are hashed; provider token and
PKCE values are AES-256-GCM encrypted and bound to their cookie hash, kind, user
index and expiry as authenticated data. Production cookies are HttpOnly, Secure,
SameSite=Lax and use the __Host- prefix. Provider user checks validate sessions.

Missing/invalid provider or shared-store settings disable auth without crashing
guest routes. Secret/service-role Supabase keys and HTTP test transports are
rejected in production. POST routes enforce exact Origin/JSON checks and an 8 KiB
body limit, including Vercel's already-parsed request bodies.

Atomic shared limits, five verification attempts, resend cooldowns, single-use
serialized Google callbacks, expiry, global session deletion and update-only
refresh records prevent the tested state/refresh failures. Local logout clears
cookies during outages and reports incomplete remote revocation.

The existing source proxy restrictions and CSP remain. Vendor assets were relocated
from deployment-excluded node_modules paths to assets/vendor; the generated JS
filename changed so browsers fetch the updated references. The PWA install dialog
has a native-dialog fallback. Auth/proxy/chapter data are not service-worker cached.

## Verification

The included suite has 35 runtime/config/artifact tests. The full run uses the real
Supabase SDK against a controlled local HTTP provider and a real local Redis behind
an Upstash-compatible HTTP fixture. Tests include cross-process Google callback,
PKCE validation, wrong-browser/replay rejection, password/email/SMS/recovery flows,
encrypted values and record-tamper rejection, shared concurrency/expiry/revocation, outage/logout behavior,
CSRF/body checks and Vercel upload-safe assets.

Without TEST_REDIS_URL, 23 local/SQLite/artifact tests run and 12 shared-store cases
are explicitly skipped. Node 22 reports its standard experimental SQLite warning
for the development backend; Redis production does not initialize SQLite.
Reproduce using [../tests/README.md](../tests/README.md).

Browser checks exercise the delivered generated client with external manga feeds
excluded from the UI smoke. They verify fonts, dialog behavior and Google UI
navigation. The fixture does not send real verification codes or show real Google
consent. No live Vercel/Upstash/Supabase account was configured during repair.

## Remaining setup

Configure production SMTP/SMS, Google consent/test users, exact redirect allowlists,
provider quotas/password/session policies and your own server environment values.
CAPTCHA, MFA, cloud library sync, account deletion, full native builds and actual
OS installation were not added. The original editable Expo source was absent.
This focused audit/test scope is not an independent full application security audit.
