-- Migration v3: Add video_url column to posts table for Reels feature
-- Run this in the Supabase SQL editor

ALTER TABLE posts ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Index to speed up reels query (only posts with videos)
CREATE INDEX IF NOT EXISTS idx_posts_video_url ON posts (video_url) WHERE video_url IS NOT NULL;
