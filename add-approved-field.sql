-- Add approved field to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;

-- Add admin field for future use
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for approved status
CREATE INDEX IF NOT EXISTS users_approved_idx ON public.users(approved);

-- Update existing viewer user to be approved (optional - remove if you want them to wait)
-- UPDATE public.users SET approved = TRUE WHERE email = 'viewer@gmail.com';
