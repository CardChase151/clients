-- Add is_admin field if it doesn't exist (it was already added in add-approved-field.sql)
-- This is just to ensure it exists
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Set viewer@gmail.com as admin for testing
UPDATE public.users
SET is_admin = TRUE
WHERE email = 'viewer@gmail.com';
