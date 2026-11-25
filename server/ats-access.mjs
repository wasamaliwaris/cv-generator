import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { AtsError } from './ats-document.mjs';

export const COOKIE = 'pathcv_ats_access';
export const time = () => Math.floor(Date.now() / 1000);
const secretOK = s => typeof s === 'string' && s.length >= 32;
export function signToken(secret, payload) {
  if (!secretOK(secret)) throw new Error('Set ATS_ACCESS_SECRET to a random secret of at least 32 characters.');
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}
export function verifyToken(secret, token, purpose) {
  if (!secretOK(secret) || typeof token !== 'string' || token.length > 1024 || !/^[\w-]+\.[\w-]{43}$/.test(token)) return null;
  const [data, signature] = token.split('.');
  const expected = createHmac('sha256', secret).update(data).digest();
  if (!timingSafeEqual(Buffer.from(signature, 'base64url'), expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, 'base64url').toString());
    return p?.purpose === purpose && /^[\w-]{20,50}$/.test(p?.id ?? '') && Number.isSafeInteger(p.exp) && p.exp > time() ? p : null;
  } catch { return null; }
}
export const makeGrant = (secret, expiresIn) => signToken(secret, { purpose: 'grant', id: randomBytes(18).toString('base64url'), exp: time() + expiresIn });
export function session(req, env) {
  const value = req.headers.cookie?.split(/;\s*/).find(s => s.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  return verifyToken(env.ATS_ACCESS_SECRET, value, 'session');
}
export function redeem(req, res, env, code) {
  const grant = verifyToken(env.ATS_ACCESS_SECRET, code, 'grant');
  if (!grant) throw new AtsError(403, 'That access code is invalid or expired.');
  const exp = Math.min(grant.exp, time() + 86400);
  const token = signToken(env.ATS_ACCESS_SECRET, { id: grant.id, purpose: 'session', exp });
  const secure = req.headers.origin?.startsWith('https:') ? '; Secure' : '';
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/api/ats; HttpOnly; SameSite=Strict; Max-Age=${exp - time()}${secure}`);
}
export function requestKey(req) {
  const ip = (process.env.VERCEL ? req.headers['x-vercel-forwarded-for'] : undefined) || req.socket?.remoteAddress || 'unknown';
  return createHash('sha256').update(String(ip).split(',')[0].trim()).digest('base64url').slice(0, 24);
}
export function redisClient(env, fetcher = fetch) {
  if (!env.ATS_REDIS_URL || !env.ATS_REDIS_TOKEN) return null;
  const url = new URL(env.ATS_REDIS_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('ATS_REDIS_URL must be an HTTPS origin.');
  return async (...command) => {
    const response = await fetcher(url.href, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(7000), headers: { Authorization: `Bearer ${env.ATS_REDIS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command) });
    if (!response.ok) throw new Error('ATS temporary service is unavailable.');
    const data = await response.json();
    if (data.error) throw new Error('ATS temporary service is unavailable.');
    return data.result;
  };
}
const RATE_SCRIPT = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n";
export function rateGuard(redis) {
  const windows = new Map();
  return async (key, limit, ttl) => {
    let count;
    if (redis) count = Number(await redis('EVAL', RATE_SCRIPT, 1, `pathcv:ats:rate:${key}`, ttl));
    else {
      const now = time();
      let bucket = windows.get(key);
      if (!bucket || bucket.until <= now) {
        if (windows.size >= 3000) {
          for (const [id, b] of windows) if (b.until <= now) windows.delete(id);
          if (windows.size >= 3000) throw new AtsError(503, 'The checker is busy. Please try again shortly.');
        }
        bucket = { count: 0, until: now + ttl }; windows.set(key, bucket);
      }
      count = ++bucket.count;
    }
    if (count > limit) throw new AtsError(429, 'Too many requests. Please wait before trying again.');
  };
}
