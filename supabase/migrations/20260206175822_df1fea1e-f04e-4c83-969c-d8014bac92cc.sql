
-- =============================================
-- FIX #1: Rimuovere accesso pubblico a ride_requests
-- =============================================
DROP POLICY IF EXISTS "Customers can view their own rides by email" ON public.ride_requests;
CREATE POLICY "No direct SELECT access" ON public.ride_requests FOR SELECT USING (false);

-- =============================================
-- FIX #2: Nascondere posizione admin dalla lettura pubblica
-- =============================================
DROP POLICY IF EXISTS "Anyone can read app settings" ON public.app_settings;
CREATE POLICY "Anyone can read non-sensitive app settings" ON public.app_settings 
  FOR SELECT USING (key NOT IN ('admin_lat', 'admin_lon', 'admin_location_updated_at'));

-- =============================================
-- FIX #4: Trigger per redazione automatica del telefono all'inserimento
-- =============================================
CREATE OR REPLACE FUNCTION public.redact_phone_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF LENGTH(NEW.customer_phone) > 4 THEN
    NEW.customer_phone := '***' || RIGHT(NEW.customer_phone, 4);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER redact_phone_before_insert
BEFORE INSERT ON public.ride_requests
FOR EACH ROW
EXECUTE FUNCTION public.redact_phone_on_insert();

-- =============================================
-- FIX #3: Tabella sessioni per validazione server-side
-- =============================================
CREATE TABLE public.auth_sessions (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS: nessun accesso diretto (solo edge functions con service role)
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to sessions" ON public.auth_sessions FOR SELECT USING (false);

-- Indice per pulizia sessioni scadute
CREATE INDEX idx_auth_sessions_expires_at ON public.auth_sessions (expires_at);

-- Pulizia automatica sessioni scadute (opzionale, tramite cron o manuale)
