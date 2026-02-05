-- Enum per i ruoli
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Tabella ruoli utente
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone text NOT NULL UNIQUE,
    role app_role NOT NULL DEFAULT 'user',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Abilita RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Funzione per verificare se un telefono è admin (security definer per evitare ricorsione)
CREATE OR REPLACE FUNCTION public.is_admin(check_phone text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE phone = check_phone
      AND role = 'admin'
  )
$$;

-- Policy: solo admin può vedere i ruoli
CREATE POLICY "Admins can view roles"
ON public.user_roles
FOR SELECT
USING (false);

-- Tabella impostazioni veicoli
CREATE TABLE public.vehicle_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_type text NOT NULL UNIQUE,
    is_available boolean NOT NULL DEFAULT true,
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Abilita RLS
ALTER TABLE public.vehicle_settings ENABLE ROW LEVEL SECURITY;

-- Policy: tutti possono leggere le impostazioni veicoli
CREATE POLICY "Anyone can read vehicle settings"
ON public.vehicle_settings
FOR SELECT
USING (true);

-- Solo edge functions possono modificare (nessuna policy di update diretta)

-- Inserisci i veicoli di default
INSERT INTO public.vehicle_settings (vehicle_type, is_available) VALUES
('economy', true),
('premium', true);