-- ============================================================
-- Migration v7: Comprehensive Fix-All Migration
-- Run this ONCE in your Supabase SQL Editor
-- This ensures all required tables, columns, and triggers exist
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. FIX PROFILES TABLE - ensure all columns exist
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio_subtitle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;

-- ============================================================
-- 2. FIX POSTS TABLE - ensure deleted_at + video_url exist
-- ============================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url TEXT;

-- ============================================================
-- 3. FIX COMMENTS TABLE - ensure deleted_at exists
-- ============================================================
ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- ============================================================
-- 4. ENSURE SUPPORTS TABLE EXISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS supports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE supports ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist before creating new ones
DROP POLICY IF EXISTS "Supports are viewable by everyone" ON supports;
DROP POLICY IF EXISTS "Authenticated users can support posts" ON supports;
DROP POLICY IF EXISTS "Users can remove their support" ON supports;

CREATE POLICY "Supports are viewable by everyone"
  ON supports FOR SELECT USING (true);

CREATE POLICY "Authenticated users can support posts"
  ON supports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their support"
  ON supports FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 5. ENSURE DISLIKES TABLE EXISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS dislikes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE dislikes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dislikes are viewable by everyone" ON dislikes;
DROP POLICY IF EXISTS "Authenticated users can dislike posts" ON dislikes;
DROP POLICY IF EXISTS "Users can remove their dislike" ON dislikes;

CREATE POLICY "Dislikes are viewable by everyone"
  ON dislikes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can dislike posts"
  ON dislikes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their dislike"
  ON dislikes FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 6. ENSURE FOLLOWS TABLE EXISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows are viewable by everyone" ON follows;
DROP POLICY IF EXISTS "Users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;

CREATE POLICY "Follows are viewable by everyone"
  ON follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Self-follow prevention (safe to call multiple times)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'no_self_follow'
  ) THEN
    ALTER TABLE follows ADD CONSTRAINT no_self_follow CHECK (follower_id <> following_id);
  END IF;
END $$;

-- ============================================================
-- 7. ENSURE CONVERSATIONS + MESSAGES TABLES EXIST
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT USING (
    id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON conversations;
CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS conversation_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view members of their conversations" ON conversation_members;
CREATE POLICY "Users can view members of their conversations"
  ON conversation_members FOR SELECT USING (
    conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can add conversation members" ON conversation_members;
CREATE POLICY "Authenticated users can add conversation members"
  ON conversation_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT USING (
    conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND conversation_id IN (SELECT conversation_id FROM conversation_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- 8. TRIGGER FUNCTIONS FOR COUNT UPDATES
-- ============================================================
CREATE OR REPLACE FUNCTION increment_supports_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET supports_count = supports_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_supports_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET supports_count = GREATEST(supports_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_dislikes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET dislikes_count = dislikes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_dislikes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET dislikes_count = GREATEST(dislikes_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 9. CREATE TRIGGERS (drop first to avoid duplicates)
-- ============================================================
DROP TRIGGER IF EXISTS on_support_added ON supports;
DROP TRIGGER IF EXISTS on_support_removed ON supports;
DROP TRIGGER IF EXISTS on_dislike_added ON dislikes;
DROP TRIGGER IF EXISTS on_dislike_removed ON dislikes;
DROP TRIGGER IF EXISTS on_comment_added ON comments;
DROP TRIGGER IF EXISTS on_comment_removed ON comments;

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
-- 10. INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_active ON posts(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_active ON comments(post_id, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_supports_post ON supports(post_id);
CREATE INDEX IF NOT EXISTS idx_supports_user ON supports(user_id);
CREATE INDEX IF NOT EXISTS idx_supports_pair ON supports(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_dislikes_post ON dislikes(post_id);
CREATE INDEX IF NOT EXISTS idx_dislikes_user ON dislikes(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_pair ON follows(follower_id, following_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

-- ============================================================
-- 11. ENABLE REALTIME FOR MESSAGES
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- ============================================================
-- Done! All tables, columns, policies, triggers, and indexes
-- are now in place.
-- ============================================================
