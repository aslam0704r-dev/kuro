import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'node:crypto';
export const digest = value => createHash('sha256').update(value).digest('hex');
export function createSealer(secret) {
  return {
    seal(value, context) {
      const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', secret, iv);
      cipher.setAAD(Buffer.from(context));
      const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
      return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
    },
    open(value, context) {
      const data = Buffer.from(value, 'base64'), cipher = createDecipheriv('aes-256-gcm', secret, data.subarray(0, 12));
      cipher.setAAD(Buffer.from(context));
      cipher.setAuthTag(data.subarray(12, 28));
      return JSON.parse(Buffer.concat([cipher.update(data.subarray(28)), cipher.final()]).toString('utf8'));
    },
  };
}
