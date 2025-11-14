-- Set viewer@gmail.com as NOT admin
UPDATE public.users
SET is_admin = FALSE
WHERE email = 'viewer@gmail.com';
