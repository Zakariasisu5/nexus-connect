-- Fix the handle_new_user function to use gen_random_uuid() instead of gen_random_bytes()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, qr_code_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    replace(gen_random_uuid()::text, '-', '')
  );
  
  -- Assign default attendee role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'attendee');
  
  RETURN NEW;
END;
$$;