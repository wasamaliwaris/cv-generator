CREATE TABLE IF NOT EXISTS premium_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  usd_cents integer NOT NULL DEFAULT 100 CHECK (usd_cents BETWEEN 100 AND 10000)
);
INSERT INTO premium_settings (id) VALUES (true) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS premium_wallets (id uuid PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS premium_payments (
  id uuid PRIMARY KEY,
  wallet uuid NOT NULL REFERENCES premium_wallets(id),
  session_id text UNIQUE, intent_id text UNIQUE,
  provider text NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe','safepay')),
  amount integer NOT NULL, currency text NOT NULL,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','paid','expired','refunded')),
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Existing Stripe installations keep their payment rows and credits.
ALTER TABLE premium_payments ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe','safepay'));
CREATE TABLE IF NOT EXISTS premium_credits (
  id uuid PRIMARY KEY,
  wallet uuid NOT NULL REFERENCES premium_wallets(id),
  payment uuid UNIQUE REFERENCES premium_payments(id),
  state text NOT NULL DEFAULT 'available' CHECK (state IN ('available','reserved','used','revoked')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS premium_jobs (
  id uuid PRIMARY KEY,
  wallet uuid NOT NULL REFERENCES premium_wallets(id),
  credit uuid NOT NULL REFERENCES premium_credits(id),
  parent uuid REFERENCES premium_jobs(id),
  mode text NOT NULL,
  state text NOT NULL DEFAULT 'running' CHECK (state IN ('running','done','failed')),
  result jsonb,
  input_tokens integer, output_tokens integer, model text, cost_usd numeric(14,8),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS premium_payments_wallet ON premium_payments (wallet, created_at DESC);
CREATE INDEX IF NOT EXISTS premium_credits_wallet ON premium_credits (wallet, state);
CREATE INDEX IF NOT EXISTS premium_jobs_wallet ON premium_jobs (wallet, created_at DESC);
CREATE INDEX IF NOT EXISTS premium_jobs_parent ON premium_jobs (parent, state);
CREATE INDEX IF NOT EXISTS premium_jobs_result_cleanup ON premium_jobs (created_at) WHERE result IS NOT NULL;
