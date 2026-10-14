import { randomBytes } from 'node:crypto';
import { configured, configurationIssue } from '../managed/config.mjs';
import { send, assertSameOrigin, assertOrigin, bodyOf, cookieId, clientAddress, fail } from '../managed/http.mjs';
import { current } from '../managed/provider.mjs';
import { limited, serialize, storageIssue } from '../managed/store.mjs';
import { BUCKET, avatarPath, profileView, validateName } from './data.mjs';
import { imageBody, normalizeImage, MAX_BYTES } from './images.mjs';

function unavailable(error) {
  if (error) fail('Profile storage is unavailable. Retry or ask the administrator to check the avatar migration.', 503);
}
async function update(active, data) {
  const result = await active.client.auth.updateUser({ data });
  if (result.error) throw Object.assign(new Error('Profile storage is unavailable. Retry or ask the administrator to check the avatar migration.'), {
    status: 503, definiteWriteRejection: [400, 401, 403, 404, 422].includes(result.error.status)
  });
  if (!result.data.user || result.data.user.id !== active.user.id) fail('Profile could not be updated.', 503);
  active.user = result.data.user; return profileView(active.user);
}
export async function profileRoute(req, res, url) {
  if (url.pathname !== '/api/profile' && !url.pathname.startsWith('/api/profile/')) return false;
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    const avatar = url.pathname === '/api/profile/avatar';
    if (url.pathname !== '/api/profile' && !avatar) fail('Not found', 404);
    if (!(avatar ? ['GET', 'POST', 'DELETE'] : ['GET', 'POST']).includes(req.method)) {
      res.setHeader('Allow', avatar ? 'GET, POST, DELETE' : 'GET, POST'); fail('Method not allowed', 405);
    }
    if (req.headers['sec-fetch-site'] === 'cross-site') fail('Origin not allowed', 403);
    if (req.method !== 'GET') {
      if (avatar && req.method === 'POST') assertSameOrigin(req);
      else assertOrigin(req);
    }
    if (!configured || storageIssue) fail(configurationIssue || storageIssue, 503);
    if (await limited('profile:ip:' + clientAddress(req), 240, 900)) fail('Too many requests. Try again later.', 429);
    const sessionId = cookieId(req, 'session');
    if (!sessionId) fail('Sign in to edit your profile.', 401);
    await serialize(sessionId, async () => {
      const active = await current(req, res);
      if (!active) fail('Sign in to edit your profile.', 401);
      if (active.recovery) fail('Complete password recovery and sign in again to edit your profile.', 403);
      if (req.method !== 'GET' && req.headers['x-kuro-user'] !== undefined && req.headers['x-kuro-user'] !== active.user.id) fail('The signed-in account changed. Reload your profile and try again.', 409);
      await serialize('profile:user:' + active.user.id, async () => {
        const fresh = await active.client.auth.getUser(); unavailable(fresh.error);
        if (fresh.data.user?.id !== active.user.id) fail('Session is no longer valid.', 401);
        active.user = fresh.data.user;
        if (req.method !== 'GET' && await limited('profile:write:' + active.user.id, 20, 900)) fail('Too many profile changes. Try again in 15 minutes.', 429);
        const store = active.client.storage.from(BUCKET), previous = avatarPath(active.user);
        if (!avatar && req.method === 'GET') { send(res, 200, profileView(active.user)); return; }
        if (!avatar) { const body = await bodyOf(req); send(res, 200, await update(active, { display_name: validateName(body.name) })); return; }
        if (req.method === 'GET') {
          if (!previous) fail('No profile picture.', 404);
          const { data, error } = await store.download(previous);
          if (error && ['400', '404'].includes(String(error.statusCode))) fail('No profile picture.', 404);
          unavailable(error);
          if (data.size > MAX_BYTES) fail('Stored picture exceeds the image limit.', 413);
          const bytes = await normalizeImage(Buffer.from(await data.arrayBuffer()), data.type);
          res.writeHead(200, { 'Content-Type': 'image/webp', 'Content-Length': bytes.length,
            'Content-Disposition': 'inline; filename="profile.webp"', 'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'" });
          res.end(bytes); return;
        }
        if (req.method === 'DELETE') {
          await bodyOf(req);
          const view = await update(active, { avatar_path: null });
          if (previous) {
            const cleanup = await store.remove([previous]);
            if (cleanup.error) view.warning = 'Picture removed from your account. Deletion of a private file failed; ask the administrator to remove unused avatar files.';
          }
          send(res, 200, view); return;
        }
        if (await limited('profile:upload:' + active.user.id, 10, 900)) fail('Too many picture uploads. Try again in 15 minutes.', 429);
        if (String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase() !== 'application/octet-stream') fail('Send a binary upload with its image type header.', 415);
        const bytes = await normalizeImage(await imageBody(req), req.headers['x-kuro-image-type']);
        const next = active.user.id + '/' + randomBytes(24).toString('hex') + '.webp';
        unavailable((await store.upload(next, bytes, { contentType: 'image/webp', cacheControl: '0', upsert: false })).error);
        let view;
        try { view = await update(active, { avatar_path: next }); }
        catch (error) {
          // A provider write can commit before its response is lost. Never delete
          // a potentially current image until a fresh verified read resolves it.
          let fresh;
          try { fresh = await active.client.auth.getUser(); } catch { /* Keep the private object when state is uncertain. */ }
          if (!fresh?.error && fresh?.data.user?.id === active.user.id) {
            if (avatarPath(fresh.data.user) === next) {
              active.user = fresh.data.user; view = profileView(active.user);
              view.warning = 'Picture saved. The connection was interrupted; reload your profile to confirm.';
            } else if (error.definiteWriteRejection) await store.remove([next]).catch(() => {});
          }
          if (!view) throw error;
        }
        if (previous) {
          const cleanup = await store.remove([previous]);
          if (cleanup.error) view.warning = 'Picture saved. Cleanup of the previous private file failed; ask the administrator to remove unused avatar files.';
        }
        send(res, 200, view);
      });
    });
  } catch (error) {
    if (error.status === 429) res.setHeader('Retry-After', '900');
    send(res, error.status || 503, { error: error.status ? error.message : 'Profile request could not be completed. Please retry.' });
  }
  return true;
}
