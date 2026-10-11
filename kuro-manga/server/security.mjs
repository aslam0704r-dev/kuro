import { createHash } from 'node:crypto';
/** RN Web needs inline styles, not inline/eval scripts. Hash only exported bootstrap scripts. */
export function securityHeaders(html, production = false) {
  const hashes = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(match => !/\bsrc\s*=/.test(match[1]) && match[2].trim())
    .map(match => `'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`);
  return {
    'Content-Security-Policy': `default-src 'self'; script-src 'self' ${hashes.join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'self';${production ? " frame-ancestors 'self';" : ''}`,
    'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    ...(production ? { 'Strict-Transport-Security': 'max-age=31536000' } : {}),
  };
}
export function safeProxyType(type = '') {
  return /^image\/(?:png|jpeg|jpg|gif|webp|avif|bmp|svg\+xml)(?:;|$)/i.test(type) ? type : 'text/plain; charset=utf-8';
}
