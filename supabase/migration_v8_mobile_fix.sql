-- ============================================================
-- Migration v8: Mobile Bug Fix
-- Fixes:
--   1. CREATES the comments table (was missing entirely)
--   2. Repairs the supports RLS policy (was blocking authenticated inserts)
--   3. Re-creates all count-tracking triggers safely
--
-- HOW TO RUN:
--   Open Supabase Dashboard → SQL Editor → paste + Run
-- ============================================================

-- Enable UUID extension (safe to run again)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. CREATE COMMENTS TABLE (was missing — caused "table not found" error)
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id     UUID        REFERENCES posts(id)    ON DELETE CASCADE NOT NULL,
  author_id   UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content     TEXT        NOT NULL,
  reply_to_id UUID        REFERENCES comments(id) ON DELETE SET NULL,
  deleted_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add reply_to_id if the table already existed without it
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES comments(id) ON DELETE SET NULL;

-- Enable RLS on comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they somehow already exist
DROP POLICY IF EXISTS "Comments are viewable by everyone"        ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments"  ON comments;
DROP POLICY IF EXISTS "Users can update their own comments"      ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments"      ON comments;

-- Correct RLS policies for comments
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE USING (auth.uid() = author_id);


-- ============================================================
-- 2. FIX SUPPORTS TABLE RLS (was blocking authenticated inserts)
-- ============================================================
CREATE TABLE IF NOT EXISTS supports (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id    UUID REFERENCES posts(id)    ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE supports ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing supports policies then recreate cleanly
DROP POLICY IF EXISTS "Supports are viewable by everyone"       ON supports;
DROP POLICY IF EXISTS "Authenticated users can support posts"   ON supports;
DROP POLICY IF EXISTS "Users can remove their support"          ON supports;
-- Catch any other names that may have been used
DROP POLICY IF EXISTS "Users can support posts"                 ON supports;
DROP POLICY IF EXISTS "Anyone can view supports"                ON supports;

CREATE POLICY "Supports are viewable by everyone"
  ON supports FOR SELECT USING (true);

-- Insert: the inserting user's auth.uid() must equal the user_id column
CREATE POLICY "Authenticated users can support posts"
  ON supports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their support"
  ON supports FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 3. FIX DISLIKES TABLE RLS (same pattern as supports)
-- ============================================================
CREATE TABLE IF NOT EXISTS dislikes (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id    UUID REFERENCES posts(id)    ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE dislikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dislikes are viewable by everyone"       ON dislikes;
DROP POLICY IF EXISTS "Authenticated users can dislike posts"   ON dislikes;
DROP POLICY IF EXISTS "Users can remove their dislike"          ON dislikes;

CREATE POLICY "Dislikes are viewable by everyone"
  ON dislikes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can dislike posts"
  ON dislikes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their dislike"
  ON dislikes FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 4. ENSURE POSTS HAS deleted_at AND video_url COLUMNS
-- ============================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url  TEXT;


-- ============================================================
-- 5. TRIGGER FUNCTIONS FOR COUNT UPDATES
-- ============================================================
CREATE OR REPLACE FUNCTION increment_supports_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET supports_count = supports_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_supports_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET supports_count = GREATEST(supports_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION increment_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION increment_dislikes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET dislikes_count = dislikes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_dislikes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET dislikes_count = GREATEST(dislikes_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;


-- ============================================================
-- 6. RE-CREATE TRIGGERS (drop first to avoid duplicates)
-- ============================================================
DROP TRIGGER IF EXISTS on_support_added    ON supports;
DROP TRIGGER IF EXISTS on_support_removed  ON supports;
DROP TRIGGER IF EXISTS on_dislike_added    ON dislikes;
DROP TRIGGER IF EXISTS on_dislike_removed  ON dislikes;
DROP TRIGGER IF EXISTS on_comment_added    ON comments;
DROP TRIGGER IF EXISTS on_comment_removed  ON comments;

CREATE TRIGGER on_support_added
  AFTER INSERT ON supports
  FOR EACH ROW EXECUTE FUNCTION increment_supports_count();

CREATE TRIGGER on_support_removed
  AFTER DELETE ON supports
  FOR EACH ROW EXECUTE FUNCTION decrement_supports_count();

CREATE TRIGGER on_dislike_added
  AFTER INSERT ON dislikes
  FOR EACH ROW EXECUTE FUNCTION increment_dislikes_count();

CREATE TRIGGER on_dislike_removed
  AFTER DELETE ON dislikes
  FOR EACH ROW EXECUTE FUNCTION decrement_dislikes_count();

CREATE TRIGGER on_comment_added
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION increment_comments_count();

CREATE TRIGGER on_comment_removed
  AFTER DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION decrement_comments_count();


-- ============================================================
-- 7. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_comments_post    ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author  ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_reply   ON comments(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_supports_post    ON supports(post_id);
CREATE INDEX IF NOT EXISTS idx_supports_user    ON supports(user_id);
CREATE INDEX IF NOT EXISTS idx_supports_pair    ON supports(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_dislikes_post    ON dislikes(post_id);
CREATE INDEX IF NOT EXISTS idx_dislikes_user    ON dislikes(user_id);


-- ============================================================
-- 8. STORAGE: Fix bucket + RLS for post-images and avatars
--    (allows authenticated users to upload; fixes 0-byte / 403 errors)
-- ============================================================

-- post-images bucket: add HEIC/HEIF to allowed types and set 50 MB limit
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images', 'post-images', true, 52428800,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif',
        'video/mp4','video/quicktime','video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = 52428800,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif',
                              'video/mp4','video/quicktime','video/webm'];

-- avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true, 5242880,
  ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = 5242880,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp','image/heic','image/heif'];

-- Drop old conflicting storage policies
DROP POLICY IF EXISTS "Anyone can view post images"        ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload post images"  ON storage.objects;
DROP POLICY IF EXISTS "Users can update their uploads"     ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their uploads"     ON storage.objects;
DROP POLICY IF EXISTS "Public read post-images"            ON storage.objects;
DROP POLICY IF EXISTS "Auth upload post-images"            ON storage.objects;
DROP POLICY IF EXISTS "Auth update post-images"            ON storage.objects;
DROP POLICY IF EXISTS "Auth delete post-images"            ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars"                ON storage.objects;
DROP POLICY IF EXISTS "Auth upload avatars"                ON storage.objects;
DROP POLICY IF EXISTS "Auth update avatars"                ON storage.objects;
DROP POLICY IF EXISTS "Auth delete avatars"                ON storage.objects;

-- post-images policies
CREATE POLICY "Public read post-images"
  ON storage.objects FOR SELECT USING (bucket_id = 'post-images');

CREATE POLICY "Auth upload post-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-images' AND auth.role() = 'authenticated');

CREATE POLICY "Auth update post-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'post-images' AND auth.uid() = owner);

CREATE POLICY "Auth delete post-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-images' AND auth.uid() = owner);

-- avatars policies
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Auth upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Auth update avatars"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);

CREATE POLICY "Auth delete avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid() = owner);


-- ============================================================
-- Done! Run this once. All tables, RLS policies, triggers,
-- storage buckets, and indexes are now correct.
-- ============================================================
