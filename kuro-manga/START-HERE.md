# Start KURO 4.6.0

Read [the current loading/source-selection report](docs/PROVIDER-LOADING-4.6.0.md) and [PROVIDERS-SETUP.md](PROVIDERS-SETUP.md). Verified sources start on in fresh settings; additional directory entries can be selected individually. Working connections, content approval and complete-chapter checks still determine what can be shown.

Read [READABLE-CATALOGUE.md](READABLE-CATALOGUE.md) for email login, complete-chapter checks, deduplication and the inventory count's scope. The earlier 72-of-100 sample is a historical partial audit; it does not establish a current catalogue total and was not repeated for this release.

Read [STRICT-CONTENT.md](STRICT-CONTENT.md) for the mandatory no-adult and unverified-content rules, provider audit, device-file review and deployment.

1. Extract the full source ZIP into a clean folder with package.json and vercel.json at its root.
2. Use Node 22.x. Run `npm ci --ignore-scripts`, `npm run build`, then `npm start`.
3. Open http://localhost:8081. Library → Import manga accepts reviewed files only. The approved demo is `tests/fixtures/safe-device-demo.cbz`.
4. For Vercel, deploy the whole source to your existing project and retain the existing private server configuration. See [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md).
5. Reload existing tabs/native apps after deployment; keep device storage intact.

Unapproved title records stay hidden without deletion. Provider entries can have saved selections; only two positive rating contracts currently admit remote content: MangaDex safe reading and AniList non-adult metadata. See [provider policy audit](docs/CONTENT-PROVIDER-AUDIT.csv).

Profile/name/private-photo setup remains in [PROFILE-SETUP.md](PROFILE-SETUP.md). Its existing Supabase SQL is included. The strict-content feature needs no new migration or private key. Android/Windows downloads and source remain included; read [NATIVE-INSTALL-SETUP.md](NATIVE-INSTALL-SETUP.md).

The release uses maintained companion modules and the unchanged original exported app. The original editable Expo source was not available. Test scope and limitations are in [CONTENT-TEST-RESULTS.md](docs/CONTENT-TEST-RESULTS.md).
