# Deploy KURO 3.6.2 to Vercel

## 1. Import the correct project folder

Extract the ZIP, then put its contents in your repository. The repository/project
root must contain package.json, vercel.json, api/, server/, scripts/ and dist/.
This ZIP removes the original kuro-main/Kuro-manga wrapper.

Import that repository in Vercel. Choose **Other** for the framework and leave the
Root Directory at the folder containing vercel.json. The included configuration sets:

| Setting | Value |
|---|---|
| Install command | npm ci --ignore-scripts |
| Build command | npm run build |
| Output directory | dist |
| Node version | 22.x, from package.json |

The client is already exported. The build command prepares and validates that
export. Icon and navigation assets are under dist/assets/vendor/ because Vercel CLI
excludes node_modules directories. See [Vercel's default exclusions](https://vercel.com/docs/builds/build-features).
Run npm run build before uploading any future replacement Expo export.

You can deploy guest browsing before configuring accounts. Missing auth settings
show a setup message and do not create fake accounts or break the source proxy.

## 2. Configure shared authentication state

Create an Upstash Redis database or connect one through the Vercel Marketplace.
Use its HTTPS REST endpoint and full REST token. A read-only token cannot support
sessions, rate limits and OAuth state. Keep the token private. Choose a primary
region near the Vercel function region and avoid key eviction for this auth store.
See [Upstash's Vercel integration](https://upstash.com/docs/redis/howto/vercelintegration).

Set these in Vercel **Settings → Environment Variables → Production**:

| Name | Value |
|---|---|
| SUPABASE_URL | Your standard https://PROJECT.supabase.co URL |
| SUPABASE_PUBLISHABLE_KEY | Your publishable key, or a legacy anon key |
| PUBLIC_ORIGIN | Exact public HTTPS origin, such as https://your-project.vercel.app, with no trailing slash |
| AUTH_ENCRYPTION_KEY | A stable, private 32-byte random key encoded as base64 |
| UPSTASH_REDIS_REST_URL | Your https://…upstash.io REST endpoint |
| UPSTASH_REDIS_REST_TOKEN | Your private full REST token |
| AUTH_KEY_PREFIX | Recommended: a unique namespace such as kuro:yourproject:production |

Generate the encryption key locally:

~~~powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
~~~

Enter the result directly in Vercel's settings. Keep a private backup. Changing
the encryption key makes existing encrypted sessions unreadable and requires
users to sign in again. Do not paste it into chat, commit it, or put it in any
client/public environment variable.

AUTH_DB is for local development. Do not configure /tmp SQLite as the production
store. Production auth stays disabled until the shared-store settings are valid.
The server keeps provider tokens and PKCE material encrypted; the browser gets
opaque HttpOnly, Secure, SameSite=Lax cookies.

## 3. Enable Google in Supabase

In Google Auth Platform create a **Web application** OAuth client. Add your app's
HTTPS origin under Authorized JavaScript origins. Set the authorized redirect URI
to the callback shown on Supabase's Google provider page.

| Dashboard field | URL |
|---|---|
| Google authorized redirect URI | https://PROJECT.supabase.co/auth/v1/callback |
| Supabase Site URL | Your PUBLIC_ORIGIN |
| Supabase allowed redirect URL | https://YOUR-KURO-HOST/api/auth/callback |

Enable Google in Supabase and enter the Google client ID and client secret there.
Add permitted test users while the Google app is in testing mode. Publish the
consent configuration before opening it to other users. Follow the
[Supabase Google setup guide](https://supabase.com/docs/guides/auth/social-login/auth-google?platform=web).

The Google secret belongs in Supabase. Redis credentials and the encryption key
belong in Vercel's server environment. None belong in dist/ or a release ZIP.

## 4. Enable the other account methods

Follow [docs/ACCOUNTS.md](docs/ACCOUNTS.md). Email signup requires Confirm email.
Email OTP and password recovery use numeric codes: install the supplied Supabase
email templates and configure a production SMTP sender. SMS requires Supabase's
Phone provider and an SMS service; keep that service's credentials in Supabase.
Passwords must be 12–128 characters and phone numbers must use E.164 format.

## 5. Redeploy and check

Redeploy after saving environment/provider settings. Always open the exact
PUBLIC_ORIGIN when testing auth. A www/non-www, preview/production, or old/new
hostname mismatch will break origin checks or OAuth cookies.

- Open /account, try Google, and confirm it returns to the signed-in account.
- Try a verified email/password, email code, SMS code and recovery with accounts
  and delivery providers you control.
- Check /manifest.webmanifest and /icons/kuro-192.png.
- The welcome install dialog appears after about 3.5 seconds on a fresh visit.
  Not now suppresses it for seven days. Settings → Install KURO reopens it.
- The popup shows Install KURO and Not now. Install KURO opens the browser's
  native installer when offered, or expands device-specific menu instructions.
  If Chrome already shows Open in app, use it to launch the installed app.

For Preview auth, use a stable preview origin, an exact callback allowlist entry,
and a separate AUTH_KEY_PREFIX/encryption key. Do not share production session
state across unrelated preview projects. Supabase recommends exact production
redirect URLs; see [redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).

## Troubleshooting

| Symptom | Check |
|---|---|
| Blank icons or a font URL returns HTML | Project root/output directory; assets/vendor files were committed/uploaded; latest bundle is served |
| Popup is absent | Seven-day dismissal, installed standalone mode, reader/auth route suppression; reopen from Settings |
| Install KURO opens instructions | Browser has not offered its installer; follow the steps. Chrome's Open in app means an installed app can be opened. |
| Popup still has only Not now | Serve the new ZIP's dist/install.js and refresh the page |
| Setup required / HTTP 503 | All production env values, full Redis token, Upstash availability |
| HTTP 403 on login | PUBLIC_ORIGIN exactly matches the address bar |
| OAuth failed | Both callback settings, same browser/domain, flow within ten minutes, Google provider/test-user settings |

The code was checked locally with a controlled auth provider and Redis. Real Google
consent, email/SMS delivery and your live Vercel deployment still need these account
settings and a deployment check.
