import { address, password, fail, cookieId, setCookie, challengeView } from './http.mjs';
import { provider, establish } from './provider.mjs';
import { limited, read, save, remove } from './store.mjs';
async function throttle(destination) {
  if (await limited('send:' + destination, 1, 60) || await limited('hour:' + destination, 8, 3600)) fail('Please wait before requesting another code.', 429);
}
export async function sendChallenge(req, res, input, action) {
  let c;
  if (action === 'resend') {
    c = await read(cookieId(req, 'challenge'), 'challenge'); if (!c) fail('Start a new verification request.');
  } else {
    const kind = (action === 'signup' || action === 'verification') ? 'signup' : action === 'recovery' ? 'recovery' : 'login';
    const channel = input.channel === 'sms' && kind === 'login' ? 'sms' : 'email';
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
  else if (c.channel === 'sms') ({ error } = await client.auth.signInWithOtp({ phone: c.address, options: { shouldCreateUser: true } }));
  else ({ error } = await client.auth.signInWithOtp({ email: c.address, options: { shouldCreateUser: true } }));
  if (error && error.code !== 'user_not_found') fail('Code request could not be completed. Try later or contact the administrator.', error.status === 429 ? 429 : 400);
  await remove(cookieId(req, 'challenge')); c.sentAt = Date.now(); c.tries = 0;
  const id = await save('challenge', c, 600); setCookie(res, 'challenge', id, 600);
  return { challenge: challengeView({ ...c, expires: Date.now() + 600000 }), message: 'If this destination is eligible, a verification code will arrive. Check your inbox or messages.' };
}
export async function verifyChallenge(req, res, input) {
  const id = cookieId(req, 'challenge'), c = await read(id, 'challenge');
  if (!c || c.tries >= 5) fail('This verification attempt has expired. Request a new code.');
  if (typeof input.code !== 'string' || !/^\d{6,8}$/.test(input.code)) fail('Enter the code from your message.');
  c.tries++;
  if (!await save('challenge', c, Math.max(1, (c.expires - Date.now()) / 1000), '', id)) fail('This verification attempt has expired. Request a new code.');
  const { client } = provider();
  const payload = c.channel === 'sms' ? { phone: c.address, token: input.code, type: 'sms' }
    : { email: c.address, token: input.code, type: c.kind === 'signup' ? 'signup' : c.kind === 'recovery' ? 'recovery' : 'email' };
  const { data, error } = await client.auth.verifyOtp(payload);
  if (error) fail('Code is incorrect or expired. Request another code if needed.');
  const result = await establish(req, res, data.session, c.kind === 'recovery'); await remove(id); return result;
}
