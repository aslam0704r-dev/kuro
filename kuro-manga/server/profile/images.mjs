import sharp from 'sharp';
import { fail } from '../managed/http.mjs';
export const MAX_BYTES = 1048576;
sharp.cache({ memory: 16, files: 0, items: 20 });
sharp.concurrency(1);
export function detectedType(bytes) {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return '';
}
export async function imageBody(req) {
  const length = req.headers['content-length'];
  if (length !== undefined && (!/^\d+$/.test(String(length)) || Number(length) > MAX_BYTES)) fail('Picture must be 1 MiB or smaller.', 413);
  if (req.body !== undefined) {
    if (!Buffer.isBuffer(req.body) && !(req.body instanceof Uint8Array)) fail('Send the image file as a binary request body.');
    if (req.body.byteLength > MAX_BYTES) fail('Picture must be 1 MiB or smaller.', 413);
    return Buffer.from(req.body);
  }
  let size = 0; const chunks = [];
  for await (const value of req) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value); size += chunk.length;
    if (size > MAX_BYTES) fail('Picture must be 1 MiB or smaller.', 413); chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
export async function normalizeImage(bytes, declaredType) {
  if (!bytes.length || bytes.length > MAX_BYTES) fail('Picture must be 1 MiB or smaller.', 413);
  const type = detectedType(bytes), declared = String(declaredType || '').split(';')[0].trim().toLowerCase();
  if (!type || type !== declared) fail('Choose a JPEG, PNG or WebP file whose contents match its type.', 415);
  try {
    const image = sharp(bytes, { failOn: 'warning', limitInputPixels: 16777216, limitInputChannels: 4 });
    const meta = await image.metadata();
    if (!meta.width || !meta.height || meta.width > 4096 || meta.height > 4096 || (meta.pages || 1) !== 1) fail('Use a static picture no larger than 4096 × 4096 pixels.');
    const result = await image.rotate().resize(512, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85, effort: 3 }).timeout({ seconds: 5 }).toBuffer();
    if (result.length > MAX_BYTES) fail('The processed picture is too large.', 413);
    return result;
  } catch (error) {
    if (error.status) throw error;
    fail('The picture is damaged, unsupported or exceeds the image limits.');
  }
}
