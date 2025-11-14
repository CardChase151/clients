-- Approve viewer@gmail.com user
UPDATE public.users
SET approved = TRUE
WHERE email = 'viewer@gmail.com';
