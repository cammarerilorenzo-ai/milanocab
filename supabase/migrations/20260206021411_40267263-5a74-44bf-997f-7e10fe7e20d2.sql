-- Add customer_group column to authorized_phones
ALTER TABLE public.authorized_phones 
ADD COLUMN customer_group public.customer_group DEFAULT 'private'::public.customer_group;