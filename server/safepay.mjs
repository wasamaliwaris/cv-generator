import { createHmac, timingSafeEqual } from 'node:crypto';
import { PremiumError } from './premium-store.mjs';

export const isSafepayTracker = (value) => typeof value === 'string' && /^track_[a-f0-9-]{36}$/i.test(value);
const closed = new Set(['TRACKER_CANCELLED', 'TRACKER_EXPIRED', 'TRACKER_REVERSED']);
const refunded = new Set(['TRACKER_REFUNDED', 'TRACKER_VOIDED', 'TRACKER_DISPUTED']);

export function safepayClient(env, fetcher = fetch) {
  const environment = env.SAFEPAY_ENVIRONMENT || 'sandbox';
  const sandbox = environment === 'sandbox';
  const apiHost = sandbox ? 'https://sandbox.api.getsafepay.com' : 'https://api.getsafepay.com';
  const checkoutHost = sandbox ? apiHost : 'https://getsafepay.com';
  const invalid = () => new PremiumError(503, 'We could not verify this payment. Please check its status before paying again.');
  async function api(path, body) {
    const response = await fetcher(`${apiHost}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'X-SFPY-MERCHANT-SECRET': env.SAFEPAY_SECRET_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(6500), redirect: 'error',
    });
    if (!response.ok) throw new Error('Safepay API request failed');
    const payload = await response.json();
    if (payload.status?.errors?.length) throw new Error('Safepay API returned errors');
    return payload.data;
  }
  function checkedTracker(tracker, payment, expectedToken) {
    const amount = tracker?.purchase_totals?.quote_amount;
    if (!isSafepayTracker(tracker?.token) || (expectedToken && tracker.token !== expectedToken) || tracker.environment !== environment || tracker.mode !== 'payment' || amount?.amount !== payment.amount || amount?.currency !== payment.currency) throw invalid();
    const orderId = tracker.metadata?.order_id;
    if (orderId != null && (typeof orderId === 'object' ? orderId.value : orderId) !== payment.id) throw invalid();
    return tracker;
  }
  return {
    async createTracker(payment) {
      const data = await api('/order/payments/v3/', {
        merchant_api_key: env.SAFEPAY_PUBLIC_KEY, intent: 'CYBERSOURCE', mode: 'payment', entry_mode: 'raw',
        currency: payment.currency, amount: payment.amount, metadata: { order_id: payment.id }, include_fees: false,
      });
      return checkedTracker(data?.tracker, payment).token;
    },
    async checkoutUrl(payment, appUrl) {
      const passport = await api('/client/passport/v1/token', {});
      if (typeof passport !== 'string' || !passport) throw invalid();
      const url = new URL('/embedded/', checkoutHost);
      url.search = new URLSearchParams({
        environment, tracker: payment.session_id, tbt: passport, source: 'hosted',
        redirect_url: `${appUrl}/ai-cv?checkout=success&payment_id=${payment.id}`,
        cancel_url: `${appUrl}/ai-cv?checkout=cancelled&payment_id=${payment.id}`,
      }).toString();
      return url.href;
    },
    async lookup(payment) {
      if (!isSafepayTracker(payment.session_id)) throw invalid();
      const data = await api(`/reporter/api/v1/payments/${payment.session_id}`);
      const tracker = checkedTracker(data?.tracker, payment, payment.session_id);
      if (tracker.state === 'TRACKER_ENDED') return 'paid';
      if (refunded.has(tracker.state)) return 'refunded';
      if (closed.has(tracker.state)) return 'closed';
      // The hosted page handles payment method capabilities and in-flight bank attempts for this tracker.
      return tracker.state === 'TRACKER_STARTED' ? 'open' : 'processing';
    },
    readEvent(payload, signature) {
      if (typeof signature !== 'string' || !/^[a-f0-9]{128}$/i.test(signature)) throw new PremiumError(400, 'Invalid webhook signature.');
      const expected = createHmac('sha512', env.SAFEPAY_WEBHOOK_SECRET).update(payload).digest();
      if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) throw new PremiumError(400, 'Invalid webhook signature.');
      try { return JSON.parse(payload.toString('utf8')); }
      catch { throw new PremiumError(400, 'Invalid webhook data.'); }
    },
    async reconcile(event, ledger) {
      const data = event?.data;
      if (!['payment.succeeded', 'payment.refunded', 'void.succeeded'].includes(event?.type) || !isSafepayTracker(data?.tracker)) return;
      const payment = await ledger.findSafepayPayment(data.tracker);
      if (!payment) return;
      if (event.type === 'payment.succeeded' && (data.amount !== payment.amount || data.currency !== payment.currency)) throw invalid();
      if (event.type !== 'payment.succeeded' && !refunded.has(data.state)) return; // Partial refunds do not revoke the credit.
      // Re-read the authoritative tracker so a late success cannot revive a fully refunded payment.
      const state = await this.lookup(payment);
      const terminal = ['paid', 'closed', 'refunded'].includes(state);
      if (!terminal || (event.type !== 'payment.succeeded' && state !== 'refunded')) throw new PremiumError(503, 'Payment status has not been synchronized yet.');
      await ledger.recordSafepayStatus(payment, state);
    },
  };
}
