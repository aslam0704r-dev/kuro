# Managed accounts in KURO 3.8.0

The account profile module now supports display-name editing and private photos.
Follow [../PROFILE-SETUP.md](../PROFILE-SETUP.md) for its Storage migration. Profile
data uses existing Auth metadata; there is no new public profiles table.

The web client already includes password login, signup/email verification, email
OTP, mobile-number OTP, recovery, Google login and local/global logout. Requests
go through same-origin /api/auth/* routes. Supabase supplies account verification,
provider authentication and token revocation; Kuro stores encrypted session state.

Use [../VERCEL-DEPLOY.md](../VERCEL-DEPLOY.md) for the exact Vercel/Google/Upstash
settings. No live provider credentials are shipped. Use a publishable or legacy
anon Supabase key; secret/service-role keys are rejected by the auth configuration.

## Email and password

Enable Email and **Confirm email** in Supabase. Set a minimum password length of
at least 12. Kuro accepts 12–128 characters and rejects an immediately authenticated
signup when the provider bypasses confirmation.

Configure a production SMTP sender in Supabase. Install these numeric-code
templates in the corresponding Supabase template fields:

| Supabase template | Included file |
|---|---|
| Confirm signup | email-templates/confirm-signup.html |
| Magic Link / email OTP | email-templates/email-otp.html |
| Reset password | email-templates/recovery.html |

The templates use {{ .Token }}. The app expects the code to be entered on its
verification screen. Configure six-digit email OTPs and an expiry of no more
than ten minutes. Review provider send/verification quotas and password policy.
Provider-side CAPTCHA is not connected to these forms; enabling it requires a
matching UI integration.

Signup starts verification. Verify email resends a signup code. Email OTP can sign
in or create a verified account. Recovery requires a recovery code before accepting
a new password, then signs the user out and revokes that user's web sessions.
Ordinary OTP verification cannot promote a login into a recovery session.

## Phone OTP

Enable Supabase's Phone provider and configure a supported SMS service there.
Use international E.164 numbers, for example +919876543210. Check the provider's
sender approval, geographic permissions, delivery limits and spend controls.
Contact verification proves control of the phone number; it is not MFA or a
legal-identity check. Email/phone accounts are not blindly merged.

## Google

The existing Google button calls the server's OAuth route. The server creates an
S256 PKCE challenge and retains its verifier in encrypted shared state, bound to
a ten-minute HttpOnly flow cookie. The callback exchanges the code and creates
an opaque session cookie. Missing, cancelled and replayed flows are rejected.
Configure the provider and both redirect locations in [../VERCEL-DEPLOY.md](../VERCEL-DEPLOY.md).

## Local development

Use Node 22.13+ in the 22.x line. Copy .env.server.example to .env.server privately,
set the Supabase URL/publishable key, and keep PUBLIC_ORIGIN equal to
http://localhost:8081. Run npm ci --ignore-scripts, npm run build and npm start.
If you choose a different port, update PORT and PUBLIC_ORIGIN together.

Without Redis settings, development uses private-data/managed.sqlite and a private
local encryption key. If you set Upstash locally, also supply AUTH_ENCRYPTION_KEY.
The production server requires the Upstash settings and an explicit encryption key.
Production never silently falls back to local or /tmp SQLite.

## Boundaries

- Web sessions expire within seven days; recovery authorization expires within ten
  minutes. Verification allows five attempts and a sixty-second resend cooldown.
- Redis rate limits and request locks are shared across Vercel instances. Auth reads
  use write-capable operations on the primary to avoid stale replica session state.
- Global logout deletes that user's stored web sessions. Updates cannot resurrect
  already deleted sessions. Existing provider access JWTs may remain valid until
  their expiry; configure provider JWT/session lifetime policies appropriately.
- Local logout clears cookies even during provider/storage outages and reports
  incomplete remote revocation.
- Library/history remain on the device. Login does not create cloud library sync
  or separate private device collections.
- SQLite sessions are not copied into Redis during this upgrade. Users may need to
  sign in again. The device library is unaffected by that server-state migration.
- The authenticated encryption format also changed. Older local SQLite session
  records fail validation and require a new sign-in.
- The uploaded package contains a prebuilt web client. Native source/builds and
  actual Android linking are outside the supplied archive.

Local fixtures exercise the real Supabase SDK and server routes. They do not verify
real email/SMS delivery or a live Google consent configuration.
