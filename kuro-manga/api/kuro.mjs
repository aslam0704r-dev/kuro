import { authRoute } from '../server/auth/routes.mjs';
import { proxy } from '../server/proxy.mjs';

// Vercel serverless adapter for Kuro's existing same-origin endpoints.
// Static web files are served directly by Vercel from dist/.
export default async function handler(req, res) {
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost').split(',')[0].trim();
  const url = new URL(req.url || '/', `${proto}://${host}`);

  // vercel.json rewrites API paths to this one function and passes the original path.
  const routedPath = url.searchParams.get('__route');
  if (routedPath && routedPath.startsWith('/')) {
    url.pathname = routedPath;
    url.searchParams.delete('__route');
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-store');

  if (url.pathname === '/__proxy') {
    await proxy(req, res, url);
    return;
  }
  if (await authRoute(req, res, url)) return;

  res.statusCode = 404;
  res.end('Not found');
}
