import { production, origin } from './config.mjs';
import { isIP } from 'node:net';
export function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body));
}
export const cookieName = kind => `${production ? '__Host-' : ''}kuro_m_${kind}`;
export function cookieId(req, kind) { return new RegExp(`(?:^|;\\s*)${cookieName(kind)}=([a-f0-9]{64})(?:;|$)`).exec(req.headers.cookie || '')?.[1] || ''; }
export function setCookie(res, kind, id, seconds) {
  const current = res.getHeader('Set-Cookie') || [];
  res.setHeader('Set-Cookie', [...(Array.isArray(current) ? current : [current]), `${cookieName(kind)}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${production || process.env.AUTH_SECURE_COOKIE === 'true' ? '; Secure' : ''}`]);
}
export function assertOrigin(req) {
  if (req.headers.origin !== origin(req) || req.headers['sec-fetch-site'] === 'cross-site') throw Object.assign(new Error('Origin not allowed'), { status: 403 });
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type']?.trim() || '')) throw Object.assign(new Error('Send JSON'), { status: 415 });
}
export async function bodyOf(req) {
  // Vercel consumes JSON streams and supplies req.body; the local server supplies a stream.
  let result;
  if (req.body !== undefined) {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8')
      : typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!raw || Buffer.byteLength(raw) > 8192) fail('Request too large', 413);
    result = JSON.parse(raw);
  } else {
    let size = 0; const chunks = [];
    for await (const value of req) {
      const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
      size += chunk.length; if (size > 8192) fail('Request too large', 413); chunks.push(chunk);
    }
    result = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  if (!result || Array.isArray(result) || typeof result !== 'object') throw new Error('Invalid request'); return result;
}
export function fail(message, status = 400) { throw Object.assign(new Error(message), { status }); }
export function clientAddress(req) {
  if (process.env.VERCEL === '1') {
    const value = String(req.headers['x-vercel-forwarded-for'] || '').split(',')[0].trim();
    if (isIP(value)) return value;
  }
  return req.socket?.remoteAddress || 'unknown';
}
export function address(value, channel) {
  if (typeof value !== 'string') fail('Enter an email or international phone number');
  const result = value.trim();
  if (channel === 'sms') { if (!/^\+[1-9]\d{7,14}$/.test(result)) fail('Use international format, for example +919876543210'); return result; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result) || result.length > 254) fail('Enter a valid email address'); return result.toLowerCase();
}
export function password(value) { if (typeof value !== 'string' || value.length < 12 || value.length > 128) fail('Use a password of 12–128 characters'); return value; }
export function challengeView(c) {
  if (!c) return null;
  return { channel: c.channel, kind: c.kind, destination: c.channel === 'sms' ? `••••${c.address.slice(-4)}` : `${c.address.slice(0, 1)}•••@${c.address.split('@')[1]}`, expiresAt: c.expires, resendAt: c.sentAt + 60000 };
}
