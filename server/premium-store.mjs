import { randomUUID } from 'node:crypto';
import pg from 'pg';

export const REVISION_LIMIT = 8;
export const resultAge = "now() - interval '24 hours'";
export class PremiumError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function database(url) { return new pg.Pool({ connectionString: url, max: 4, connectionTimeoutMillis: 4000 }); }
export const checkoutMatches = (session, payment) => session.metadata?.payment === payment.id && session.metadata?.wallet === payment.wallet && session.mode === 'payment' && session.amount_total === payment.amount && session.currency?.toUpperCase() === payment.currency && (!payment.session_id || payment.session_id === session.id);

export function store(pool) {
  const q = (sql, params) => pool.query(sql, params);
  async function tx(wallet, work) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM premium_wallets WHERE id=$1 FOR UPDATE', [wallet]);
      const result = await work((sql, params) => client.query(sql, params));
      await client.query('COMMIT');
      return result;
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async function expireJobs(query, wallet) {
    await query(`WITH stale AS (
      UPDATE premium_jobs SET state='failed' WHERE wallet=$1 AND state='running' AND created_at < now() - interval '2 minutes' RETURNING credit, parent
    ) UPDATE premium_credits SET state='available' WHERE state='reserved' AND id IN (SELECT credit FROM stale WHERE parent IS NULL)`, [wallet]);
  }
  return {
    q, tx,
    async summary(wallet) {
      return tx(wallet, async (query) => {
        await expireJobs(query, wallet);
        const { rows: [row] } = await query("SELECT count(*)::int AS credits FROM premium_credits WHERE wallet=$1 AND state='available'", [wallet]);
        const { rows: payments } = await query('SELECT id, amount, currency, state, created_at FROM premium_payments WHERE wallet=$1 ORDER BY created_at DESC LIMIT 50', [wallet]);
        return { credits: row.credits, payments };
      });
    },
    async reserveCheckout(wallet, { currency, amount }, provider = 'stripe') {
      await q('INSERT INTO premium_wallets (id) VALUES ($1) ON CONFLICT DO NOTHING', [wallet]);
      return tx(wallet, async (query) => {
        await query("UPDATE premium_payments SET state='expired' WHERE wallet=$1 AND state='pending' AND session_id IS NULL AND created_at <= now() - interval '23 hours'", [wallet]);
        const { rows: [existing] } = await query("SELECT * FROM premium_payments WHERE wallet=$1 AND state='pending' AND currency=$2 AND amount=$3 AND provider=$4 ORDER BY created_at DESC LIMIT 1", [wallet, currency, amount, provider]);
        if (existing) return existing;
        const { rowCount } = await query("SELECT 1 FROM premium_payments WHERE wallet=$1 AND created_at > now() - interval '10 minutes'", [wallet]);
        if (rowCount >= 5) throw new PremiumError(429, 'Too many checkout attempts. Try again in a few minutes.');
        const { rows: [payment] } = await query('INSERT INTO premium_payments (id,wallet,amount,currency,provider) VALUES ($1,$2,$3,$4,$5) RETURNING *', [randomUUID(), wallet, amount, currency, provider]);
        return payment;
      });
    },
    async findPayment(wallet, { paymentId, sessionId }) {
      const { rows: [payment] } = paymentId
        ? await q('SELECT * FROM premium_payments WHERE wallet=$1 AND id=$2', [wallet, paymentId])
        : await q('SELECT * FROM premium_payments WHERE wallet=$1 AND session_id=$2', [wallet, sessionId]);
      return payment;
    },
    async findSafepayPayment(tracker) {
      const { rows: [payment] } = await q("SELECT * FROM premium_payments WHERE provider='safepay' AND session_id=$1", [tracker]);
      return payment;
    },
    async attachSafepayTracker(payment, createTracker) {
      return tx(payment.wallet, async (query) => {
        const { rows: [current] } = await query("SELECT * FROM premium_payments WHERE id=$1 AND provider='safepay'", [payment.id]);
        if (current.session_id || current.state !== 'pending') return current;
        // Store one tracker before issuing a hosted checkout URL. Concurrent requests reuse it.
        const tracker = await createTracker(current);
        await query('UPDATE premium_payments SET session_id=$2 WHERE id=$1', [current.id, tracker]);
        return { ...current, session_id: tracker };
      });
    },
    async recordSafepayStatus(payment, state) {
      return tx(payment.wallet, async (query) => {
        const { rows: [current] } = await query("SELECT id,state FROM premium_payments WHERE id=$1 AND provider='safepay' AND session_id=$2", [payment.id, payment.session_id]);
        if (!current) return 'closed';
        if (state === 'refunded') {
          await query("UPDATE premium_payments SET state='refunded' WHERE id=$1", [current.id]);
          await query("UPDATE premium_credits SET state='revoked' WHERE payment=$1", [current.id]);
          return 'closed';
        }
        if (current.state === 'paid') return 'paid';
        if (state === 'paid' && ['pending', 'expired'].includes(current.state)) {
          await query("UPDATE premium_payments SET state='paid' WHERE id=$1", [current.id]);
          await query('INSERT INTO premium_credits (id,wallet,payment) VALUES ($1,$2,$3) ON CONFLICT (payment) DO NOTHING', [randomUUID(), payment.wallet, current.id]);
          return 'paid';
        }
        if (state === 'closed' && current.state === 'pending') await query("UPDATE premium_payments SET state='expired' WHERE id=$1", [current.id]);
        return 'closed';
      });
    },
    async recordPayment(session, failed = false) {
      const { rows: [payment] } = await q('SELECT * FROM premium_payments WHERE id::text=$1 AND wallet::text=$2 AND provider=$3', [session.metadata?.payment ?? '', session.metadata?.wallet ?? '', 'stripe']);
      if (!payment || !checkoutMatches(session, payment)) return false;
      if (session.payment_status !== 'paid' && session.status !== 'expired' && !failed) return false;
      return tx(payment.wallet, async (query) => {
        if (session.payment_status === 'paid' && typeof session.payment_intent === 'string') {
          const { rowCount } = await query("UPDATE premium_payments SET state='paid', session_id=$2, intent_id=$3 WHERE id=$1 AND state IN ('pending','expired') AND (session_id IS NULL OR session_id=$2)", [payment.id, session.id, session.payment_intent]);
          if (rowCount) await query('INSERT INTO premium_credits (id,wallet,payment) VALUES ($1,$2,$3)', [randomUUID(), payment.wallet, payment.id]);
        } else if (session.status === 'expired' || failed) {
          await query("UPDATE premium_payments SET state='expired' WHERE id=$1 AND state='pending' AND (session_id IS NULL OR session_id=$2)", [payment.id, session.id]);
        }
        const { rows: [record] } = await query('SELECT state FROM premium_payments WHERE id=$1', [payment.id]);
        return record.state === 'paid';
      });
    },
    async reserve(wallet, { id, mode, parent }) {
      return tx(wallet, async (query) => {
        await expireJobs(query, wallet);
        const { rows: [existing] } = await query(`SELECT state, CASE WHEN created_at >= ${resultAge} THEN result END AS result FROM premium_jobs WHERE wallet=$1 AND id=$2`, [wallet, id]);
        if (existing) return existing;
        const { rowCount: running } = await query("SELECT 1 FROM premium_jobs WHERE wallet=$1 AND state='running'", [wallet]);
        if (running) throw new PremiumError(409, 'One AI request is already running. Please wait.');
        const { rowCount: recentFailures } = await query("SELECT 1 FROM premium_jobs WHERE wallet=$1 AND state='failed' AND created_at > now() - interval '10 minutes' LIMIT 5", [wallet]);
        if (recentFailures >= 5) throw new PremiumError(429, 'Several requests have failed recently. Wait a few minutes before trying again.');
        let credit;
        if (mode === 'revise') {
          const { rows: [original] } = await query("SELECT j.credit FROM premium_jobs j JOIN premium_credits c ON c.id=j.credit WHERE j.wallet=$1 AND j.id=$2 AND j.parent IS NULL AND j.state='done' AND c.state='used'", [wallet, parent]);
          if (!original) throw new PremiumError(403, 'Open a purchased AI CV to use AI revisions.');
          const { rows: [usage] } = await query("SELECT count(*)::int AS count FROM premium_jobs WHERE parent=$1 AND state='done'", [parent]);
          if (usage.count >= REVISION_LIMIT) throw new PremiumError(403, 'All included AI revisions are used. Manual editing and downloads are still free.');
          credit = original.credit;
        } else {
          const { rows: [available] } = await query("SELECT id FROM premium_credits WHERE wallet=$1 AND state='available' ORDER BY created_at LIMIT 1", [wallet]);
          if (!available) throw new PremiumError(402, 'Buy one AI credit to generate a new CV.');
          credit = available.id;
          await query("UPDATE premium_credits SET state='reserved' WHERE id=$1", [credit]);
        }
        await query('INSERT INTO premium_jobs (id,wallet,credit,mode,parent) VALUES ($1,$2,$3,$4,$5)', [id, wallet, credit, mode, parent ?? null]);
        return null;
      });
    },
    async finish(wallet, id, result, usage) {
      return tx(wallet, async (query) => {
        const { rows: [job] } = await query(`UPDATE premium_jobs SET state=$3,result=$4,input_tokens=$5,output_tokens=$6,model=$7,cost_usd=$8 WHERE wallet=$1 AND id=$2 AND state='running' RETURNING credit,parent`, [wallet, id, result ? 'done' : 'failed', result ? JSON.stringify(result) : null, usage?.input ?? null, usage?.output ?? null, usage?.model ?? null, usage?.cost ?? null]);
        if (job && !job.parent) await query("UPDATE premium_credits SET state=$2 WHERE id=$1 AND state='reserved'", [job.credit, result ? 'used' : 'available']);
        return Boolean(job);
      });
    },
    async getJob(wallet, id) {
      return tx(wallet, async (query) => {
        await expireJobs(query, wallet);
        const { rows: [job] } = await query(`SELECT state, CASE WHEN created_at >= ${resultAge} THEN result END AS result FROM premium_jobs WHERE wallet=$1 AND id=$2`, [wallet, id]);
        return job;
      });
    },
  };
}
