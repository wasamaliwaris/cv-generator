import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import Stripe from 'stripe';
import { z } from 'zod';
import { database, store, checkoutMatches, PremiumError, REVISION_LIMIT } from '../server/premium-store.mjs';
import { generate, generationInput, revisionInput } from '../server/premium-ai.mjs';

const cookieName = 'pathcv_premium';
const uuid = z.uuid();
const sign = (value, secret) => createHmac('sha256', secret).update(value).digest('hex');
const safeEqual = (a, b) => a?.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const sameOrigin = (req, appUrl) => req.headers.origin === appUrl;
const currencies = { USD: 1, PKR: 280, EUR: 0.95, GBP: 0.85, CAD: 1.45, AUD: 1.55 };
const minimums = { USD: 100, PKR: 28000, EUR: 95, GBP: 85, CAD: 145, AUD: 155 };
const disabled = { enabled: false, prices: [{ currency: 'USD', amount: 100 }], revisions: REVISION_LIMIT };
function configuration(env) {
  const { DATABASE_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, OPENAI_API_KEY, PREMIUM_SESSION_SECRET, PREMIUM_APP_URL } = env;
  if (!DATABASE_URL || !STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !OPENAI_API_KEY || (PREMIUM_SESSION_SECRET?.length ?? 0) < 32) return null;
  try {
    const app = new URL(PREMIUM_APP_URL);
    if (app.protocol !== 'https:' && !(app.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(app.hostname))) return null;
    return { appUrl: app.origin, list: [...new Set(['USD', ...(env.PREMIUM_CURRENCIES || '').toUpperCase().split(',').map((c) => c.trim()).filter((c) => Object.hasOwn(currencies, c))])] };
  } catch { return null; }
}
async function raw(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.from(chunk);
    size += bytes.length;
    if (size > 160000) throw new PremiumError(413, 'This request is too large.');
    chunks.push(bytes);
  }
  return Buffer.concat(chunks);
}

export function premiumHandler(env = process.env, dependencies = {}) {
  const config = configuration(env);
  const ledger = config ? store(dependencies.pool ?? database(env.DATABASE_URL)) : null;
  const stripe = config ? dependencies.stripe ?? new Stripe(env.STRIPE_SECRET_KEY, { timeout: 12000, maxNetworkRetries: 1 }) : null;
  const writer = dependencies.generate ?? generate;
  const walletId = (req, res) => {
    const entry = req.headers.cookie?.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${cookieName}=`));
    const [value, signature] = (entry?.slice(cookieName.length + 1) ?? '').split('.');
    if (uuid.safeParse(value).success && /^[\da-f]{64}$/.test(signature ?? '') && safeEqual(signature, sign(value, env.PREMIUM_SESSION_SECRET))) return value;
    if (req.method !== 'GET') throw new PremiumError(403, 'Reload the AI workspace to set up your browser wallet.');
    const id = randomUUID();
    const secure = config.appUrl.startsWith('https:') ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${cookieName}=${id}.${sign(id, env.PREMIUM_SESSION_SECRET)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`);
    return id;
  };
  const priceList = async () => {
    const { rows: [settings] } = await ledger.q('SELECT usd_cents FROM premium_settings WHERE id=true');
    return config.list.map((currency) => ({ currency, amount: Math.max(minimums[currency], Math.ceil(settings.usd_cents * currencies[currency])) }));
  };
  async function paymentStatus(payment, session) {
    if (payment.state === 'paid') return { state: 'paid' };
    if (payment.state !== 'pending') return { state: 'closed' };
    if (!session && !payment.session_id) return { state: 'not_started' };
    session ??= await stripe.checkout.sessions.retrieve(payment.session_id);
    if (!checkoutMatches(session, payment)) throw new PremiumError(503, 'We could not verify the checkout details. Do not pay again until payment status is confirmed.');
    if (session.payment_status === 'paid' || session.status === 'expired') {
      const paid = await ledger.recordPayment(session);
      if (paid) return { state: 'paid' };
      return { state: session.status === 'expired' ? 'closed' : 'processing' };
    }
    if (session.status === 'open' && session.url) return { state: 'open', url: session.url, price: { amount: payment.amount, currency: payment.currency } };
    return { state: 'processing' };
  }
  return async (req, res) => {
    const json = (status, value) => {
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(value));
    };
    try {
      const params = new URL(req.url, 'http://localhost').searchParams;
      const action = params.get('action') || 'status';
      if (req.method === 'GET' && action === 'prices') return json(200, config ? { enabled: true, prices: await priceList(), revisions: REVISION_LIMIT } : disabled);
      if (!config) return json(action === 'status' && req.method === 'GET' ? 200 : 503, { ...disabled, credits: 0, payments: [], error: 'Premium is not configured on this deployment.' });
      if (req.method === 'POST' && action === 'webhook') {
        const payload = await raw(req);
        let event;
        try { event = stripe.webhooks.constructEvent(payload, req.headers['stripe-signature'], env.STRIPE_WEBHOOK_SECRET); }
        catch { throw new PremiumError(400, 'Invalid webhook signature.'); }
        if (['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.expired', 'checkout.session.async_payment_failed'].includes(event.type)) {
          await ledger.recordPayment(event.data.object, event.type === 'checkout.session.async_payment_failed');
        }
        if (event.type === 'charge.refunded' && event.data.object.refunded && typeof event.data.object.payment_intent === 'string') {
          const { rows: [payment] } = await ledger.q('SELECT id,wallet FROM premium_payments WHERE intent_id=$1', [event.data.object.payment_intent]);
          if (payment) await ledger.tx(payment.wallet, async (q) => {
            await q("UPDATE premium_payments SET state='refunded' WHERE id=$1", [payment.id]);
            await q("UPDATE premium_credits SET state='revoked' WHERE payment=$1", [payment.id]);
          });
        }
        return json(200, { received: true });
      }
      if (req.method !== 'GET' && req.method !== 'POST') throw new PremiumError(405, 'Method not allowed.');
      if (req.method === 'POST' && (!sameOrigin(req, config.appUrl) || !/^application\/json\b/i.test(req.headers['content-type'] ?? ''))) throw new PremiumError(403, 'Request is not from the PathCV workspace.');
      const wallet = walletId(req, res);
      if (req.method === 'GET' && action === 'status') {
        return json(200, { enabled: true, prices: await priceList(), revisions: REVISION_LIMIT, wallet, ...await ledger.summary(wallet) });
      }
      if (req.method === 'GET' && action === 'job') {
        const id = uuid.safeParse(params.get('id'));
        if (!id.success) throw new PremiumError(400, 'Invalid request ID.');
        const job = await ledger.getJob(wallet, id.data);
        if (!job) throw new PremiumError(404, 'This request could not be found.');
        return json(200, job);
      }
      if (req.method !== 'POST') throw new PremiumError(404, 'Unknown premium endpoint.');
      let body;
      try { body = JSON.parse(await raw(req)); } catch (error) { if (error instanceof PremiumError) throw error; throw new PremiumError(400, 'Invalid JSON request.'); }
      if (action === 'checkout') {
        const price = (await priceList()).find(({ currency }) => currency === body?.currency);
        if (!price) throw new PremiumError(400, 'This currency is not supported.');
        if (body.quotedAmount !== undefined && body.quotedAmount !== price.amount) throw new PremiumError(409, 'The price changed. Review the updated total before continuing.');
        const payment = await ledger.reserveCheckout(wallet, price);
        let result;
        if (payment.session_id) {
          result = await paymentStatus(payment);
        } else {
          try {
            const { id } = payment;
            const session = await stripe.checkout.sessions.create({
              mode: 'payment', client_reference_id: id, metadata: { payment: id, wallet },
              adaptive_pricing: { enabled: false },
              line_items: [{ quantity: 1, price_data: { currency: payment.currency.toLowerCase(), unit_amount: payment.amount, product_data: { name: 'PathCV · 1 AI CV credit' } } }],
              success_url: `${config.appUrl}/ai-cv?checkout=success&session_id={CHECKOUT_SESSION_ID}`, cancel_url: `${config.appUrl}/ai-cv?checkout=cancelled&payment_id=${id}`,
            }, { idempotencyKey: `pathcv-checkout-${id}` });
            result = await paymentStatus(payment, session);
            await ledger.q('UPDATE premium_payments SET session_id=$2 WHERE id=$1 AND session_id IS NULL', [id, session.id]);
          } catch (error) {
            if (error instanceof PremiumError) throw error;
            // Keep the existing reservation after ambiguous Stripe errors so a retry uses the same idempotency key.
            throw new PremiumError(503, 'Checkout could not be opened. Try again to resume the same checkout.');
          }
        }
        return json(200, { ...result, paymentId: payment.id, ...await ledger.summary(wallet) });
      }
      if (action === 'confirm') {
        const byPayment = uuid.safeParse(body?.paymentId);
        const sessionId = typeof body?.sessionId === 'string' && /^cs_[\w]+$/.test(body.sessionId) && body.sessionId.length <= 140 ? body.sessionId : null;
        if (!byPayment.success && !sessionId) throw new PremiumError(400, 'Invalid checkout reference.');
        const owned = await ledger.findPayment(wallet, { paymentId: byPayment.success ? byPayment.data : null, sessionId });
        if (!owned) throw new PremiumError(404, 'Open the workspace in the browser you used to pay.');
        const result = await paymentStatus(owned);
        return json(200, { ...result, paymentId: owned.id, paid: result.state === 'paid', ...await ledger.summary(wallet) });
      }
      if (action === 'generate') {
        const parsed = (body?.mode === 'revise' ? revisionInput : generationInput).safeParse(body);
        if (!parsed.success) throw new PremiumError(400, 'Check your career notes, job description, or selected text and try again.');
        const input = parsed.data;
        const existing = await ledger.reserve(wallet, input);
        if (existing) return json(200, existing);
        let output;
        try { output = await writer(input, env); } catch { output = { result: null }; }
        const finished = await ledger.finish(wallet, input.id, output.result, output.usage);
        return json(200, { state: finished && output.result ? 'done' : 'failed', result: finished ? output.result : null });
      }
      throw new PremiumError(404, 'Unknown premium endpoint.');
    } catch (error) {
      if (error instanceof PremiumError) return json(error.status, { error: error.message });
      console.error('PathCV premium request failed:', error.code ?? error.name);
      return json(503, { error: 'Premium services are temporarily unavailable. Check your workspace before retrying.' });
    }
  };
}

export default premiumHandler();
