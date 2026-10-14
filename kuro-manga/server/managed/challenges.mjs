import { address, password, fail, cookieId, setCookie, challengeView } from './http.mjs';
import { provider, establish } from './provider.mjs';
import { limited, read, save, remove } from './store.mjs';
async function throttle(destination) {
  if (await limited('send:' + destination, 1, 60) || await limited('hour:' + destination, 8, 3600)) fail('Please wait before requesting another code.', 429);
}
// Old deployments may have saved SMS challenges. Invalidate them before any
// resend/verification/provider operation, including the session projection.
export async function emailChallenge(req, res) {
  const id=cookieId(req,'challenge'), c=await read(id,'challenge');
  if(c && c.channel!=='email') { await remove(id);setCookie(res,'challenge','',0);return null; }
  return c;
}
export async function sendChallenge(req, res, input, action) {
  if(Object.hasOwn(input,'phone') || Object.hasOwn(input,'channel') && input.channel!=='email') fail('Phone sign-in is unavailable. Use your email address.');
  let c;
  if (action === 'resend') {
    c = await emailChallenge(req,res); if (!c) fail('Start a new email verification request.');
  } else {
    const kind = (action === 'signup' || action === 'verification') ? 'signup' : action === 'recovery' ? 'recovery' : 'login';
    const channel = 'email';
    c = { kind, channel, address: address(input.address || input.email, channel), tries: 0 };
  }
  await throttle(c.address); const { client } = provider(); let error;
  if (c.kind === 'signup' && action === 'signup') {
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (name.length < 2 || name.length > 60) fail('Use a display name of 2–60 characters');
    const result = await client.auth.signUp({ email: c.address, password: password(input.password), options: { data: { display_name: name } } });
    error = result.error;
    if (result.data.session) { await client.auth.signOut(); fail('Administrator: enable Confirm email in Supabase before allowing signup.', 503); }
  } else if (c.kind === 'signup') ({ error } = await client.auth.resend({ type: 'signup', email: c.address }));
  else if (c.kind === 'recovery') ({ error } = await client.auth.resetPasswordForEmail(c.address));
  else ({ error } = await client.auth.signInWithOtp({ email: c.address, options: { shouldCreateUser: true } }));
  if (error && error.code !== 'user_not_found') fail('Code request could not be completed. Try later or contact the administrator.', error.status === 429 ? 429 : 400);
  await remove(cookieId(req, 'challenge')); c.sentAt = Date.now(); c.tries = 0;
  const id = await save('challenge', c, 600); setCookie(res, 'challenge', id, 600);
  return { challenge: challengeView({ ...c, expires: Date.now() + 600000 }), message: 'If this email is eligible, a verification code will arrive. Check your inbox.' };
}
export async function verifyChallenge(req, res, input) {
  const id = cookieId(req, 'challenge'), c = await emailChallenge(req,res);
  if (!c || c.tries >= 5) fail('This verification attempt has expired. Request a new code.');
  if (typeof input.code !== 'string' || !/^\d{6,8}$/.test(input.code)) fail('Enter the code from your message.');
  c.tries++;
  if (!await save('challenge', c, Math.max(1, (c.expires - Date.now()) / 1000), '', id)) fail('This verification attempt has expired. Request a new code.');
  const { client } = provider();
  const payload = { email: c.address, token: input.code, type: c.kind === 'signup' ? 'signup' : c.kind === 'recovery' ? 'recovery' : 'email' };
  const { data, error } = await client.auth.verifyOtp(payload);
  if (error) fail('Code is incorrect or expired. Request another code if needed.');
  const result = await establish(req, res, data.session, c.kind === 'recovery'); await remove(id); return result;
}
