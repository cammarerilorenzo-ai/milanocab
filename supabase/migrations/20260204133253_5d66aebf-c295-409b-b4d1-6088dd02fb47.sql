-- Rename customer_email column to customer_phone
ALTER TABLE public.ride_requests 
  RENAME COLUMN customer_email TO customer_phone;

-- Update column comment
COMMENT ON COLUMN public.ride_requests.customer_phone IS 'Customer phone number for WhatsApp contact';