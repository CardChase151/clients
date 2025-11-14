-- Check all users in the system
SELECT
  id,
  email,
  approved,
  is_admin,
  created_at
FROM users
ORDER BY created_at DESC;

-- If you need to manually add a user (replace with actual values):
-- INSERT INTO auth.users (
--   instance_id,
--   id,
--   aud,
--   role,
--   email,
--   encrypted_password,
--   email_confirmed_at,
--   created_at,
--   updated_at
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000',
--   gen_random_uuid(),
--   'authenticated',
--   'authenticated',
--   'viewer@example.com',
--   crypt('password123', gen_salt('bf')),
--   now(),
--   now(),
--   now()
-- );

-- After creating user in auth.users, add to public.users table:
-- INSERT INTO public.users (id, email, approved, is_admin)
-- VALUES (
--   'PASTE_USER_ID_FROM_ABOVE',
--   'viewer@example.com',
--   true,
--   false
-- );

-- Easier way: Just check if viewer signed up via the app
-- and approve them in the admin panel
