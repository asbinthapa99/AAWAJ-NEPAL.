-- ============================================================
-- Migration v7 SAFE (UUID-fix): No destructive operations
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 0. HELPER: current user id as UUID (from JWT sub)
-- Needed because auth.uid() may return BIGINT in some projects
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_user_uuid()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

-- 1. FIX PROFILES TABLE
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio_subtitle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;

-- 2. FIX POSTS TABLE
ALTER TABLE posts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 3. FIX COMMENTS TABLE
ALTER TABLE comments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 4. SUPPORTS TABLE
CREATE TABLE IF NOT EXISTS supports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE supports ENABLE ROW LEVEL SECURITY;

-- 5. DISLIKES TABLE
CREATE TABLE IF NOT EXISTS dislikes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE dislikes ENABLE ROW LEVEL SECURITY;

-- 6. FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'no_self_follow') THEN
    ALTER TABLE follows ADD CONSTRAINT no_self_follow CHECK (follower_id <> following_id);
  END IF;
END $$;

-- 7. CONVERSATIONS + MESSAGES
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS conversation_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES (UUID-safe using current_user_uuid())

-- SUPPORTS POLICIES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='supports' AND policyname='Supports are viewable by everyone') THEN
    CREATE POLICY "Supports are viewable by everyone" ON public.supports FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='supports' AND policyname='Authenticated users can support posts') THEN
    CREATE POLICY "Authenticated users can support posts" ON public.supports FOR INSERT WITH CHECK (public.current_user_uuid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='supports' AND policyname='Users can remove their support') THEN
    CREATE POLICY "Users can remove their support" ON public.supports FOR DELETE USING (public.current_user_uuid() = user_id);
  END IF;
END $$;

-- DISLIKES POLICIES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dislikes' AND policyname='Dislikes are viewable by everyone') THEN
    CREATE POLICY "Dislikes are viewable by everyone" ON public.dislikes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dislikes' AND policyname='Authenticated users can dislike posts') THEN
    CREATE POLICY "Authenticated users can dislike posts" ON public.dislikes FOR INSERT WITH CHECK (public.current_user_uuid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='dislikes' AND policyname='Users can remove their dislike') THEN
    CREATE POLICY "Users can remove their dislike" ON public.dislikes FOR DELETE USING (public.current_user_uuid() = user_id);
  END IF;
END $$;

-- FOLLOWS POLICIES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='follows' AND policyname='Follows are viewable by everyone') THEN
    CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='follows' AND policyname='Users can follow others') THEN
    CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (public.current_user_uuid() = follower_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='follows' AND policyname='Users can unfollow') THEN
    CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (public.current_user_uuid() = follower_id);
  END IF;
END $$;

-- CONVERSATIONS POLICIES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations' AND policyname='Users can view their conversations') THEN
    CREATE POLICY "Users can view their conversations" ON public.conversations FOR SELECT USING (
      id IN (SELECT cm.conversation_id FROM public.conversation_members cm WHERE cm.user_id = public.current_user_uuid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations' AND policyname='Authenticated users can create conversations') THEN
    CREATE POLICY "Authenticated users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- CONVERSATION_MEMBERS POLICIES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversation_members' AND policyname='Users can view members of their conversations') THEN
    CREATE POLICY "Users can view members of their conversations" ON public.conversation_members FOR SELECT USING (
      conversation_id IN (SELECT cm2.conversation_id FROM public.conversation_members cm2 WHERE cm2.user_id = public.current_user_uuid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversation_members' AND policyname='Authenticated users can add conversation members') THEN
    CREATE POLICY "Authenticated users can add conversation members" ON public.conversation_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- MESSAGES POLICIES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Users can view messages in their conversations') THEN
    CREATE POLICY "Users can view messages in their conversations" ON public.messages FOR SELECT USING (
      conversation_id IN (SELECT cm.conversation_id FROM public.conversation_members cm WHERE cm.user_id = public.current_user_uuid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Users can send messages to their conversations') THEN
    CREATE POLICY "Users can send messages to their conversations" ON public.messages FOR INSERT WITH CHECK (
      public.current_user_uuid() = sender_id
      AND conversation_id IN (SELECT cm.conversation_id FROM public.conversation_members cm WHERE cm.user_id = public.current_user_uuid())
    );
  END IF;
END $$;

-- 9. TRIGGER FUNCTIONS
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

-- 10. TRIGGERS (safe: only create if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_support_added') THEN
    CREATE TRIGGER on_support_added AFTER INSERT ON supports FOR EACH ROW EXECUTE FUNCTION increment_supports_count();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_support_removed') THEN
    CREATE TRIGGER on_support_removed AFTER DELETE ON supports FOR EACH ROW EXECUTE FUNCTION decrement_supports_count();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_dislike_added') THEN
    CREATE TRIGGER on_dislike_added AFTER INSERT ON dislikes FOR EACH ROW EXECUTE FUNCTION increment_dislikes_count();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_dislike_removed') THEN
    CREATE TRIGGER on_dislike_removed AFTER DELETE ON dislikes FOR EACH ROW EXECUTE FUNCTION decrement_dislikes_count();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_comment_added') THEN
    CREATE TRIGGER on_comment_added AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION increment_comments_count();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_comment_removed') THEN
    CREATE TRIGGER on_comment_removed AFTER DELETE ON comments FOR EACH ROW EXECUTE FUNCTION decrement_comments_count();
  END IF;
END $$;

-- 11. INDEXES
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

-- 12. ENABLE REALTIME FOR MESSAGES
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
-- DONE! No destructive operations. UUID-safe policies.
-- Safe to run multiple times.
-- ============================================================
