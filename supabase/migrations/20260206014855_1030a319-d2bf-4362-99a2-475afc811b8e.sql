-- Create enum for customer groups
CREATE TYPE public.customer_group AS ENUM ('private', 'business');

-- Create pricing configuration table for customer groups
CREATE TABLE public.group_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_group customer_group NOT NULL UNIQUE,
  display_name text NOT NULL,
  base_price numeric DEFAULT 5.0,
  price_per_km numeric DEFAULT 1.5,
  price_per_min numeric DEFAULT 0.30,
  discount_short numeric DEFAULT 0.05,
  discount_long numeric DEFAULT 0.15,
  night_surcharge numeric DEFAULT 0.30,
  airport_malpensa numeric DEFAULT 65.0,
  airport_orio numeric DEFAULT 65.0,
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.group_pricing ENABLE ROW LEVEL SECURITY;

-- Anyone can read pricing (needed for price calculation)
CREATE POLICY "Anyone can read group pricing"
  ON public.group_pricing FOR SELECT
  USING (true);

-- No direct modifications (only via edge function)
CREATE POLICY "No direct insert"
  ON public.group_pricing FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update"
  ON public.group_pricing FOR UPDATE
  USING (false);

CREATE POLICY "No direct delete"
  ON public.group_pricing FOR DELETE
  USING (false);

-- Insert default pricing groups
INSERT INTO public.group_pricing (customer_group, display_name, base_price, price_per_km, price_per_min, discount_short, discount_long, night_surcharge, airport_malpensa, airport_orio)
VALUES 
  ('private', 'Privati', 5.0, 1.5, 0.30, 0.05, 0.15, 0.30, 65.0, 65.0),
  ('business', 'Business', 4.5, 1.3, 0.25, 0.08, 0.20, 0.25, 55.0, 55.0);