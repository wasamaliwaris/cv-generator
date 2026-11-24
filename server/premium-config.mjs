const present = (value) => typeof value === 'string' && !!value.trim();

function origin(value) {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) return null;
    if (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) return url.origin;
  } catch { /* Invalid or missing URL. */ }
  return null;
}

function vercelOrigin(host) {
  return typeof host === 'string' && /^[a-z0-9-]+\.vercel\.app$/i.test(host) ? `https://${host}` : null;
}

// Check settings at startup and from the private admin CLI without returning their values.
export function checkPremiumConfig(env) {
  const issues = [];
  const requireSettings = (names) => {
    for (const name of names) if (!present(env[name])) issues.push(`Set ${name}.`);
  };
  requireSettings(['DATABASE_URL', 'OPENAI_API_KEY']);
  if ((env.PREMIUM_SESSION_SECRET?.trim().length ?? 0) < 32) issues.push('Set PREMIUM_SESSION_SECRET to at least 32 characters.');
  const stripeReady = present(env.STRIPE_SECRET_KEY) && present(env.STRIPE_WEBHOOK_SECRET);
  const safepayEnvironment = env.SAFEPAY_ENVIRONMENT || 'sandbox';
  const pkr = (env.SAFEPAY_PRICE_PKR || '280').trim();
  const safepayKeys = ['SAFEPAY_PUBLIC_KEY', 'SAFEPAY_SECRET_KEY', 'SAFEPAY_WEBHOOK_SECRET'];
  const modeValid = ['sandbox', 'production'].includes(safepayEnvironment);
  const priceValid = /^\d{1,5}$/.test(pkr) && Number(pkr) > 0;
  const safepayReady = safepayKeys.every((key) => present(env[key])) && modeValid && priceValid;
  const provider = env.PREMIUM_PAYMENT_PROVIDER || (safepayReady || (!stripeReady && safepayKeys.some((key) => present(env[key]))) ? 'safepay' : 'stripe');
  const sandboxPreview = provider === 'safepay' && safepayEnvironment === 'sandbox' && env.VERCEL_ENV === 'preview';
  if (provider === 'safepay') {
    requireSettings(safepayKeys);
    if (!modeValid) issues.push('Set SAFEPAY_ENVIRONMENT to sandbox or production.');
    if (!priceValid) issues.push('Set SAFEPAY_PRICE_PKR to a positive whole-rupee price.');
    if (env.VERCEL_ENV === 'production' && safepayEnvironment === 'sandbox') issues.push('Safepay Sandbox is blocked on Vercel Production. Configure a protected Preview deployment instead.');
  } else if (provider === 'stripe') requireSettings(['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']);
  else issues.push('Set PREMIUM_PAYMENT_PROVIDER to safepay or stripe.');

  const explicitOrigin = origin(env.PREMIUM_APP_URL);
  const previewOrigins = sandboxPreview ? [vercelOrigin(env.VERCEL_BRANCH_URL), vercelOrigin(env.VERCEL_URL)].filter(Boolean) : [];
  if ((present(env.PREMIUM_APP_URL) && !explicitOrigin) || !(explicitOrigin || previewOrigins.length)) {
    issues.push('Set PREMIUM_APP_URL to the exact website origin (HTTPS, no path or query).');
  }
  const allowedOrigins = [...new Set([explicitOrigin, ...previewOrigins].filter(Boolean))];
  if (issues.length) return { config: null, issues };
  return {
    config: { provider, stripeReady, safepayReady, safepayEnvironment, pkrAmount: Number(pkr) * 100, appUrl: allowedOrigins[0], allowedOrigins },
    issues,
  };
}
