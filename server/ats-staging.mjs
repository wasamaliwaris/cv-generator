import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { signToken, verifyToken, time } from './ats-access.mjs';
import { AtsError } from './ats-document.mjs';

export const FIRST_PART = 2_621_440;
const PART_SIZE = 256 * 1024;
const COUNT = FIRST_PART / PART_SIZE;
const ttl = 120;
export function tempUploads(redis, secret) {
  if (!redis || !secret || secret.length < 32) return null;
  const key = createHash('sha256').update('pathcv-ats-upload-encryption:').update(secret).digest();
  const makeKey = (id, part) => `pathcv:ats:tmp:${id}:${part}`;
  const keys = (id) => Array.from({ length: COUNT }, (_, i) => makeKey(id, i));
  return {
    async stage(bytes) {
      if (bytes.length !== FIRST_PART) throw new AtsError(400, 'Invalid upload part.');
      const id = randomBytes(20).toString('base64url');
      const paths = keys(id);
      try {
        // Limit each REST command to less than 512 KB; each encrypted chunk expires automatically.
        const writes = await Promise.allSettled(paths.map((path, i) => {
          const iv = randomBytes(12);
          const cipher = createCipheriv('aes-256-gcm', key, iv); cipher.setAAD(Buffer.from(path));
          const data = Buffer.concat([cipher.update(bytes.subarray(i * PART_SIZE, (i + 1) * PART_SIZE)), cipher.final()]);
          const value = Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
          return redis('SET', path, value, 'EX', ttl);
        }));
        if (writes.some(write => write.status === 'rejected' || write.value !== 'OK')) throw new Error('Incomplete upload');
        return signToken(secret, { purpose: 'upload', id, exp: time() + ttl });
      } catch (error) { await redis('DEL', ...paths).catch(() => {}); throw error; }
    },
    async take(ticket) {
      const auth = verifyToken(secret, ticket, 'upload');
      if (!auth) throw new AtsError(422, 'The upload expired. Select the file and try again.');
      const paths = keys(auth.id);
      // Read and delete each encrypted part. An incomplete or reused upload is never parsed.
      const parts = await Promise.all(paths.map(path => redis('GETDEL', path)));
      if (parts.some(part => typeof part !== 'string')) throw new AtsError(422, 'The upload expired or was already used. Try again.');
      return Buffer.concat(parts.map((part, i) => {
        const buffer = Buffer.from(part, 'base64');
        const decipher = createDecipheriv('aes-256-gcm', key, buffer.subarray(0, 12));
        decipher.setAAD(Buffer.from(paths[i])); decipher.setAuthTag(buffer.subarray(12, 28));
        return Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]);
      }));
    },
  };
}
