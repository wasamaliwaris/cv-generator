import { randomUUID } from 'node:crypto';
import { generate } from './premium-ai.mjs';
import { safepayClient } from './safepay.mjs';

export function isSafepaySandbox(env, config) {
  return env.VERCEL_ENV !== 'production' && (env.SAFEPAY_ENVIRONMENT || 'sandbox') === 'sandbox' &&
    config?.provider === 'safepay' && config.safepayEnvironment === 'sandbox';
}

// CLI only. Never print request details, response bodies, or hosted checkout tokens.
export async function checkSandboxProviders(env, config, fetcher = fetch) {
  if (!isSafepaySandbox(env, config)) throw new Error('Provider checks require Safepay Sandbox outside Vercel Production.');
  const safepay = safepayClient(env, fetcher);
  const checkout = async () => {
    const order = { id: randomUUID(), currency: 'PKR', amount: config.pkrAmount };
    const session_id = await safepay.createTracker(order);
    await safepay.checkoutUrl({ ...order, session_id }, config.appUrl);
  };
  const ai = async () => {
    const { result } = await generate({
      id: randomUUID(), mode: 'create', role: 'Graphic Designer', job: '',
      evidence: 'Graphic Designer at Example Studio. Created web layouts and design mockups in Figma.',
    }, env, fetcher);
    if (!result) throw new Error('Unusable CV draft.');
  };
  const [payment, generation] = await Promise.allSettled([checkout(), ai()]);
  return { safepay: payment.status === 'fulfilled', openai: generation.status === 'fulfilled' };
}
