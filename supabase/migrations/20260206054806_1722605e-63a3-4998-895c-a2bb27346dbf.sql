-- Drop and recreate is_admin function to normalize phone numbers
CREATE OR REPLACE FUNCTION public.is_admin(check_phone text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_phone text;
  phone_without_prefix text;
BEGIN
  -- Normalize the input phone
  normalized_phone := regexp_replace(check_phone, '[\s\-\(\)\.]', '', 'g');
  
  -- If starts with +, use as-is
  IF normalized_phone LIKE '+%' THEN
    -- Direct match
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE phone = normalized_phone AND role = 'admin') THEN
      RETURN true;
    END IF;
  END IF;
  
  -- Extract just the number without country prefix for flexible matching
  phone_without_prefix := regexp_replace(normalized_phone, '^\+?39|^\+?55', '', 'g');
  
  -- Check if any admin phone ends with this number (handles different prefix formats)
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'admin'
      AND (
        phone = normalized_phone
        OR phone = '+39' || phone_without_prefix
        OR phone = '+55' || phone_without_prefix
        OR phone LIKE '%' || phone_without_prefix
      )
  );
END;
$$;