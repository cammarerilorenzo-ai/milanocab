-- Add new columns to vehicle_settings for dynamic vehicle management
ALTER TABLE public.vehicle_settings
ADD COLUMN display_name text,
ADD COLUMN description text,
ADD COLUMN image_url text,
ADD COLUMN price_multiplier numeric DEFAULT 1.0;

-- Update existing vehicles with current data
UPDATE public.vehicle_settings 
SET display_name = 'Utilitaria', 
    description = 'Comoda e conveniente',
    price_multiplier = 1.0
WHERE vehicle_type = 'economy';

UPDATE public.vehicle_settings 
SET display_name = 'SUV Cabrio', 
    description = 'Spazio e stile',
    price_multiplier = 1.3
WHERE vehicle_type = 'premium';

-- Create storage bucket for vehicle images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicle-images', 'vehicle-images', true);

-- Allow anyone to view vehicle images
CREATE POLICY "Anyone can view vehicle images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-images');

-- Allow admins to upload vehicle images (via edge function with service role)
CREATE POLICY "Service role can manage vehicle images"
ON storage.objects FOR ALL
USING (bucket_id = 'vehicle-images')
WITH CHECK (bucket_id = 'vehicle-images');