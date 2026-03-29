-- WS3: Credits and purchases schema
-- Adds credit system columns to profiles, and creates credit_packs + purchases tables.

-- Add credit-related columns to profiles (created by WS1 auth)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS credit_balance integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Credit packs available for purchase
CREATE TABLE IF NOT EXISTS credit_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credits integer NOT NULL,
  price_cents integer NOT NULL,
  stripe_price_id text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase records
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_session_id text UNIQUE NOT NULL,
  credit_pack_id uuid NOT NULL REFERENCES credit_packs(id),
  credits_purchased integer NOT NULL,
  amount_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session_id ON purchases(stripe_session_id);

-- RLS policies
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Anyone can read active credit packs
CREATE POLICY "Anyone can read active credit packs"
  ON credit_packs FOR SELECT
  USING (is_active = true);

-- Users can read their own purchases
CREATE POLICY "Users can read own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = user_id);

-- Seed credit packs
INSERT INTO credit_packs (name, credits, price_cents, stripe_price_id) VALUES
  ('Starter', 10, 499, 'price_starter_placeholder'),
  ('Pro', 50, 1999, 'price_pro_placeholder'),
  ('Mega', 150, 4999, 'price_mega_placeholder');
