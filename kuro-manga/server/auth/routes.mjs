import { configured, configurationIssue, safeUser } from '../managed/config.mjs';
import { send, assertOrigin, bodyOf, cookieId, setCookie, address, password, fail, challengeView, clientAddress } from '../managed/http.mjs';
import { storageIssue, limited, read, remove, serialize } from '../managed/store.mjs';
import { current, provider, establish, logout } from '../managed/provider.mjs';
import { sendChallenge, verifyChallenge } from '../managed/challenges.mjs';
import { beginGoogle, finishGoogle } from '../managed/oauth.mjs';
export async function authRoute(req, res, url) {
  if (!url.pathname.startsWith('/api/auth/')) return false;
  const action = url.pathname.slice('/api/auth/'.length);
  let logoutBody;
  const localLogout = () => {
    for (const kind of ['session', 'challenge', 'flow']) setCookie(res, kind, '', 0);
    send(res, 200, { user: null, recovery: false, challenge: null,
      message: 'Signed out here. Remote revocation could not be completed; sign in later and use Sign out on all devices.' });
  };
  try {
    // Local logout remains available during a storage outage, after the CSRF/body checks.
    if (action === 'logout' && req.method === 'POST') { assertOrigin(req); logoutBody = await bodyOf(req); }
    if (!configured || storageIssue) {
      if (logoutBody) { localLogout(); return true; }
      send(res, action === 'session' ? 200 : 503, { configured: false, user: null, recovery: false, challenge: null, error: configurationIssue || storageIssue }); return true;
    }
    const ip = clientAddress(req);
    if (await limited('ip:' + req.method + ':' + ip, req.method === 'GET' ? 120 : 35, 900)) fail('Too many requests. Please try later.', 429);
    await serialize(cookieId(req, 'session') || cookieId(req, 'challenge') || cookieId(req, 'flow') || ip, async () => {
      if (action === 'session' && req.method === 'GET') {
        const active = await current(req, res);
        send(res, 200, { configured: true, user: active ? safeUser(active.user) : null, recovery: !!active?.recovery,
          challenge: challengeView(await read(cookieId(req, 'challenge'), 'challenge')) }); return;
      }
      if (action === 'callback' && req.method === 'GET') {
        try { await finishGoogle(req, res, url); res.writeHead(303, { Location: '/account', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }); }
        catch { res.writeHead(303, { Location: '/account?notice=oauth_failed', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' }); }
        res.end(); return;
      }
      if (req.method !== 'POST') fail('Method not allowed', 405);
      assertOrigin(req); const body = logoutBody || await bodyOf(req);
      let result;
      if (['signup', 'otp', 'recovery', 'verification', 'resend'].includes(action)) result = await sendChallenge(req, res, body, action);
      else if (action === 'verify') result = await verifyChallenge(req, res, body);
      else if (action === 'login') {
        const email = address(body.email, 'email');
        if (await limited('login:' + email, 10, 900)) fail('Too many attempts. Try later.', 429);
        const { client } = provider();
        const { data, error } = await client.auth.signInWithPassword({ email, password: password(body.password) });
        if (error) fail('Unable to sign in. Check your details or verify your email.', 401);
        result = await establish(req, res, data.session);
      } else if (action === 'google') result = await beginGoogle(req, res);
      else if (action === 'cancel') { await remove(cookieId(req, 'challenge')); setCookie(res, 'challenge', '', 0); result = { challenge: null }; }
      else if (action === 'logout') result = await logout(req, res, !!body.everywhere);
      else if (action === 'password') {
        const active = await current(req, res);
        if (!active?.recovery) fail('First verify the recovery code sent to your email.', 403);
        const { error } = await active.client.auth.updateUser({ password: password(body.password) });
        if (error) fail('Password could not be updated. Use a stronger password or start recovery again.');
        result = await logout(req, res, true, active);
        result.message = result.message === 'Signed out.' ? 'Password updated. Sign in again with your new password.' : 'Password updated. ' + result.message;
      } else fail('Unknown authentication action', 404);
      send(res, 200, result);
    });
  } catch (error) {
    if (logoutBody && error.status === 503) localLogout();
    else send(res, error.status || 400, { error: error.status ? error.message : 'Authentication request could not be completed. Please retry.' });
  }
  return true;
}
