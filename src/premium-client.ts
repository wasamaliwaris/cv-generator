export type Price = { currency: string; amount: number };
export type Payment = Price & { id: string; state: 'paid' | 'pending' | 'expired' | 'refunded'; created_at: string };
export type Balance = { credits: number; payments: Payment[] };
export type CheckoutResult = Balance & { paymentId: string } & (
  { state: 'open'; url: string; price: Price } | { state: 'paid' | 'closed' | 'processing' | 'not_started' }
);
export type PremiumStatus = Balance & { enabled: boolean; prices: Price[]; wallet?: string; revisions: number; provider?: 'safepay' | 'stripe'; testMode?: boolean };
export const defaultStatus: PremiumStatus = { enabled: false, credits: 0, prices: [{ currency: 'PKR', amount: 28000 }], payments: [], revisions: 8 };

export async function premiumRequest<T>(action: string, body?: object, id?: string, signal?: AbortSignal): Promise<T> {
  const params = new URLSearchParams({ action });
  if (id) params.set('id', id);
  const response = await fetch(`/api/premium?${params}`, { signal, ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Premium services are not available on this deployment.');
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Premium is temporarily unavailable.');
  return result as T;
}

export function formatPrice({ currency, amount }: Price) {
  if (currency === 'PKR') return `Rs ${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(amount / 100)}`;
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount / 100);
}
export function suggestedCurrency(prices: Price[]) {
  const regions: Record<string, string> = { GB: 'GBP', PK: 'PKR', CA: 'CAD', AU: 'AUD', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', IE: 'EUR', PT: 'EUR', AT: 'EUR', BE: 'EUR', FI: 'EUR', GR: 'EUR' };
  const preferred = regions[(navigator.language.match(/(?:-|_)([A-Z]{2})(?:-|$)/i)?.[1] || '').toUpperCase()] ?? 'USD';
  return prices.find((price) => price.currency === preferred) ?? prices[0];
}
