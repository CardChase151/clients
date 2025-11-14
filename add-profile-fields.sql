-- Update users table for profile completion
-- Drop old full_name column and add new profile fields
ALTER TABLE public.users
DROP COLUMN IF EXISTS full_name,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS app_name TEXT,
ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN public.users.first_name IS 'User first name';
COMMENT ON COLUMN public.users.last_name IS 'User last name';
COMMENT ON COLUMN public.users.phone_number IS 'User phone number (required)';
COMMENT ON COLUMN public.users.company_name IS 'Company name (optional)';
COMMENT ON COLUMN public.users.app_name IS 'Name of app being built (can be changed later)';
COMMENT ON COLUMN public.users.profile_complete IS 'Whether user has completed their profile';
