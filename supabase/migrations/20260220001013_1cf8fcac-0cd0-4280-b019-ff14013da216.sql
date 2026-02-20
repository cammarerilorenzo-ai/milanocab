
-- 1. Add 'ambassador' to customer_group enum
ALTER TYPE customer_group ADD VALUE IF NOT EXISTS 'ambassador';

-- 2. Create user_credits table
CREATE TABLE IF NOT EXISTS public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create credit_transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  amount numeric NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_phone ON public.user_credits(phone);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_phone ON public.credit_transactions(phone);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- 5. Enable RLS on both tables
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- 6. RLS: no direct public access (only via edge functions using service role)
CREATE POLICY "No direct access to user_credits"
  ON public.user_credits FOR SELECT
  USING (false);

CREATE POLICY "No direct insert to user_credits"
  ON public.user_credits FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update to user_credits"
  ON public.user_credits FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete to user_credits"
  ON public.user_credits FOR DELETE
  USING (false);

CREATE POLICY "No direct access to credit_transactions"
  ON public.credit_transactions FOR SELECT
  USING (false);

CREATE POLICY "No direct insert to credit_transactions"
  ON public.credit_transactions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct delete to credit_transactions"
  ON public.credit_transactions FOR DELETE
  USING (false);

-- 7. Trigger for updated_at on user_credits
CREATE OR REPLACE FUNCTION public.update_user_credits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_credits_updated_at
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_user_credits_timestamp();
