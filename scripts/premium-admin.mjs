import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import Stripe from 'stripe';
import { z } from 'zod';
import { database, store } from '../server/premium-store.mjs';

const [action, arg, value] = process.argv.slice(2);
if (!action || action === 'help') {
  console.log('Premium admin: migrate | price USD_CENTS | wallets | payments | generations | expenses | grant WALLET COUNT | revoke WALLET COUNT | refund PAYMENT_ID | purge-results');
  process.exit(0);
}
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in the environment.');
const pool = database(process.env.DATABASE_URL);
const { q, tx } = store(pool);
const id = (val) => z.uuid().parse(val);
function integer(val, min, max) {
  if (!/^\d+$/.test(val ?? '') || Number(val) < min || Number(val) > max) throw new Error(`Enter an integer between ${min} and ${max}.`);
  return Number(val);
}
try {
  switch (action) {
    case 'migrate': await q(await readFile(new URL('../server/schema.sql', import.meta.url), 'utf8')); break;
    case 'price': await q('UPDATE premium_settings SET usd_cents=$1 WHERE id=true', [integer(arg, 100, 10000)]); break;
    case 'wallets': console.table((await q(`SELECT w.id,w.created_at, count(c.id) FILTER (WHERE c.state='available') AS available,
      count(c.id) FILTER (WHERE c.state='used') AS used FROM premium_wallets w LEFT JOIN premium_credits c ON c.wallet=w.id GROUP BY w.id ORDER BY w.created_at DESC LIMIT 100`)).rows); break;
    case 'payments': console.table((await q(`SELECT id,wallet,currency,amount,state,created_at FROM premium_payments ORDER BY created_at DESC LIMIT 100`)).rows); break;
    case 'generations': console.table((await q(`SELECT id,wallet,parent,mode,state,model,input_tokens,output_tokens,cost_usd,created_at FROM premium_jobs ORDER BY created_at DESC LIMIT 100`)).rows); break;
    case 'expenses': console.table((await q(`SELECT model,count(*) AS jobs,sum(input_tokens) AS input_tokens,sum(output_tokens) AS output_tokens,
      sum(cost_usd) AS estimated_usd,count(*) FILTER (WHERE cost_usd IS NULL) AS jobs_without_cost FROM premium_jobs GROUP BY model`)).rows); break;
    case 'grant': case 'revoke': {
      const wallet = id(arg), count = integer(value, 1, 100);
      if (action === 'grant') await q('INSERT INTO premium_wallets (id) VALUES ($1) ON CONFLICT DO NOTHING', [wallet]);
      await tx(wallet, async (query) => {
        if (action === 'grant') {
          for (let i = 0; i < count; i++) await query('INSERT INTO premium_credits (id,wallet) VALUES ($1,$2)', [randomUUID(), wallet]);
        } else {
          const { rowCount } = await query("UPDATE premium_credits SET state='revoked' WHERE id IN (SELECT id FROM premium_credits WHERE wallet=$1 AND payment IS NULL AND state='available' ORDER BY created_at LIMIT $2)", [wallet, count]);
          if (rowCount !== count) throw new Error('Not enough unused promotional credits. Refund paid credits with the refund command.');
        }
      });
      break;
    }
    case 'refund': {
      const paymentId = id(arg);
      if (!process.env.STRIPE_SECRET_KEY) throw new Error('Set STRIPE_SECRET_KEY.');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: 12000, maxNetworkRetries: 1 });
      const { rows: [record] } = await q('SELECT wallet FROM premium_payments WHERE id=$1', [paymentId]);
      if (!record) throw new Error('Payment not found.');
      await tx(record.wallet, async (query) => {
        const { rows: [payment] } = await query('SELECT p.state, p.intent_id, c.state AS credit_state FROM premium_payments p JOIN premium_credits c ON c.payment=p.id WHERE p.id=$1', [paymentId]);
        if (payment?.state === 'refunded') return;
        if (payment?.state !== 'paid' || payment.credit_state !== 'available') throw new Error('Only paid, unused credits can be refunded here.');
        const refund = await stripe.refunds.create({ payment_intent: payment.intent_id }, { idempotencyKey: `pathcv-refund-${paymentId}` });
        if (refund.status !== 'succeeded') throw new Error(`Stripe did not confirm the refund (status: ${refund.status}). Check the Stripe dashboard before retrying.`);
        await query("UPDATE premium_payments SET state='refunded' WHERE id=$1", [paymentId]);
        await query("UPDATE premium_credits SET state='revoked' WHERE payment=$1", [paymentId]);
      });
      break;
    }
    case 'purge-results': await q("UPDATE premium_jobs SET result=NULL WHERE result IS NOT NULL AND created_at < now() - interval '24 hours'"); break;
    default: throw new Error('Unknown admin command. Use help.');
  }
  console.log('Done.');
} finally { await pool.end(); }
