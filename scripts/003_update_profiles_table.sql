-- Update the existing profiles table to include additional skincare-specific fields
-- This extends the current profiles table with skincare-related information

-- Add new columns to the existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS skin_goals TEXT[],
ADD COLUMN IF NOT EXISTS allergies TEXT[],
ADD COLUMN IF NOT EXISTS current_medications TEXT[],
ADD COLUMN IF NOT EXISTS dermatologist_name TEXT,
ADD COLUMN IF NOT EXISTS preferred_routine_time_morning TIME DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS preferred_routine_time_evening TIME DEFAULT '22:00',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Update the skin_concerns column to be more comprehensive if needed
-- (This column already exists, so we're just ensuring it's properly set up)

-- Create a trigger to automatically create default routines when a user completes onboarding
CREATE OR REPLACE FUNCTION public.create_default_routines()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create routines if onboarding was just completed
  IF NEW.onboarding_completed = true AND (OLD.onboarding_completed IS NULL OR OLD.onboarding_completed = false) THEN
    -- Create default morning routine
    INSERT INTO public.routines (user_id, name, type, is_active)
    VALUES (NEW.id, 'Morning Routine', 'morning', true);
    
    -- Create default evening routine
    INSERT INTO public.routines (user_id, name, type, is_active)
    VALUES (NEW.id, 'Evening Routine', 'evening', true);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_profile_onboarding_completed ON public.profiles;
CREATE TRIGGER on_profile_onboarding_completed
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_routines();
