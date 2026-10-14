import { createClient } from '@supabase/supabase-js';
import { url, key, safeUser } from './config.mjs';
import { cookieId, setCookie, fail } from './http.mjs';
import { read, save, remove, removeUser } from './store.mjs';
export function provider(entries = {}) {
  const storage = { getItem: k => entries[k] ?? null, setItem: (k, v) => { entries[k] = v; }, removeItem: k => { delete entries[k]; } };
  const client = createClient(url, key, { auth: { storage, storageKey: 'kuro-managed', persistSession: true, autoRefreshToken: false, detectSessionInUrl: false, flowType: 'pkce' },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) } });
  return { client, entries };
}
function storedSession(session, userId) {
  if (session.access_token.length > 16384 || session.refresh_token.length > 4096) fail('Session is too large. Contact the administrator.');
  return { access_token: session.access_token, refresh_token: session.refresh_token, user: { id: userId } };
}
export async function establish(req, res, session, recovery = false) {
  if (!session?.access_token || !session.refresh_token) fail('Verification did not create a session');
  const { client } = provider(); const { data, error } = await client.auth.getUser(session.access_token);
  if (error || !data.user?.email || !data.user.email_confirmed_at) fail('A verified email is required. Link and verify your email before signing in.', 403);
  await remove(cookieId(req, 'session'));
  const seconds = recovery ? 600 : 7 * 86400;
  const id = await save('session', { session: storedSession(session, data.user.id), recovery }, seconds, data.user.id);
  setCookie(res, 'session', id, seconds);
  await remove(cookieId(req, 'challenge')); setCookie(res, 'challenge', '', 0);
  return { user: safeUser(data.user), recovery, challenge: null, configured: true };
}
export async function current(req, res) {
  const id = cookieId(req, 'session'), record = await read(id, 'session'); if (!record) return null;
  const { client } = provider();
  const { data, error } = await client.auth.setSession({ access_token: record.session.access_token, refresh_token: record.session.refresh_token });
  if (error && (!error.status || error.status >= 500 || error.status === 429)) fail('Account service temporarily unavailable. Please retry.', 503);
  if (error || !data.session) { await remove(id); setCookie(res, 'session', '', 0); return null; }
  const verified = await client.auth.getUser(data.session.access_token);
  if (verified.error && (!verified.error.status || verified.error.status >= 500 || verified.error.status === 429)) fail('Account service temporarily unavailable. Please retry.', 503);
  if (verified.error || !verified.data.user?.email || !verified.data.user.email_confirmed_at) { await remove(id); setCookie(res, 'session', '', 0); return null; }
  const remaining = Math.max(0, (record.expires - Date.now()) / 1000);
  const updated = remaining > 0 && await save('session', { session: storedSession(data.session, verified.data.user.id), recovery: record.recovery }, remaining, verified.data.user.id, id);
  if (!updated) { setCookie(res, 'session', '', 0); return null; }
  return { client, user: verified.data.user, recovery: record.recovery, id };
}
/** Local sign-out succeeds when provider revocation is temporarily unavailable. */
export async function logout(req, res, everywhere = false, known) {
  const id = cookieId(req, 'session'), record = await read(id, 'session'); let warning = false;
  try {
    const active = known || await current(req, res);
    if (active) { const { error } = await active.client.auth.signOut({ scope: everywhere ? 'global' : 'local' }); warning = !!error; }
  } catch { warning = !!record; }
  if (everywhere && record?.session?.user?.id) await removeUser(record.session.user.id);
  await remove(id); setCookie(res, 'session', '', 0);
  await remove(cookieId(req, 'challenge')); setCookie(res, 'challenge', '', 0);
  await remove(cookieId(req, 'flow')); setCookie(res, 'flow', '', 0);
  return { user: null, recovery: false, challenge: null, message: warning ? 'Signed out here. Remote revocation failed; sign in later and use Sign out on all devices.' : 'Signed out.' };
}
