import { authRoute } from '../server/auth/routes.mjs';
import { profileRoute } from '../server/profile/routes.mjs';
import { catalogueRoute } from '../server/catalogue/routes.mjs';
import { proxy } from '../server/proxy.mjs';

// Vercel serverless adapter for Kuro's existing same-origin endpoints.
// Static web files are served directly by Vercel from dist/.
export function resolveRequestUrl(req) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost').split(',')[0].trim();
  const url = new URL(req.url || '/', `${proto}://${host}`);

  // vercel.json rewrites API paths to this one function and passes the original path.
  const routedPath = url.searchParams.get('__route') || (typeof req.query?.__route === 'string' ? req.query.__route : '');
  if (routedPath && routedPath.startsWith('/')) {
    url.pathname = routedPath;
  }
  // Vercel can forward the rewrite capture as an additional query field.
  // Its name is reserved for transport; preserve the public MangaDex "path" field.
  url.searchParams.delete('__route');
  url.searchParams.delete('kuroPath');
  return url;
}

export default async function handler(req, res) {
  const url = resolveRequestUrl(req);

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');

  if (url.pathname === '/__proxy') {
    await proxy(req, res, url);
    return;
  }
  if (await authRoute(req, res, url)) return;
  if (await profileRoute(req, res, url)) return;
  if (await catalogueRoute(req, res, url)) return;

  res.statusCode = 404;
  res.end('Not found');
}
