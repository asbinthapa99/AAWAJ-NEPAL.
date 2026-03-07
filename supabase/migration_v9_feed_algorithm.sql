-- ============================================================
-- Migration v9: Feed Algorithm & Engagement Tracking
--
-- Adds tables and indexes to support:
--   • Post views / impressions tracking
--   • Saves / bookmarks
--   • Reel watch-time tracking
--   • User mutes (hide from feed, distinct from blocks)
--   • Engagement snapshots for trending detection
--   • Friend/relationship scoring cache
--   • Spam / quality signals
--
-- Safe to run multiple times (IF NOT EXISTS everywhere).
-- Run in Supabase Dashboard → SQL Editor → paste + Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. POST VIEWS — tracks each time a user sees a post in feed
-- ============================================================
CREATE TABLE IF NOT EXISTS post_views (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id     UUID        REFERENCES posts(id)    ON DELETE CASCADE NOT NULL,
  user_id     UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  source      TEXT        NOT NULL DEFAULT 'feed'
                          CHECK (source IN ('feed','trending','explore','reels','profile','search','notification','direct')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Per-user per-post per-source is NOT unique — we count impressions.
-- Index for fast "has user seen this post?" checks
CREATE INDEX IF NOT EXISTS idx_post_views_user_post   ON post_views(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_post        ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_created      ON post_views(created_at DESC);

ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own views"    ON post_views;
DROP POLICY IF EXISTS "Users can record views"      ON post_views;

CREATE POLICY "Users can view own views"
  ON post_views FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can record views"
  ON post_views FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 2. SAVES / BOOKMARKS
-- ============================================================
CREATE TABLE IF NOT EXISTS saves (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id    UUID REFERENCES posts(id)    ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_saves_user ON saves(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saves_post ON saves(post_id);

ALTER TABLE saves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saves"   ON saves;
DROP POLICY IF EXISTS "Users can save posts"       ON saves;
DROP POLICY IF EXISTS "Users can unsave posts"     ON saves;

CREATE POLICY "Users can view own saves"
  ON saves FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
  ON saves FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
  ON saves FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 3. REEL WATCH EVENTS — granular watch-time tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS reel_watches (
  id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id         UUID        REFERENCES posts(id)    ON DELETE CASCADE NOT NULL,
  user_id         UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  watch_duration  INTEGER     NOT NULL DEFAULT 0,          -- milliseconds watched
  video_duration  INTEGER     NOT NULL DEFAULT 0,          -- total video length ms
  completed       BOOLEAN     NOT NULL DEFAULT FALSE,      -- watched ≥ 90%
  rewatched       BOOLEAN     NOT NULL DEFAULT FALSE,      -- looped / scrolled back
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reel_watches_post      ON reel_watches(post_id);
CREATE INDEX IF NOT EXISTS idx_reel_watches_user      ON reel_watches(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reel_watches_completed ON reel_watches(post_id) WHERE completed = TRUE;

ALTER TABLE reel_watches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own watches" ON reel_watches;
DROP POLICY IF EXISTS "Users can record watches"   ON reel_watches;

CREATE POLICY "Users can view own watches"
  ON reel_watches FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can record watches"
  ON reel_watches FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- 4. MUTES — hide a user's posts from your feed (softer than block)
-- ============================================================
CREATE TABLE IF NOT EXISTS mutes (
  muter_id   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  muted_id   UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (muter_id, muted_id),
  CHECK (muter_id != muted_id)
);

CREATE INDEX IF NOT EXISTS idx_mutes_muter ON mutes(muter_id);

ALTER TABLE mutes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own mutes"   ON mutes;
DROP POLICY IF EXISTS "Users can mute others"      ON mutes;
DROP POLICY IF EXISTS "Users can unmute"            ON mutes;

CREATE POLICY "Users can view own mutes"
  ON mutes FOR SELECT USING (auth.uid() = muter_id);

CREATE POLICY "Users can mute others"
  ON mutes FOR INSERT WITH CHECK (auth.uid() = muter_id);

CREATE POLICY "Users can unmute"
  ON mutes FOR DELETE USING (auth.uid() = muter_id);


-- ============================================================
-- 5. ENGAGEMENT SNAPSHOTS — hourly/daily aggregated engagement
--    Used by the trending algorithm to detect velocity spikes.
-- ============================================================
CREATE TABLE IF NOT EXISTS engagement_snapshots (
  id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id         UUID        REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  window_start    TIMESTAMPTZ NOT NULL,
  window_minutes  INTEGER     NOT NULL DEFAULT 60,
  supports_delta  INTEGER     NOT NULL DEFAULT 0,
  comments_delta  INTEGER     NOT NULL DEFAULT 0,
  views_delta     INTEGER     NOT NULL DEFAULT 0,
  shares_delta    INTEGER     NOT NULL DEFAULT 0,
  saves_delta     INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, window_start)
);

CREATE INDEX IF NOT EXISTS idx_eng_snap_window ON engagement_snapshots(window_start DESC);
CREATE INDEX IF NOT EXISTS idx_eng_snap_post   ON engagement_snapshots(post_id);

-- No RLS needed — this is written by backend/cron functions only.
-- For read access we allow authenticated users to see trending data.
ALTER TABLE engagement_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read engagement snapshots" ON engagement_snapshots;
CREATE POLICY "Anyone can read engagement snapshots"
  ON engagement_snapshots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can write engagement snapshots" ON engagement_snapshots;
CREATE POLICY "Service role can write engagement snapshots"
  ON engagement_snapshots FOR INSERT WITH CHECK (auth.role() = 'service_role');


-- ============================================================
-- 6. ADD saves_count AND views_count TO POSTS
-- ============================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS saves_count  INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS views_count  INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;

-- Trigger functions for saves count
CREATE OR REPLACE FUNCTION increment_saves_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_saves_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET saves_count = GREATEST(saves_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_save_added   ON saves;
DROP TRIGGER IF EXISTS on_save_removed ON saves;

CREATE TRIGGER on_save_added
  AFTER INSERT ON saves
  FOR EACH ROW EXECUTE FUNCTION increment_saves_count();

CREATE TRIGGER on_save_removed
  AFTER DELETE ON saves
  FOR EACH ROW EXECUTE FUNCTION decrement_saves_count();


-- ============================================================
-- 7. ADDITIONAL PERFORMANCE INDEXES
-- ============================================================

-- Composite index for "For You" feed: non-deleted, non-reel posts ordered by recency
CREATE INDEX IF NOT EXISTS idx_posts_feed_main
  ON posts(created_at DESC)
  WHERE deleted_at IS NULL AND video_url IS NULL;

-- Composite index for reels feed: only video posts
CREATE INDEX IF NOT EXISTS idx_posts_reels
  ON posts(created_at DESC)
  WHERE deleted_at IS NULL AND video_url IS NOT NULL;

-- Index for trending sort (supports_count + comments_count)
CREATE INDEX IF NOT EXISTS idx_posts_engagement
  ON posts(supports_count DESC, comments_count DESC, created_at DESC)
  WHERE deleted_at IS NULL;

-- Follows pair index for mutual-follow checks
CREATE INDEX IF NOT EXISTS idx_follows_pair
  ON follows(follower_id, following_id);

-- Notifications: faster "unread count" badge 
CREATE INDEX IF NOT EXISTS idx_notif_unread
  ON notifications(to_user_id, created_at DESC)
  WHERE read_at IS NULL;


-- ============================================================
-- 8. ADD notification type expansions
-- ============================================================
-- Allow new notification types for messaging, saves, etc.
-- (Dropping the old CHECK constraint and adding a broader one)
DO $$
BEGIN
  -- Remove old constraint if it exists
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  -- Add broader constraint
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('support','comment','follow','repost','message','save','mention','friend_request'));
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not update notifications type constraint: %', SQLERRM;
END $$;


-- ============================================================
-- 9. FRIEND REQUESTS TABLE (for bidirectional friend system)
-- ============================================================
CREATE TABLE IF NOT EXISTS friend_requests (
  id           UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user_id UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id   UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','accepted','rejected')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id),
  CHECK (from_user_id != to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_req_to     ON friend_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_req_from   ON friend_requests(from_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_req_status ON friend_requests(status) WHERE status = 'pending';

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own friend requests" ON friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests"     ON friend_requests;
DROP POLICY IF EXISTS "Users can respond to requests"      ON friend_requests;

CREATE POLICY "Users can view own friend requests"
  ON friend_requests FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can send friend requests"
  ON friend_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can respond to requests"
  ON friend_requests FOR UPDATE
  USING (auth.uid() = to_user_id);


-- ============================================================
-- Done! All feed algorithm support tables are ready.
-- ============================================================
