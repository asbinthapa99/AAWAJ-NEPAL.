-- ============================================================
-- MIGRATION SQL - Run this in Supabase SQL Editor
-- For EXISTING databases that need updates
-- ============================================================

-- ============================================================
-- 1. UPDATE PROFILES TABLE
-- ============================================================

-- Add email column if it doesn't exist (for username login)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Add phone column for future phone auth (optional)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- Populate email column for existing users
UPDATE profiles 
SET email = (SELECT email FROM auth.users WHERE auth.users.id = profiles.id)
WHERE email IS NULL;

-- ============================================================
-- 2. UPDATE POSTS TABLE - Add missing categories
-- ============================================================

-- Drop the old constraint
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_category_check;

-- Add new constraint with all categories
ALTER TABLE posts ADD CONSTRAINT posts_category_check 
  CHECK (category IN (
    'politics',
    'education', 
    'health',
    'infrastructure',
    'environment',
    'economy',
    'social',
    'corruption',
    'technology',
    'other'
  ));

-- ============================================================
-- 3. CREATE INDEXES (if not exist)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_district ON posts(district);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_urgency ON posts(urgency);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_supports_post ON supports(post_id);
CREATE INDEX IF NOT EXISTS idx_supports_user ON supports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_post ON reports(post_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports(reporter_id);

-- ============================================================
-- 4. UPDATE TRIGGER FUNCTION (to save email)
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
BEGIN
  -- Use provided username or generate unique one
  v_username := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    'user_' || SUBSTR(NEW.id::TEXT, 1, 8)
  );
  
  INSERT INTO profiles (id, username, email, phone, full_name, avatar_url, district)
  VALUES (
    NEW.id,
    v_username,
    NEW.email,
    NEW.phone,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      split_part(COALESCE(NEW.email, 'user'), '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'district'
  );
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 5. VERIFY DATA
-- ============================================================

-- Check if all tables exist
SELECT 
  'profiles' as table_name, 
  COUNT(*) as row_count 
FROM profiles
UNION ALL
SELECT 'posts', COUNT(*) FROM posts
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'supports', COUNT(*) FROM supports
UNION ALL
SELECT 'reports', COUNT(*) FROM reports;

-- Check columns in profiles
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
