import { provider, establish } from './provider.mjs';
import { origin } from './config.mjs';
import { cookieId, setCookie, fail } from './http.mjs';
import { save, read, remove } from './store.mjs';
export async function beginGoogle(req, res) {
  const { client, entries } = provider();
  const { data, error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: origin(req) + '/api/auth/callback', skipBrowserRedirect: true } });
  if (error || !data.url) fail('Google sign-in is unavailable. Check provider configuration.');
  if (new URL(data.url).searchParams.get('code_challenge_method') !== 's256') fail('Secure OAuth requires S256 PKCE.', 503);
  await remove(cookieId(req, 'flow'));
  const id = await save('flow', { entries }, 600); setCookie(res, 'flow', id, 600);
  return { url: data.url };
}
export async function finishGoogle(req, res, url) {
  const id = cookieId(req, 'flow'), flow = await read(id, 'flow');
  await remove(id); setCookie(res, 'flow', '', 0);
  if (!flow || url.searchParams.has('error') || !url.searchParams.get('code')) fail('Google sign-in expired or was cancelled. Start again.');
  const { client } = provider(flow.entries);
  const { data, error } = await client.auth.exchangeCodeForSession(url.searchParams.get('code'));
  if (error) fail('Google sign-in could not be verified. Start again.');
  await establish(req, res, data.session);
}
