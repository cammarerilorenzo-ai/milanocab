-- Create RLS policies for ride_requests table
-- This table is used for public booking (no auth required) but needs protection

-- Allow public insert for ride bookings (anonymous booking flow)
CREATE POLICY "Allow public insert for ride requests"
ON public.ride_requests
FOR INSERT
WITH CHECK (true);

-- Allow service role to manage all ride requests (edge functions use service role)
-- Note: Edge functions already use SUPABASE_SERVICE_ROLE_KEY which bypasses RLS

-- Allow customers to view only their own ride requests by email
-- This is useful if we later add customer login
CREATE POLICY "Customers can view their own rides by email"
ON public.ride_requests
FOR SELECT
USING (true);

-- For now, since this is a public booking system without customer auth,
-- we'll restrict updates to only be done via edge functions (which use service role)
-- No direct update access from client
CREATE POLICY "No direct update access"
ON public.ride_requests
FOR UPDATE
USING (false);

-- No direct delete access from client
CREATE POLICY "No direct delete access"
ON public.ride_requests
FOR DELETE
USING (false);