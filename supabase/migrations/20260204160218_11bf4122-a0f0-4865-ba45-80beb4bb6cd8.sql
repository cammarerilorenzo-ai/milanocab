-- Create table for authorized phone numbers
CREATE TABLE public.authorized_phones (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.authorized_phones ENABLE ROW LEVEL SECURITY;

-- No public read access - verification will be done via edge function
CREATE POLICY "No direct access to authorized phones"
ON public.authorized_phones
FOR SELECT
USING (false);

-- Comment for documentation
COMMENT ON TABLE public.authorized_phones IS 'Table storing authorized phone numbers for admin access';