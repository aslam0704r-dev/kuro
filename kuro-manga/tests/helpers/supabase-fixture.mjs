import http from 'node:http';
import { once } from 'node:events';
import { randomUUID, createHash } from 'node:crypto';
export async function supabaseFixture() {
  const users = new Map(), tokens = new Map(), codes = new Set();
  let url, challenge = '', usedGoogle = false, unavailable = false;
  function user(destination, phone = false, verified = true) {
    if (!users.has(destination)) users.set(destination, { id: randomUUID(), aud: 'authenticated', role: 'authenticated',
      email: phone ? '' : destination, phone: phone ? destination : '', created_at: new Date().toISOString(),
      email_confirmed_at: !phone && verified ? new Date().toISOString() : null,
      phone_confirmed_at: phone && verified ? new Date().toISOString() : null,
      user_metadata: { display_name: 'Fixture Reader' }, app_metadata: { provider: phone ? 'phone' : 'email' },
      identities: [], password: 'reader-password-123' });
    return users.get(destination);
  }
  function session(account) {
    const expiry = Math.floor(Date.now() / 1000) + 3600;
    const access = Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url') + '.' +
      Buffer.from(JSON.stringify({ sub: account.id, email: account.email, exp: expiry, aud: 'authenticated', role: 'authenticated',
        iss: url + '/auth/v1', session_id: randomUUID() })).toString('base64url') + '.' + Buffer.from('fixture-signature').toString('base64url');
    tokens.set(access, account);
    return { access_token: access, refresh_token: 'fixture-refresh-' + randomUUID(), token_type: 'bearer',
      expires_in: 3600, expires_at: expiry, user: publicUser(account) };
  }
  function publicUser(account) { const { password, ...safe } = account; return safe; }
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const respond = (status, body) => { res.writeHead(status); res.end(JSON.stringify(body)); };
    if (unavailable) { respond(503, { message: 'Fixture provider unavailable' }); return; }
    const address = new URL(req.url, url), chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const input = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {};
    const account = tokens.get(String(req.headers.authorization || '').replace(/^Bearer /, ''));
    if (address.pathname === '/auth/v1/user') {
      if (!account) return respond(401, { message: 'Invalid token', code: 'bad_jwt' });
      if (req.method === 'PUT' && input.password) account.password = input.password;
      return respond(200, publicUser(account));
    }
    if (address.pathname === '/auth/v1/logout') return respond(200, {});
    if (address.pathname === '/auth/v1/token') {
      if (address.searchParams.get('grant_type') === 'password') {
        const found = user(input.email);
        if (input.password !== found.password) return respond(400, { error: 'invalid_grant', error_description: 'Invalid credentials' });
        return respond(200, session(found));
      }
      if (address.searchParams.get('grant_type') === 'pkce') {
        const actual = createHash('sha256').update(input.code_verifier || '').digest('base64url');
        if (input.auth_code !== 'fixture-google-code' || actual !== challenge || usedGoogle) return respond(400, { message: 'Invalid PKCE code' });
        usedGoogle = true; return respond(200, session(user('google@example.com')));
      }
    }
    if (address.pathname === '/auth/v1/signup') {
      const found = user(input.email, false, false); found.password = input.password;
      found.user_metadata = input.data || {}; codes.add('signup:' + input.email);
      return respond(200, publicUser(found));
    }
    if (['/auth/v1/otp', '/auth/v1/recover', '/auth/v1/resend'].includes(address.pathname)) {
      const destination = input.phone || input.email;
      user(destination, !!input.phone);
      const type = address.pathname.endsWith('/recover') ? 'recovery' : address.pathname.endsWith('/resend') ? input.type : input.phone ? 'sms' : 'email';
      codes.add(type + ':' + destination); return respond(200, {});
    }
    if (address.pathname === '/auth/v1/verify') {
      const destination = input.phone || input.email, code = input.type + ':' + destination;
      if (input.token !== '654321' || !codes.has(code)) return respond(400, { message: 'Token expired or invalid', code: 'otp_expired' });
      codes.delete(code); const found = user(destination, !!input.phone);
      if (input.phone) found.phone_confirmed_at = new Date().toISOString(); else found.email_confirmed_at = new Date().toISOString();
      return respond(200, session(found));
    }
    respond(404, { message: 'Fixture endpoint not implemented' });
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening'); url = 'http://127.0.0.1:' + server.address().port;
  return { url, setGoogleChallenge(value) { challenge = value; usedGoogle = false; }, setFailure(value) { unavailable = value; },
    async close() { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
}
