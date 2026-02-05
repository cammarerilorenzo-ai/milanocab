-- Add referred_by column to track who invited each user
ALTER TABLE public.authorized_phones
ADD COLUMN referred_by uuid REFERENCES public.authorized_phones(id) ON DELETE SET NULL;