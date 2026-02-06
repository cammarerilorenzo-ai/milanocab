-- Add customer_name and referral_name columns to ride_requests
ALTER TABLE public.ride_requests 
ADD COLUMN customer_name text,
ADD COLUMN referral_name text;