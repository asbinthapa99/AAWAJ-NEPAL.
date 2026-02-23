-- ============================================================
-- Awaaz Nepal - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  district TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- POSTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('infrastructure','education','health','environment','governance','safety','employment','social','culture','technology','other')),
  district TEXT,
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low','medium','high','critical')),
  voice_url TEXT,
  image_url TEXT,
  supports_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone"
  ON posts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE USING (auth.uid() = author_id);

-- ============================================================
-- COMMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE USING (auth.uid() = author_id);

-- ============================================================
-- SUPPORTS TABLE (upvotes)
-- ============================================================
CREATE TABLE IF NOT EXISTS supports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE supports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supports are viewable by everyone"
  ON supports FOR SELECT USING (true);

CREATE POLICY "Authenticated users can support posts"
  ON supports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their support"
  ON supports FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- REPORTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, reporter_id)
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- ============================================================
-- FUNCTIONS: Auto-increment/decrement counts
-- ============================================================

-- Function to increment supports_count
CREATE OR REPLACE FUNCTION increment_supports_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET supports_count = supports_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement supports_count
CREATE OR REPLACE FUNCTION decrement_supports_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET supports_count = GREATEST(supports_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment comments_count
CREATE OR REPLACE FUNCTION increment_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement comments_count
CREATE OR REPLACE FUNCTION decrement_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER on_support_added
  AFTER INSERT ON supports
  FOR EACH ROW EXECUTE FUNCTION increment_supports_count();

CREATE TRIGGER on_support_removed
  AFTER DELETE ON supports
  FOR EACH ROW EXECUTE FUNCTION decrement_supports_count();

CREATE TRIGGER on_comment_added
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION increment_comments_count();

CREATE TRIGGER on_comment_removed
  AFTER DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION decrement_comments_count();

-- ============================================================
-- FUNCTION: Auto-create profile on signup
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
  
  INSERT INTO profiles (id, username, full_name, avatar_url, district)
  VALUES (
    NEW.id,
    v_username,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      split_part(NEW.email, '@', 1)
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

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_supports_post ON supports(post_id);
CREATE INDEX IF NOT EXISTS idx_supports_user ON supports(user_id);

-- ============================================================
-- STORAGE BUCKETS (run in Supabase Dashboard > Storage)
-- ============================================================
-- Create bucket named: 'post-images'
-- Set it as a public bucket for easy access
