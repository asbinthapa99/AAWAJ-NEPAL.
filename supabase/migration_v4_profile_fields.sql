-- Migration v4: Add extra profile fields for Instagram-style profile page
-- Run this in the Supabase SQL editor

-- Cover image (banner at top of profile)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Short subtitle line shown in accent colour under name (e.g. "Visual Storyteller & Architect")
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio_subtitle TEXT;

-- External website / social link (e.g. "behance.net/arivera")
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
