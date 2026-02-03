-- Tabella per salvare le richieste di corsa
CREATE TABLE public.ride_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  confirmation_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  customer_email TEXT NOT NULL,
  pickup TEXT NOT NULL,
  destination TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lon DOUBLE PRECISION NOT NULL,
  dest_lat DOUBLE PRECISION NOT NULL,
  dest_lon DOUBLE PRECISION NOT NULL,
  date_time TEXT NOT NULL,
  estimated_price DECIMAL(10,2) NOT NULL,
  estimated_km DECIMAL(10,1) NOT NULL,
  estimated_min INTEGER NOT NULL,
  maps_link TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  admin_lat DOUBLE PRECISION,
  admin_lon DOUBLE PRECISION,
  eta_min INTEGER,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indice per cercare per token di conferma
CREATE INDEX idx_ride_requests_token ON public.ride_requests(confirmation_token);

-- Indice per cercare per status
CREATE INDEX idx_ride_requests_status ON public.ride_requests(status);

-- RLS: le richieste sono accessibili solo tramite le edge functions (service role)
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;

-- Policy per permettere inserimento da edge functions (usando service role)
-- Le edge functions usano il service role che bypassa RLS