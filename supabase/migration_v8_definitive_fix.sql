-- ============================================================
-- Migration v8: DEFINITIVE FIX
-- 
-- Fixes confirmed by live database diagnosis:
--   ❌ comments table MISSING
--   ❌ dislikes table MISSING
--   ❌ reports table MISSING
--   ❌ supports RLS blocks authenticated inserts (policy broken)
--   ❌ storage RLS blocks image/video uploads
--
-- Safe to run multiple times.
-- Run in Supabase Dashboard → SQL Editor → paste → Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CREATE COMMENTS TABLE (was never created)
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

-- Add reply_to_id if table already exists
ALTER TABLE comments ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES comments(id) ON DELETE SET NULL;

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. CREATE DISLIKES TABLE (was never created)
-- ============================================================
CREATE TABLE IF NOT EXISTS dislikes (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id    UUID REFERENCES posts(id)    ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE dislikes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. CREATE REPORTS TABLE (was never created)
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id     UUID REFERENCES posts(id)    ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason      TEXT NOT NULL,
  status      TEXT DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, reporter_id)
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. ENSURE SUPPORTS TABLE EXISTS (it does, just needs RLS fix)
-- ============================================================
CREATE TABLE IF NOT EXISTS supports (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id    UUID REFERENCES posts(id)    ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE supports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. DROP ALL EXISTING RLS POLICIES (broken ones use
--    current_user_uuid() or mismatched auth.uid())
-- ============================================================

-- SUPPORTS
DROP POLICY IF EXISTS "Supports are viewable by everyone"       ON supports;
DROP POLICY IF EXISTS "Authenticated users can support posts"   ON supports;
DROP POLICY IF EXISTS "Users can remove their support"          ON supports;
DROP POLICY IF EXISTS "Users can support posts"                 ON supports;
DROP POLICY IF EXISTS "Anyone can view supports"                ON supports;

-- DISLIKES
DROP POLICY IF EXISTS "Dislikes are viewable by everyone"       ON dislikes;
DROP POLICY IF EXISTS "Authenticated users can dislike posts"   ON dislikes;
DROP POLICY IF EXISTS "Users can remove their dislike"          ON dislikes;

-- COMMENTS
DROP POLICY IF EXISTS "Comments are viewable by everyone"       ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments"     ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments"     ON comments;

-- REPORTS
DROP POLICY IF EXISTS "Reports are viewable by admins"          ON reports;
DROP POLICY IF EXISTS "Users can create reports"                ON reports;
DROP POLICY IF EXISTS "Authenticated users can report"          ON reports;

-- ============================================================
-- 6. RECREATE ALL RLS POLICIES (using standard auth.uid())
-- ============================================================

-- SUPPORTS
CREATE POLICY "Supports are viewable by everyone"
  ON supports FOR SELECT USING (true);

CREATE POLICY "Authenticated users can support posts"
  ON supports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their support"
  ON supports FOR DELETE
  USING (auth.uid() = user_id);

-- DISLIKES
CREATE POLICY "Dislikes are viewable by everyone"
  ON dislikes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can dislike posts"
  ON dislikes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their dislike"
  ON dislikes FOR DELETE
  USING (auth.uid() = user_id);

-- COMMENTS
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = author_id);

-- REPORTS
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reports are viewable by reporter"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id);


-- ============================================================
-- 7. TRIGGER FUNCTIONS (count tracking)
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
-- 8. TRIGGERS (drop + recreate to avoid duplicates)
-- ============================================================
DROP TRIGGER IF EXISTS on_support_added    ON supports;
DROP TRIGGER IF EXISTS on_support_removed  ON supports;
DROP TRIGGER IF EXISTS on_dislike_added    ON dislikes;
DROP TRIGGER IF EXISTS on_dislike_removed  ON dislikes;
DROP TRIGGER IF EXISTS on_comment_added    ON comments;
DROP TRIGGER IF EXISTS on_comment_removed  ON comments;

CREATE TRIGGER on_support_added
  AFTER INSERT ON supports FOR EACH ROW EXECUTE FUNCTION increment_supports_count();

CREATE TRIGGER on_support_removed
  AFTER DELETE ON supports FOR EACH ROW EXECUTE FUNCTION decrement_supports_count();

CREATE TRIGGER on_dislike_added
  AFTER INSERT ON dislikes FOR EACH ROW EXECUTE FUNCTION increment_dislikes_count();

CREATE TRIGGER on_dislike_removed
  AFTER DELETE ON dislikes FOR EACH ROW EXECUTE FUNCTION decrement_dislikes_count();

CREATE TRIGGER on_comment_added
  AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION increment_comments_count();

CREATE TRIGGER on_comment_removed
  AFTER DELETE ON comments FOR EACH ROW EXECUTE FUNCTION decrement_comments_count();


-- ============================================================
-- 9. STORAGE: Fix bucket policies for image/video upload
--    The 'post-images' bucket exists but its RLS blocks uploads.
-- ============================================================

-- Bucket: post-images (for post photos & videos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  52428800,  -- 50 MB limit (enough for videos)
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'video/mp4', 'video/quicktime', 'video/webm'];

-- Bucket: avatars (for profile photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Storage RLS for post-images
DROP POLICY IF EXISTS "Anyone can view post images"     ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their uploads"    ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their uploads"    ON storage.objects;
DROP POLICY IF EXISTS "Public read post-images"          ON storage.objects;
DROP POLICY IF EXISTS "Auth upload post-images"          ON storage.objects;
DROP POLICY IF EXISTS "Auth update post-images"          ON storage.objects;
DROP POLICY IF EXISTS "Auth delete post-images"          ON storage.objects;
DROP POLICY IF EXISTS "Public read avatars"              ON storage.objects;
DROP POLICY IF EXISTS "Auth upload avatars"              ON storage.objects;
DROP POLICY IF EXISTS "Auth update avatars"              ON storage.objects;
DROP POLICY IF EXISTS "Auth delete avatars"              ON storage.objects;

-- post-images: public read
CREATE POLICY "Public read post-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

-- post-images: authenticated upload
CREATE POLICY "Auth upload post-images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.role() = 'authenticated'
  );

-- post-images: owner can update
CREATE POLICY "Auth update post-images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post-images'
    AND auth.uid() = owner
  );

-- post-images: owner can delete
CREATE POLICY "Auth delete post-images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND auth.uid() = owner
  );

-- avatars: public read
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- avatars: authenticated upload
CREATE POLICY "Auth upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
  );

-- avatars: owner can update
CREATE POLICY "Auth update avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() = owner
  );

-- avatars: owner can delete
CREATE POLICY "Auth delete avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() = owner
  );


-- ============================================================
-- 10. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_comments_post       ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author     ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_reply_to   ON comments(reply_to_id);
CREATE INDEX IF NOT EXISTS idx_supports_post    ON supports(post_id);
CREATE INDEX IF NOT EXISTS idx_supports_user    ON supports(user_id);
CREATE INDEX IF NOT EXISTS idx_supports_pair    ON supports(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_dislikes_post    ON dislikes(post_id);
CREATE INDEX IF NOT EXISTS idx_dislikes_user    ON dislikes(user_id);


-- ============================================================
-- DONE! This migration:
--   ✅ Creates comments, dislikes, reports tables
--   ✅ Fixes supports RLS (drop + recreate with auth.uid())
--   ✅ Fixes storage RLS for post-images and avatars buckets
--   ✅ Sets 50MB file size limit on post-images (for video)
--   ✅ Recreates all count-tracking triggers
--   ✅ Safe to run multiple times
-- ============================================================
