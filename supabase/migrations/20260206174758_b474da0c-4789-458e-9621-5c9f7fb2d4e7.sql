
-- Rinominare la colonna vehicle_type in vehicle_name
ALTER TABLE public.vehicle_settings RENAME COLUMN vehicle_type TO vehicle_name;

-- Aggiornare i valori
UPDATE public.vehicle_settings SET vehicle_name = 'fiat500' WHERE vehicle_name = 'economy';
UPDATE public.vehicle_settings SET vehicle_name = 'vwtroc' WHERE vehicle_name = 'premium';
