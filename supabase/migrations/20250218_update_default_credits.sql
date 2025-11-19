-- Migration: Update Default Credits to 5
-- Description: Changes default credits for new users from 3 to 5
-- Date: 2025-02-18

-- Update the default value on the credits column
ALTER TABLE public.profiles
ALTER COLUMN credits SET DEFAULT 5;

-- Update the trigger function to use the new default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  -- Insert a default profile for the new auth user
  -- Using explicit value to match column default
  INSERT INTO public.profiles (id, credits)
  VALUES (new.id, 5)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$;

-- Optional: Backfill existing users with free tier to 5 credits
-- Uncomment if you want to give existing users the new default
-- UPDATE public.profiles
-- SET credits = 5
-- WHERE tier = 'free' AND credits = 3;

-- Verification
DO $
DECLARE
  default_value TEXT;
BEGIN
  SELECT column_default INTO default_value
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'credits';

  RAISE NOTICE 'New default credits value: %', default_value;
END $;
