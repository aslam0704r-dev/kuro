import { displayName } from '../profile/data.mjs';
export const url = process.env.SUPABASE_URL || '';
export const key = process.env.SUPABASE_PUBLISHABLE_KEY || '';
export const production = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
function issue() {
  if (!url || !key) return 'Managed authentication is not configured. Ask the administrator to connect Supabase.';
  const testTransport = process.env.AUTH_TEST_MODE === '1' && !production && /^http:\/\/127\.0\.0\.1:\d+$/.test(url);
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) && !testTransport) return 'Authentication requires a standard HTTPS Supabase project URL.';
  if (!key.startsWith('sb_publishable_')) {
    try {
      if (key.split('.').length !== 3 || JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role !== 'anon') throw new Error();
    } catch { return 'Authentication requires a publishable or legacy anon key. Secret and service-role keys are not accepted.'; }
  }
  if (production) {
    try {
      const publicOrigin = new URL(process.env.PUBLIC_ORIGIN || '');
      if (publicOrigin.protocol !== 'https:' || publicOrigin.origin !== process.env.PUBLIC_ORIGIN || publicOrigin.username || publicOrigin.password) throw new Error();
    } catch { return 'Authentication requires PUBLIC_ORIGIN to be the exact production HTTPS origin.'; }
  }
  return '';
}
export const configurationIssue = issue();
export const configured = !configurationIssue;
export function origin(req) { return process.env.PUBLIC_ORIGIN || `http://${req.headers.host}`; }
export function safeUser(user) {
  return { id: user.id, name: displayName(user),
    email: user.email || '', emailVerified: !!user.email_confirmed_at };
}
