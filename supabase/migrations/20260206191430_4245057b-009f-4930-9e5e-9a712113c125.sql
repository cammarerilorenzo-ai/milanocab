
CREATE TABLE public.ride_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ride_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public insert (same pattern as ride_requests)
CREATE POLICY "Allow public insert for reviews"
ON public.ride_reviews
FOR INSERT
WITH CHECK (true);

-- No direct read/update/delete
CREATE POLICY "No direct SELECT"
ON public.ride_reviews FOR SELECT
USING (false);

CREATE POLICY "No direct UPDATE"
ON public.ride_reviews FOR UPDATE
USING (false);

CREATE POLICY "No direct DELETE"
ON public.ride_reviews FOR DELETE
USING (false);
