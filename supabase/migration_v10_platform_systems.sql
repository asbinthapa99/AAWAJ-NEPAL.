-- ============================================================
-- Migration v10: Platform Systems
--
-- Adds infrastructure for:
--   1.  Content moderation (enhanced reports, moderation actions, content flags, user warnings)
--   2.  Analytics (events, daily metrics, user sessions)
--   3.  Search (hashtags, full-text search helpers)
--   4.  Discovery (user interests, trending cache, suggested users)
--   5.  Messaging optimization (read receipts, typing, reactions, last_message caching)
--   6.  Media metadata (thumbnail, CDN, processing status)
--   7.  Notification preferences
--
-- Safe to run multiple times (IF NOT EXISTS / DO $$ blocks).
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- trigram similarity for fuzzy search


-- ============================================================
-- 1. CONTENT MODERATION
-- ============================================================

-- 1a. Enhanced reports table (expand existing reports)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewed_by   UUID REFERENCES profiles(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS reviewed_at   TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolution    TEXT CHECK (resolution IN ('dismissed','warned','content_removed','user_suspended','user_banned'));
ALTER TABLE reports ADD COLUMN IF NOT EXISTS moderator_note TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS category      TEXT DEFAULT 'other'
  CHECK (category IN ('spam','harassment','hate_speech','violence','sexual','misinformation','impersonation','copyright','other'));

-- Make status constraint broader
DO $$
BEGIN
  ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check;
  ALTER TABLE reports ADD CONSTRAINT reports_status_check
    CHECK (status IN ('pending','under_review','resolved','dismissed','escalated'));
EXCEPTION WHEN others THEN
  RAISE NOTICE 'reports_status_check: %', SQLERRM;
END $$;

-- Admins can view all reports
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
CREATE POLICY "Admins can view all reports"
  ON reports FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update reports (resolve / dismiss)
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS idx_reports_status    ON reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_category  ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_target    ON reports(target_type, target_id);


-- 1b. Moderation actions log (audit trail)
CREATE TABLE IF NOT EXISTS moderation_actions (
  id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  moderator_id    UUID        REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  target_type     TEXT        NOT NULL CHECK (target_type IN ('post','comment','user','report')),
  target_id       UUID        NOT NULL,
  action          TEXT        NOT NULL CHECK (action IN (
    'remove_content','restore_content',
    'warn_user','suspend_user','unsuspend_user','ban_user','unban_user',
    'dismiss_report','escalate_report',
    'flag_spam','unflag_spam'
  )),
  reason          TEXT,
  metadata        JSONB       DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view moderation actions"
  ON moderation_actions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can create moderation actions"
  ON moderation_actions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_mod_actions_target   ON moderation_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_mod_actions_moderator ON moderation_actions(moderator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mod_actions_created   ON moderation_actions(created_at DESC);


-- 1c. Content flags (automated + manual flags on individual posts/comments)
CREATE TABLE IF NOT EXISTS content_flags (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  target_type TEXT        NOT NULL CHECK (target_type IN ('post','comment')),
  target_id   UUID        NOT NULL,
  flag_type   TEXT        NOT NULL CHECK (flag_type IN ('spam','duplicate','bot','inappropriate','low_quality','auto_flagged')),
  severity    TEXT        NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  source      TEXT        NOT NULL DEFAULT 'system' CHECK (source IN ('system','user','admin')),
  flagged_by  UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  resolved    BOOLEAN     DEFAULT FALSE,
  resolved_by UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  metadata    JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage content flags"
  ON content_flags FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can create content flags"
  ON content_flags FOR INSERT
  WITH CHECK (auth.uid() = flagged_by);

CREATE INDEX IF NOT EXISTS idx_flags_unresolved ON content_flags(created_at DESC) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_flags_target     ON content_flags(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_flags_type       ON content_flags(flag_type);


-- 1d. User warnings
CREATE TABLE IF NOT EXISTS user_warnings (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  issued_by   UUID        REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  reason      TEXT        NOT NULL,
  severity    TEXT        NOT NULL DEFAULT 'warning' CHECK (severity IN ('notice','warning','strike','final_warning')),
  related_id  UUID,       -- optional reference to a post/comment
  acknowledged_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own warnings"
  ON user_warnings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage warnings"
  ON user_warnings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_warnings_user ON user_warnings(user_id, created_at DESC);


-- 1e. User suspensions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS warning_count   INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score     INTEGER DEFAULT 100;  -- 0-100, decays on bad behavior


-- ============================================================
-- 2. ANALYTICS
-- ============================================================

-- 2a. Analytics events (lightweight event tracking)
CREATE TABLE IF NOT EXISTS analytics_events (
  id          UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  event_type  TEXT        NOT NULL,
  event_data  JSONB       DEFAULT '{}',
  screen      TEXT,
  session_id  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Partition-friendly index (recent events by type)
CREATE INDEX IF NOT EXISTS idx_analytics_events_type    ON analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user    ON analytics_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own analytics"
  ON analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can read all
CREATE POLICY "Admins can read all analytics"
  ON analytics_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));


-- 2b. Daily metrics (pre-aggregated for dashboards)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id              UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  metric_date     DATE    NOT NULL,
  metric_name     TEXT    NOT NULL,
  metric_value    BIGINT  NOT NULL DEFAULT 0,
  dimensions      JSONB   DEFAULT '{}',   -- e.g. { "category": "health", "district": "Kathmandu" }
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(metric_date, metric_name, dimensions)
);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage daily metrics"
  ON daily_metrics FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_daily_metrics_name ON daily_metrics(metric_name, metric_date DESC);


-- 2c. User sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id              UUID        DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  duration_sec    INTEGER,
  platform        TEXT        CHECK (platform IN ('ios','android','web')),
  app_version     TEXT,
  device_info     JSONB       DEFAULT '{}'
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions"
  ON user_sessions FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id, started_at DESC);


-- ============================================================
-- 3. SEARCH INFRASTRUCTURE
-- ============================================================

-- 3a. Hashtags table
CREATE TABLE IF NOT EXISTS hashtags (
  id          UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  tag         TEXT    NOT NULL UNIQUE,
  post_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hashtags_tag   ON hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_count ON hashtags(post_count DESC);

ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hashtags are public" ON hashtags FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert hashtags" ON hashtags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update hashtags" ON hashtags FOR UPDATE USING (auth.uid() IS NOT NULL);


-- 3b. Post-hashtag junction
CREATE TABLE IF NOT EXISTS post_hashtags (
  post_id     UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  hashtag_id  UUID REFERENCES hashtags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (post_id, hashtag_id)
);

CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag ON post_hashtags(hashtag_id);

ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Post hashtags are public" ON post_hashtags FOR SELECT USING (true);
CREATE POLICY "Authors can set hashtags" ON post_hashtags FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- 3c. Full-text search: add tsvector column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Populate and keep in sync
CREATE OR REPLACE FUNCTION posts_search_vector_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.district, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_search_update ON posts;
CREATE TRIGGER posts_search_update
  BEFORE INSERT OR UPDATE OF title, content, category, district ON posts
  FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();

-- GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN(search_vector);

-- Trigram indexes on usernames/full_name for fuzzy people search
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON profiles USING GIN(username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_fullname_trgm ON profiles USING GIN(full_name gin_trgm_ops);


-- 3d. Backfill existing posts search vectors
UPDATE posts SET search_vector =
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(content, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(category, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(district, '')), 'C')
WHERE search_vector IS NULL;


-- ============================================================
-- 4. DISCOVERY
-- ============================================================

-- 4a. User interests (for personalized recommendations)
CREATE TABLE IF NOT EXISTS user_interests (
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category    TEXT NOT NULL,
  score       REAL DEFAULT 1.0,  -- higher = more interested
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, category)
);

ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own interests" ON user_interests FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_interests_user ON user_interests(user_id);


-- 4b. Trending cache (pre-computed trending items)
CREATE TABLE IF NOT EXISTS trending_cache (
  id          UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  item_type   TEXT    NOT NULL CHECK (item_type IN ('post','hashtag','user','topic')),
  item_id     UUID,
  item_text   TEXT,            -- for hashtags / topics
  score       REAL    NOT NULL DEFAULT 0,
  metadata    JSONB   DEFAULT '{}',
  window_start TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trending_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Trending is public" ON trending_cache FOR SELECT USING (true);
CREATE POLICY "Service can write trending"
  ON trending_cache FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service can update trending"
  ON trending_cache FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service can delete trending"
  ON trending_cache FOR DELETE USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_trending_type  ON trending_cache(item_type, score DESC);
CREATE INDEX IF NOT EXISTS idx_trending_expiry ON trending_cache(expires_at);


-- 4c. Suggested follows cache
CREATE TABLE IF NOT EXISTS suggested_follows (
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  suggested_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reason          TEXT NOT NULL DEFAULT 'popular',  -- 'mutual_friends','similar_interests','popular','same_district'
  score           REAL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, suggested_id)
);

ALTER TABLE suggested_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own suggestions" ON suggested_follows FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_suggested_follows_user ON suggested_follows(user_id, score DESC);


-- ============================================================
-- 5. MESSAGING OPTIMIZATION
-- ============================================================

-- 5a. Add last_message caching to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_id      UUID REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at      TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_text    TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_sender  UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 5b. Add unread_count to conversation_members
ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS unread_count  INTEGER DEFAULT 0;
ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS last_read_at  TIMESTAMPTZ;
ALTER TABLE conversation_members ADD COLUMN IF NOT EXISTS is_muted      BOOLEAN DEFAULT FALSE;

-- 5c. Trigger to update conversation metadata on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Update conversation last_message fields
  UPDATE conversations SET
    last_message_id     = NEW.id,
    last_message_at     = NEW.created_at,
    last_message_text   = LEFT(NEW.content, 100),
    last_message_sender = NEW.sender_id
  WHERE id = NEW.conversation_id;

  -- Increment unread_count for all members except sender
  UPDATE conversation_members SET
    unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_insert ON messages;
CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();


-- 5d. Message read receipts (per-message)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_by JSONB DEFAULT '[]';  -- array of { user_id, read_at }

-- 5e. Typing indicators table (ephemeral, cleaned by cron)
CREATE TABLE IF NOT EXISTS typing_indicators (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can see typing"
  ON typing_indicators FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversation_members
    WHERE conversation_id = typing_indicators.conversation_id
      AND user_id = auth.uid()
  ));

CREATE POLICY "Users can set own typing"
  ON typing_indicators FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can clear own typing"
  ON typing_indicators FOR DELETE USING (auth.uid() = user_id);


-- 5f. Message reactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id      UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji           TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view reactions"
  ON message_reactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM messages m
    JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
    WHERE m.id = message_reactions.message_id AND cm.user_id = auth.uid()
  ));

CREATE POLICY "Users can react" ON message_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unreact" ON message_reactions FOR DELETE USING (auth.uid() = user_id);


-- 5g. Conversation indexes
CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_conv_members_unread    ON conversation_members(user_id, unread_count DESC) WHERE unread_count > 0;
CREATE INDEX IF NOT EXISTS idx_messages_conv_created   ON messages(conversation_id, created_at DESC);

-- Enable REPLICA IDENTITY FULL for realtime on messages
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE typing_indicators REPLICA IDENTITY FULL;


-- ============================================================
-- 6. MEDIA METADATA
-- ============================================================
CREATE TABLE IF NOT EXISTS media_metadata (
  id              UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id        UUID    REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  entity_type     TEXT    NOT NULL CHECK (entity_type IN ('post_image','post_video','avatar','cover','reel')),
  entity_id       UUID,
  storage_path    TEXT    NOT NULL,
  public_url      TEXT,
  thumbnail_url   TEXT,
  mime_type       TEXT,
  file_size       BIGINT,
  width           INTEGER,
  height          INTEGER,
  duration_ms     INTEGER,          -- for video/audio
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending','processing','ready','failed')),
  cdn_url         TEXT,             -- CDN-served URL
  blurhash        TEXT,             -- placeholder blur hash
  metadata        JSONB   DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE media_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media metadata is public" ON media_metadata FOR SELECT USING (true);
CREATE POLICY "Users can insert own media" ON media_metadata FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own media" ON media_metadata FOR UPDATE USING (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_media_entity ON media_metadata(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_media_owner  ON media_metadata(owner_id, created_at DESC);


-- ============================================================
-- 7. NOTIFICATION PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id             UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  push_enabled        BOOLEAN DEFAULT TRUE,
  email_enabled       BOOLEAN DEFAULT FALSE,
  quiet_hours_start   TIME,            -- e.g., 22:00
  quiet_hours_end     TIME,            -- e.g., 07:00

  -- Per-type toggles
  notify_supports     BOOLEAN DEFAULT TRUE,
  notify_comments     BOOLEAN DEFAULT TRUE,
  notify_follows      BOOLEAN DEFAULT TRUE,
  notify_mentions     BOOLEAN DEFAULT TRUE,
  notify_messages     BOOLEAN DEFAULT TRUE,
  notify_reposts      BOOLEAN DEFAULT TRUE,
  notify_friend_reqs  BOOLEAN DEFAULT TRUE,

  -- Anti-spam
  group_similar       BOOLEAN DEFAULT TRUE,    -- group "X and 5 others loved your post"
  min_interval_sec    INTEGER DEFAULT 5,       -- min seconds between push notifications

  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON notification_preferences FOR ALL USING (auth.uid() = user_id);


-- 7b. Push tokens
CREATE TABLE IF NOT EXISTS push_tokens (
  id          UUID    DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID    REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token       TEXT    NOT NULL,
  platform    TEXT    NOT NULL CHECK (platform IN ('ios','android','web')),
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tokens" ON push_tokens FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id) WHERE active = TRUE;


-- 7c. Notification delivery tracking
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS delivered_at  TIMESTAMPTZ;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS push_sent     BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS grouped       BOOLEAN DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS group_key     TEXT;     -- e.g. "support:post:uuid" for grouping

CREATE INDEX IF NOT EXISTS idx_notif_group_key ON notifications(group_key, created_at DESC);


-- ============================================================
-- 8. SPAM / BOT DETECTION SIGNALS ON PROFILES
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified    BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS spam_score     INTEGER DEFAULT 0;   -- 0=clean, 100=definite spam
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS post_count     INTEGER DEFAULT 0;

-- Trigger to update post_count
CREATE OR REPLACE FUNCTION update_profile_post_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET post_count = post_count + 1 WHERE id = NEW.author_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET post_count = GREATEST(post_count - 1, 0) WHERE id = OLD.author_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_post_count_change ON posts;
CREATE TRIGGER on_post_count_change
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_profile_post_count();


-- ============================================================
-- 9. EXPAND NOTIFICATION TYPES FOR ALL SYSTEMS
-- ============================================================
DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'support','comment','follow','repost',
      'message','save','mention','friend_request',
      'warning','suspension','report_resolved',
      'trending','recommendation'
    ));
EXCEPTION WHEN others THEN
  RAISE NOTICE 'notifications_type_check: %', SQLERRM;
END $$;


-- ============================================================
-- 10. HELPER FUNCTIONS
-- ============================================================

-- Function: get report queue for admins
CREATE OR REPLACE FUNCTION get_moderation_queue(
  p_status TEXT DEFAULT 'pending',
  p_limit  INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  report_id       UUID,
  report_status   TEXT,
  report_category TEXT,
  report_reason   TEXT,
  report_details  TEXT,
  reporter_name   TEXT,
  target_type     TEXT,
  target_id       UUID,
  report_count    BIGINT,
  created_at      TIMESTAMPTZ
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    r.id,
    r.status,
    r.category,
    r.reason,
    r.details,
    p.full_name,
    r.target_type,
    r.target_id,
    (SELECT COUNT(*) FROM reports r2
     WHERE r2.target_type = r.target_type AND r2.target_id = r.target_id
       AND r2.status = 'pending') AS report_count,
    r.created_at
  FROM reports r
  JOIN profiles p ON p.id = r.reporter_id
  WHERE r.status = p_status
  ORDER BY r.created_at ASC
  LIMIT p_limit OFFSET p_offset;
$$;


-- Function: search posts via full-text
CREATE OR REPLACE FUNCTION search_posts(
  query TEXT,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS SETOF posts
LANGUAGE sql STABLE AS $$
  SELECT p.*
  FROM posts p
  WHERE p.deleted_at IS NULL
    AND p.search_vector @@ plainto_tsquery('english', query)
  ORDER BY ts_rank(p.search_vector, plainto_tsquery('english', query)) DESC,
           p.created_at DESC
  LIMIT p_limit OFFSET p_offset;
$$;


-- Function: search users by fuzzy name/username
CREATE OR REPLACE FUNCTION search_users(
  query TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  id          UUID,
  username    TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  bio         TEXT,
  is_verified BOOLEAN,
  similarity  REAL
)
LANGUAGE sql STABLE AS $$
  SELECT
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    COALESCE(p.is_verified, FALSE),
    GREATEST(
      similarity(p.username, query),
      similarity(p.full_name, query)
    ) AS sim
  FROM profiles p
  WHERE p.banned_at IS NULL
    AND (
      p.username ILIKE '%' || query || '%'
      OR p.full_name ILIKE '%' || query || '%'
      OR similarity(p.username, query) > 0.2
      OR similarity(p.full_name, query) > 0.2
    )
  ORDER BY sim DESC, p.created_at ASC
  LIMIT p_limit;
$$;


-- Function: efficient inbox query (single query instead of N+1)
CREATE OR REPLACE FUNCTION get_inbox(p_user_id UUID)
RETURNS TABLE(
  conversation_id     UUID,
  other_user_id       UUID,
  other_username      TEXT,
  other_full_name     TEXT,
  other_avatar_url    TEXT,
  last_message_text   TEXT,
  last_message_at     TIMESTAMPTZ,
  last_message_sender UUID,
  unread_count        INTEGER
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    c.id,
    other_member.user_id,
    op.username,
    op.full_name,
    op.avatar_url,
    c.last_message_text,
    c.last_message_at,
    c.last_message_sender,
    COALESCE(my_member.unread_count, 0)
  FROM conversation_members my_member
  JOIN conversations c ON c.id = my_member.conversation_id
  LEFT JOIN conversation_members other_member
    ON other_member.conversation_id = c.id AND other_member.user_id != p_user_id
  LEFT JOIN profiles op ON op.id = other_member.user_id
  WHERE my_member.user_id = p_user_id
  ORDER BY c.last_message_at DESC NULLS LAST;
$$;


-- Function: mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_read(p_conversation_id UUID, p_user_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE conversation_members
  SET unread_count = 0, last_read_at = NOW()
  WHERE conversation_id = p_conversation_id AND user_id = p_user_id;

  UPDATE messages
  SET is_read = TRUE
  WHERE conversation_id = p_conversation_id
    AND sender_id != p_user_id
    AND is_read = FALSE;
END;
$$;
