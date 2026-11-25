import { AtsError, cleanText, documentKind, DIRECT_LIMIT, FILE_LIMIT, parseDocument, SUPPORTED_ERROR, validateText } from '../server/ats-document.mjs';
import { analyzeCV } from '../server/ats-score.mjs';
import { rateGuard, redeem, redisClient, requestKey, session } from '../server/ats-access.mjs';
import { FIRST_PART, tempUploads } from '../server/ats-staging.mjs';
import { proposeEdits } from '../server/ats-ai.mjs';

export const config = { api: { bodyParser: false } };
const META_LIMIT = 150_000;
const JSON_LIMIT = 575_000;
const activeLimit = 3;
async function readBody(req, max) {
  if (Number(req.headers['content-length']) > max) throw new AtsError(413, 'The request is too large.');
  // Vercel's Node handler can expose an already-buffered raw body; never trust parsed file data.
  if (Buffer.isBuffer(req.body)) {
    if (req.body.length > max) throw new AtsError(413, 'The request is too large.');
    return req.body;
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    length += buffer.length;
    if (length > max) { req.resume(); throw new AtsError(413, 'The request is too large.'); }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks, length);
}
function json(buffer) {
  try { const value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(buffer)); if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(); return value; }
  catch { throw new AtsError(400, 'Invalid request.'); }
}
function jobInput(data) {
  const job = data.job ?? '', title = data.title ?? '';
  if (typeof job !== 'string' || typeof title !== 'string' || job.length > 24_000 || title.length > 130) throw new AtsError(400, 'Keep the job description under 24,000 characters and the title under 130 characters.');
  const desc = cleanText(job).trim();
  if (desc && (desc.match(/\p{L}+/gu)?.length ?? 0) < 3) throw new AtsError(400, 'Paste more of the job description, or leave it blank for a general check.');
  return { job: desc, title: cleanText(title).trim() };
}
function sameOrigin(req, env) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    if (!['https:', 'http:'].includes(parsed.protocol) || origin !== parsed.origin) return false;
    if (env.ATS_APP_ORIGIN && origin === env.ATS_APP_ORIGIN) return true;
    return parsed.host === req.headers.host && (parsed.protocol === 'https:' || !env.VERCEL || env.VERCEL_ENV === 'development');
  } catch { return false; }
}
export function createAtsHandler(env = process.env, fetcher = fetch) {
  let limiter, staging, active = 0;
  const getServices = () => {
    if (!limiter) {
      const redis = redisClient(env, fetcher);
      limiter = rateGuard(redis);
      staging = tempUploads(redis, env.ATS_UPLOAD_SECRET);
    }
  };
  return async (req, res) => {
    const send = (status, data) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(data));
    };
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Vary', 'Cookie');
    let acquired = false;
    try {
      if (!['GET', 'POST'].includes(req.method)) { res.setHeader('Allow', 'GET, POST'); throw new AtsError(405, 'Method not allowed.'); }
      getServices();
      const entitlement = session(req, env);
      const access = Boolean(entitlement);
      if (req.method === 'GET') return send(200, { premium: access, ai: access && Boolean(env.OPENAI_API_KEY), accessCodes: (env.ATS_ACCESS_SECRET?.length || 0) >= 32, uploadLimit: staging ? FILE_LIMIT : DIRECT_LIMIT });
      if (!sameOrigin(req, env)) throw new AtsError(403, 'Open PathCV directly, then try again.');
      const action = new URL(req.url, 'http://localhost').searchParams.get('action') || 'analyze';
      if (!['analyze', 'stage', 'redeem', 'recheck', 'improve', 'export'].includes(action)) throw new AtsError(404, 'Unknown checker action.');
      const ip = requestKey(req);
      if (active >= activeLimit) throw new AtsError(503, 'The checker is busy. Please try again shortly.');
      active++; acquired = true;
      await limiter(`ip:${ip}`, 28, 600);
      const mime = req.headers['content-type']?.split(';')[0];
      if (action === 'stage') {
        if (!staging) throw new AtsError(503, 'Large uploads are not available here. Use a CV file under 4 MB.');
        if (mime !== 'application/octet-stream') throw new AtsError(415, 'Invalid upload type.');
        await limiter(`stage:${ip}`, 5, 600);
        const part = await readBody(req, FIRST_PART);
        if (!documentKind(part)) throw new AtsError(415, SUPPORTED_ERROR);
        return send(200, { ticket: await staging.stage(part) });
      }
      if (action === 'redeem') {
        await limiter(`redeem:${ip}`, 8, 600);
        if (mime !== 'application/json') throw new AtsError(415, 'Invalid request type.');
        const data = json(await readBody(req, 1400));
        redeem(req, res, env, data.code);
        return send(200, { premium: true, ai: Boolean(env.OPENAI_API_KEY) });
      }
      if (action !== 'analyze' && !access) throw new AtsError(403, 'This action requires verified PathCV Premium access.');
      if (action === 'improve') await limiter(`ai:${entitlement.id}`, 4, 3600);
      if (mime === 'application/octet-stream' && action === 'analyze') {
        const packet = await readBody(req, DIRECT_LIMIT + META_LIMIT + 4);
        if (packet.length < 4) throw new AtsError(400, 'Missing upload details.');
        const length = packet.readUInt32BE(0);
        if (!length || length > META_LIMIT || 4 + length > packet.length) throw new AtsError(400, 'Invalid upload details.');
        const info = json(packet.subarray(4, 4 + length));
        const input = jobInput(info);
        let bytes = packet.subarray(4 + length);
        if (info.ticket !== undefined) {
          if (!staging || bytes.length < 1 || bytes.length > FILE_LIMIT - FIRST_PART) throw new AtsError(413, 'Choose a CV file no larger than 5 MB.');
          bytes = Buffer.concat([await staging.take(info.ticket), bytes]);
        } else if (bytes.length > DIRECT_LIMIT) throw new AtsError(413, 'Use the large upload option or select a file under 4 MB.');
        const parsed = await parseDocument(bytes, info.extension);
        return send(200, { result: analyzeCV({ ...parsed, ...input, premium: access }), ...(access ? { text: parsed.text } : {}) });
      }
      if (mime !== 'application/json') throw new AtsError(415, 'Invalid request type.');
      const data = json(await readBody(req, JSON_LIMIT));
      const text = validateText(data.text);
      const input = jobInput(data);
      if (action === 'improve') {
        if (data.consent !== true) throw new AtsError(400, 'Confirm that you want to send this text to OpenAI.');
        if (text.length > 24_000) throw new AtsError(413, 'Shorten the CV to 24,000 characters before requesting AI suggestions.');
        return send(200, { proposal: await proposeEdits({ text, ...input }, env, fetcher) });
      }
      if (action === 'export') return send(200, { text });
      return send(200, { result: analyzeCV({ text, ...input, premium: access }), ...(access ? { text } : {}) });
    } catch (error) {
      if (error instanceof AtsError) {
        if (error.status === 429) res.setHeader('Retry-After', '600');
        return send(error.status, { error: error.message, ...(error.code ? { code: error.code } : {}) });
      }
      return send(503, { error: 'The checker could not complete this request. Please try again shortly.' });
    } finally { if (acquired) active--; }
  };
}
export default createAtsHandler();
