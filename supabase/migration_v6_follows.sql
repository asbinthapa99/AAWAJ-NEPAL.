-- Migration v6: Follows System
-- Run in Supabase SQL editor

-- ============================================================
-- FOLLOWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Everyone can see who follows whom
CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT USING (true);

-- Only the authenticated user can follow someone
CREATE POLICY "Users can follow others"
  ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Only the follower can unfollow
CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Prevent self-follow via check constraint
ALTER TABLE follows ADD CONSTRAINT no_self_follow CHECK (follower_id <> following_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_pair ON follows(follower_id, following_id);
