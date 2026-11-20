import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import Stripe from 'stripe';
import { premiumHandler } from '../api/premium.mjs';
import { generate } from '../server/premium-ai.mjs';

const example = { profile: { summary: 'Designer using Figma.', workExperience: [], education: [], skills: [{ name: 'Figma', category: 'Technical' }], languages: [], optionalSections: [] }, matching: [], missing: [], keywords: [], suggestions: [] };

async function serve(t, handler) {
  const server = createServer(handler).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}/api/premium`;
}

test('unconfigured deployment allows browse-only, not payments or AI', async (t) => {
  const url = await serve(t, premiumHandler({}));
  assert.equal((await (await fetch(`${url}?action=status`)).json()).enabled, false);
  assert.equal((await fetch(`${url}?action=checkout`, { method: 'POST' })).status, 503);
});

test('wallet verifies payment, rejects forged and duplicate events, reserves one credit, restores it on failures, and permits revisions', async (t) => {
  const db = new PGlite();
  await db.exec(await readFile(new URL('../server/schema.sql', import.meta.url), 'utf8'));
  t.after(() => db.close());
  const query = async (...args) => {
    const { rows, affectedRows } = await db.query(...args);
    return { rows, rowCount: rows.length || affectedRows || 0 };
  };
  // Embedded Postgres uses one connection. Serialize transactions like the wallet lock does in prod.
  let ready = Promise.resolve();
  const pool = { query, async connect() {
    let release;
    const previous = ready;
    ready = new Promise((resolve) => { release = resolve; });
    await previous;
    return { query, release };
  } };
  const env = { DATABASE_URL: 'test', STRIPE_SECRET_KEY: 'sk_test_no_network', STRIPE_WEBHOOK_SECRET: 'stripe-test-webhook-secret', OPENAI_API_KEY: 'test', PREMIUM_SESSION_SECRET: 'session-secret-only-used-for-the-tests', PREMIUM_APP_URL: 'https://pathcv.example', PREMIUM_CURRENCIES: 'PKR,EUR,INVALID' };
  const sdk = new Stripe(env.STRIPE_SECRET_KEY);
  let session, empty = true, calls = 0, sessionsCreated = 0, failOpenOnce = false;
  const providerRequests = new Map();
  const stripe = { webhooks: sdk.webhooks, checkout: { sessions: {
    create: async (req, { idempotencyKey }) => {
      assert.equal(req.payment_method_types, undefined);
      assert.deepEqual(req.adaptive_pricing, { enabled: false });
      if (providerRequests.has(idempotencyKey)) return providerRequests.get(idempotencyKey);
      session = { id: `cs_test_pathcv_${++sessionsCreated}`, url: 'https://checkout.stripe.com/test', status: 'open', mode: req.mode, metadata: req.metadata, amount_total: req.line_items[0].price_data.unit_amount, currency: req.line_items[0].price_data.currency, payment_status: 'unpaid' };
      providerRequests.set(idempotencyKey, session);
      if (failOpenOnce) { failOpenOnce = false; throw new Error('Transport closed after Stripe created the session'); }
      return session;
    },
    retrieve: async (id) => [...providerRequests.values()].find((entry) => entry.id === id),
  } } };
  const url = await serve(t, premiumHandler(env, { pool, stripe, generate: async ({ mode }) => { calls++; return { result: empty ? null : mode === 'revise' ? { replacement: 'Revised wording.' } : example }; } }));
  const request = async (action, { cookie, body, origin = env.PREMIUM_APP_URL, id } = {}) => {
    const res = await fetch(`${url}?${new URLSearchParams({ action, ...(id ? { id } : {}) })}`, { ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}), headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body ? { Origin: origin, 'Content-Type': 'application/json' } : {}) } });
    return { status: res.status, cookie: res.headers.get('set-cookie')?.split(';')[0], data: await res.json() };
  };
  const event = async ({ type = 'checkout.session.completed', valid = true, object = session } = {}) => {
    const payload = JSON.stringify({ type, data: { object } });
    const signature = valid ? sdk.webhooks.generateTestHeaderString({ payload, secret: env.STRIPE_WEBHOOK_SECRET }) : 'forged';
    return (await fetch(`${url}?action=webhook`, { method: 'POST', body: payload, headers: { 'Stripe-Signature': signature } })).status;
  };
  const { cookie, data: status } = await request('status');
  const other = (await request('status')).cookie;
  assert.deepEqual(status.prices.map((price) => price.currency), ['USD', 'PKR', 'EUR']);
  assert.equal(status.credits, 0);
  const gen = { id: randomUUID(), mode: 'create', role: 'Designer', evidence: 'Worked on design mockups in Figma.', job: '' };
  assert.equal((await request('generate', { cookie, body: gen })).status, 402);
  assert.equal((await request('checkout', { cookie, body: { currency: 'PKR' }, origin: 'https://other.example' })).status, 403);
  assert.equal((await request('checkout', { cookie: `${cookie}0`, body: { currency: 'PKR' } })).status, 403);
  assert.equal((await request('checkout', { cookie, body: { currency: 'ZZZ' } })).status, 400);
  assert.equal((await request('checkout', { cookie, body: { currency: 'PKR', quotedAmount: 1 } })).status, 409);
  const pkr = { currency: 'PKR', quotedAmount: 28000 };
  failOpenOnce = true;
  assert.equal((await request('checkout', { cookie, body: pkr })).status, 503);
  const opened = (await request('checkout', { cookie, body: pkr })).data;
  assert.equal(opened.state, 'open');
  assert.deepEqual(opened.price, { currency: 'PKR', amount: 28000 });
  assert.equal(session.amount_total, 28000);
  assert.equal((await request('checkout', { cookie, body: pkr })).data.paymentId, opened.paymentId);
  assert.equal(sessionsCreated, 1);
  assert.equal((await request('confirm', { cookie: other, body: { paymentId: opened.paymentId } })).status, 404);
  assert.equal((await request('confirm', { cookie, body: { paymentId: opened.paymentId } })).data.url, session.url);
  session.status = 'complete';
  assert.equal((await request('checkout', { cookie, body: pkr })).data.state, 'processing');
  assert.equal(sessionsCreated, 1);
  const confirm = { sessionId: session.id };
  assert.equal((await request('confirm', { cookie: other, body: confirm })).status, 404);
  assert.equal((await request('confirm', { cookie, body: confirm })).data.paid, false);
  session.payment_status = 'paid'; session.payment_intent = 'pi_pathcv';
  assert.equal(await event({ valid: false }), 400);
  assert.equal(await event({ object: { ...session, amount_total: 1 } }), 200);
  assert.equal((await request('status', { cookie })).data.credits, 0);
  assert.equal((await request('confirm', { cookie, body: confirm })).data.paid, true);
  assert.equal(await event(), 200);
  assert.equal((await request('status', { cookie })).data.credits, 1);
  assert.equal((await request('generate', { cookie, body: gen })).data.state, 'failed');
  assert.equal((await request('status', { cookie })).data.credits, 1);
  empty = false;
  const id = randomUUID();
  assert.equal((await request('generate', { cookie, body: { ...gen, id } })).data.state, 'done');
  assert.deepEqual((await request('generate', { cookie, body: { ...gen, id } })).data.result, example);
  assert.equal((await request('job', { cookie: other, id })).status, 404);
  assert.equal((await request('job', { cookie, id })).data.state, 'done');
  assert.equal((await request('status', { cookie })).data.credits, 0);
  const revision = { id: randomUUID(), mode: 'revise', parent: id, section: 'Summary', selection: 'Designer using Figma.', evidence: gen.evidence, instruction: 'polish' };
  assert.equal((await request('generate', { cookie: other, body: revision })).status, 403);
  assert.equal((await request('generate', { cookie, body: revision })).data.result.replacement, 'Revised wording.');
  assert.equal(calls, 3);
  for (let i = 0; i < 7; i++) assert.equal((await request('generate', { cookie, body: { ...revision, id: randomUUID() } })).data.state, 'done');
  assert.equal((await request('generate', { cookie, body: { ...revision, id: randomUUID() } })).status, 403);
  assert.equal(await event({ type: 'charge.refunded', object: { refunded: true, payment_intent: 'pi_pathcv' } }), 200);
  assert.equal(await event(), 200);
  assert.equal((await request('status', { cookie })).data.payments[0].state, 'refunded');
  const delayed = (await request('checkout', { cookie, body: { currency: 'USD', quotedAmount: 100 } })).data;
  session.status = 'complete';
  assert.equal(await event(), 200);
  assert.equal((await request('confirm', { cookie, body: { paymentId: delayed.paymentId } })).data.state, 'processing');
  assert.equal(await event({ type: 'checkout.session.async_payment_failed' }), 200);
  assert.equal((await request('confirm', { cookie, body: { paymentId: delayed.paymentId } })).data.state, 'closed');
  assert.equal((await request('status', { cookie })).data.credits, 0);
  const retry = (await request('checkout', { cookie, body: { currency: 'USD', quotedAmount: 100 } })).data;
  assert.notEqual(retry.paymentId, delayed.paymentId);
  session.status = 'expired';
  assert.equal((await request('confirm', { cookie, body: { paymentId: retry.paymentId } })).data.state, 'closed');
  // Simulate a process interruption after credit reservation: the next wallet read restores it.
  const staleJob = randomUUID(), promoCredit = randomUUID();
  await query("INSERT INTO premium_credits (id,wallet,state) VALUES ($1,$2,'reserved')", [promoCredit, status.wallet]);
  await query("INSERT INTO premium_jobs (id,wallet,credit,mode,created_at) VALUES ($1,$2,$3,'create',now() - interval '3 minutes')", [staleJob, status.wallet, promoCredit]);
  assert.equal((await request('status', { cookie })).data.credits, 1);
  assert.equal((await request('job', { cookie, id: staleJob })).data.state, 'failed');
  assert.equal((await request('status', { cookie })).data.credits, 1);
});

test('model output guard drops unsupported matching evidence and unsupported numeric claims', async () => {
  const payload = structuredClone(example);
  payload.profile.summary = 'Designed 98 projects.\nDesigner using Figma.';
  payload.matching = [{ skill: 'Figma', evidence: 'mockups in Figma' }, { skill: 'SQL', evidence: 'built SQL pipelines' }];
  const response = (value) => async () => new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(value) } }], usage: { prompt_tokens: 100, completion_tokens: 100 } }));
  const input = { mode: 'match', evidence: 'Worked on design mockups in Figma.', job: 'The job needs Figma and SQL.' };
  const { result, usage } = await generate(input, { AI_INPUT_USD_PER_MILLION: '1', AI_OUTPUT_USD_PER_MILLION: '1' }, response(payload));
  assert.deepEqual(result.matching, [payload.matching[0]]);
  assert.equal(result.profile.summary, 'Designer using Figma.');
  assert.equal(usage.cost, 0.0002);
  assert.equal((await generate(input, {}, response({ bad: true }))).result, null);
});
