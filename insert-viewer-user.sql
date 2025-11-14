-- Insert viewer@gmail.com user into users table
INSERT INTO public.users (id, email, full_name, avatar_url, created_at, updated_at)
VALUES (
  'f91ca9bd-e801-44ff-b2e5-496bac320bb4',
  'viewer@gmail.com',
  'Viewer User',
  NULL,
  '2025-11-13 14:13:11.524687+00',
  '2025-11-13 14:13:11.54642+00'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();
