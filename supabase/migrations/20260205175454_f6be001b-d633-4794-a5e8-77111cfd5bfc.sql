-- Add base_price column to vehicle_settings
ALTER TABLE public.vehicle_settings 
ADD COLUMN base_price numeric DEFAULT 5.0;