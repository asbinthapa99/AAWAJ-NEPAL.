-- ============================================================
-- Migration v2: Performance Indexes + Triggers
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS)
-- ============================================================

-- 1. Fix follows unique constraint
ALTER TABLE follows
ADD CONSTRAINT IF NOT EXISTS unique_follow
UNIQUE (follower_id, following_id);

-- 2. Performance Indexes

-- Feed by author (for a following-based feed)
CREATE INDEX IF NOT EXISTS idx_posts_author_created
  ON posts(author_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Cursor pagination on the main feed
CREATE INDEX IF NOT EXISTS idx_posts_created_desc
  ON posts(created_at DESC)
  WHERE deleted_at IS NULL;

-- "For You" ranked feed
CREATE INDEX IF NOT EXISTS idx_posts_score_created
  ON posts(supports_count DESC, created_at DESC)
  WHERE deleted_at IS NULL;

-- Comments by post
CREATE INDEX IF NOT EXISTS idx_comments_post_created
  ON comments(post_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Follows lookup
CREATE INDEX IF NOT EXISTS idx_follows_follower
  ON follows(follower_id, following_id);

-- 3. Auto-update supports_count trigger

CREATE OR REPLACE FUNCTION update_supports_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET supports_count = supports_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET supports_count = GREATEST(supports_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_supports_count ON supports;
CREATE TRIGGER trigger_supports_count
AFTER INSERT OR DELETE ON supports
FOR EACH ROW EXECUTE FUNCTION update_supports_count();

-- 4. Auto-update comments_count trigger

CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comments_count ON comments;
CREATE TRIGGER trigger_comments_count
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comments_count();
