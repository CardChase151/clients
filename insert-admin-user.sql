-- Insert admin@gmail.com user into users table
INSERT INTO public.users (id, email, full_name, avatar_url, approved, is_admin, created_at, updated_at)
VALUES (
  '7762a940-c936-4c70-8e9a-54893c941951',
  'admin@gmail.com',
  'Admin User',
  NULL,
  TRUE,
  TRUE,
  '2025-11-13 16:35:20.017671+00',
  '2025-11-13 16:35:20.023988+00'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  approved = EXCLUDED.approved,
  is_admin = EXCLUDED.is_admin,
  updated_at = NOW();
