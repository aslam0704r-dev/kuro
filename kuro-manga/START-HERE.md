# Start KURO locally

1. Extract this ZIP into a new folder. package.json, vercel.json and dist/ must be
   directly inside that folder.
2. Install Node 22.13+ in the 22.x line.
3. Run npm ci --ignore-scripts, then npm run build.
4. Run npm start and open http://localhost:8081.

Guest browsing works immediately. To test real accounts locally, copy
.env.server.example to .env.server and follow [docs/ACCOUNTS.md](docs/ACCOUNTS.md).
Local development uses SQLite when Redis is unset; production requires Upstash.
Keep the same browser host/port to retain the device's library and history.

For Vercel, use [VERCEL-DEPLOY.md](VERCEL-DEPLOY.md). Tests and their requirements
are in [tests/README.md](tests/README.md). This is a PWA web release; the uploaded
archive does not contain source to produce a signed Android APK.
