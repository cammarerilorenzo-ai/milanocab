-- Remove the old check constraint and add a new one with updated values
ALTER TABLE public.ride_requests DROP CONSTRAINT IF EXISTS ride_requests_status_check;

ALTER TABLE public.ride_requests ADD CONSTRAINT ride_requests_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'picked_up', 'completed'));