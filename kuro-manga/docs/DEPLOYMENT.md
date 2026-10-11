# Hosting this web release

For Vercel, follow [../VERCEL-DEPLOY.md](../VERCEL-DEPLOY.md). The static output is
dist/; /api/auth/* and /__proxy are handled by the included Node Vercel function.

For another Node host, use Node 22.13+ in the 22.x line, install with
npm ci --ignore-scripts, run npm run build, then npm start. Set NODE_ENV=production,
an exact HTTPS PUBLIC_ORIGIN, your Supabase settings, an explicit encryption key
and the Upstash REST settings. Configure the reverse proxy to preserve Host and
serve only the intended public domain.

The server does not trust arbitrary forwarding headers outside Vercel. Clients
behind another reverse proxy share its address for the local IP limit; configure
edge limits appropriate to that host. Vercel uses its platform-supplied client IP.

Production account state is in Redis. Development can use private SQLite.
Environment files and private-data/ are excluded from both Git and Vercel uploads.
The included build command validates the prebuilt export; original Expo/native
source was not present in the upload.
