import { randomUUID } from 'node:crypto';
import pg from 'pg';

export const REVISION_LIMIT = 8;
export const resultAge = "now() - interval '24 hours'";
export class PremiumError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export function database(url) { return new pg.Pool({ connectionString: url, max: 4, connectionTimeoutMillis: 4000 }); }
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
    async recordPayment(session) {
      const { rows: [payment] } = await q('SELECT * FROM premium_payments WHERE id::text=$1 AND wallet::text=$2', [session.metadata?.payment ?? '', session.metadata?.wallet ?? '']);
      if (!payment || session.mode !== 'payment' || session.amount_total !== payment.amount || session.currency?.toUpperCase() !== payment.currency || (payment.session_id && payment.session_id !== session.id)) return false;
      if (session.payment_status !== 'paid' && session.status !== 'expired') return false;
      return tx(payment.wallet, async (query) => {
        if (session.payment_status === 'paid' && typeof session.payment_intent === 'string') {
          const { rowCount } = await query("UPDATE premium_payments SET state='paid', session_id=$2, intent_id=$3 WHERE id=$1 AND state IN ('pending','expired') AND (session_id IS NULL OR session_id=$2)", [payment.id, session.id, session.payment_intent]);
          if (rowCount) await query('INSERT INTO premium_credits (id,wallet,payment) VALUES ($1,$2,$3)', [randomUUID(), payment.wallet, payment.id]);
        } else {
          await query("UPDATE premium_payments SET state='expired' WHERE id=$1 AND state='pending'", [payment.id]);
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
