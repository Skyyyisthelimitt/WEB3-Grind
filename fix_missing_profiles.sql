-- 1. Backfill profiles for existing users
-- This inserts a profile row for any user in auth.users that is missing from public.profiles
INSERT INTO public.profiles (id, username, full_name, avatar_url)
SELECT 
  id, 
  raw_user_meta_data->>'username', 
  raw_user_meta_data->>'full_name', 
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Policies already exist, so we skip creating them to avoid errors.

