// Types shared with web app — keep in sync with src/lib/types.ts

export interface Profile {
  id: string;
  username: string;
  email?: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  bio_subtitle: string | null;
  website: string | null;
  cover_image_url: string | null;
  district: string | null;
  role: 'user' | 'admin';
  banned_at: string | null;
  suspended_until: string | null;
  warning_count: number;
  trust_score: number;
  is_verified: boolean;
  spam_score: number;
  last_active_at: string | null;
  post_count: number;
  created_at: string;
}

export type PostCategory =
  | 'infrastructure'
  | 'education'
  | 'health'
  | 'environment'
  | 'governance'
  | 'safety'
  | 'employment'
  | 'social'
  | 'culture'
  | 'technology'
  | 'other';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: PostCategory;
  district: string | null;
  urgency: UrgencyLevel;
  voice_url: string | null;
  image_url: string | null;
  video_url: string | null;
  supports_count: number;
  dislikes_count: number;
  comments_count: number;
  views_count: number;
  saves_count: number;
  shares_count: number;
  created_at: string;
  deleted_at: string | null;
  search_vector?: unknown;
  author?: Profile;
  user_has_disliked?: boolean;
  repost_caption?: string;
  repost_user?: Profile;
  repost_id?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  reply_to_id: string | null;
  created_at: string;
  deleted_at: string | null;
  author?: Profile;
  replies?: Comment[];
}

export type NotificationType =
  | 'support'
  | 'comment'
  | 'follow'
  | 'repost'
  | 'message'
  | 'save'
  | 'mention'
  | 'friend_request'
  | 'warning'
  | 'suspension'
  | 'report_resolved'
  | 'trending'
  | 'recommendation';

export interface Notification {
  id: string;
  to_user_id: string;
  from_user_id: string;
  type: NotificationType;
  entity_id: string | null;
  data: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
  delivered_at: string | null;
  push_sent: boolean;
  grouped: boolean;
  group_key: string | null;
  from_user?: Profile;
}

// ─── Messaging ─────────────────────────────────────────────

export interface Conversation {
  id: string;
  last_message_id: string | null;
  last_message_at: string | null;
  last_message_text: string | null;
  last_message_sender: string | null;
  created_at: string;
}

export interface ConversationMember {
  conversation_id: string;
  user_id: string;
  unread_count: number;
  last_read_at: string | null;
  is_muted: boolean;
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  read_by: Array<{ user_id: string; read_at: string }>;
  created_at: string;
  sender?: Profile;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

// ─── Inbox (single-query result) ───────────────────────────

export interface InboxConversation {
  conversation_id: string;
  other_user_id: string;
  other_username: string;
  other_full_name: string;
  other_avatar_url: string | null;
  last_message_text: string | null;
  last_message_at: string | null;
  last_message_sender: string | null;
  unread_count: number;
}

// ─── Media ─────────────────────────────────────────────────

export type MediaEntityType = 'post_image' | 'post_video' | 'avatar' | 'cover' | 'reel';
export type MediaProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface MediaMetadata {
  id: string;
  owner_id: string;
  entity_type: MediaEntityType;
  entity_id: string | null;
  storage_path: string;
  public_url: string;
  thumbnail_url: string | null;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  duration_ms: number | null;
  processing_status: MediaProcessingStatus;
  cdn_url: string | null;
  blurhash: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Search ────────────────────────────────────────────────

export interface SearchUserResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  similarity: number;
}

export interface Hashtag {
  id: string;
  tag: string;
  post_count: number;
  created_at: string;
}

// ─── Discovery ─────────────────────────────────────────────

export interface SuggestedUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  reason: string;
  score: number;
  mutual_count?: number;
  is_verified?: boolean;
}

export interface TrendingItem {
  id: string;
  item_type: 'post' | 'hashtag' | 'user' | 'topic';
  item_id?: string;
  item_text?: string;
  score: number;
  metadata: Record<string, unknown>;
}

// ─── Analytics ─────────────────────────────────────────────

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  screen: string | null;
  session_id: string | null;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  platform: 'ios' | 'android' | 'web';
  app_version: string | null;
}

// ─── Moderation ────────────────────────────────────────────

export type ReportCategory =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'violence'
  | 'sexual'
  | 'misinformation'
  | 'impersonation'
  | 'copyright'
  | 'other';

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'post' | 'user';
  target_id: string;
  category: ReportCategory;
  reason: string;
  details: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution: string | null;
  moderator_note: string | null;
  created_at: string;
}

export interface UserWarning {
  id: string;
  user_id: string;
  issued_by: string;
  reason: string;
  severity: 'notice' | 'warning' | 'strike' | 'final_warning';
  related_id: string | null;
  acknowledged_at: string | null;
  expires_at: string | null;
  created_at: string;
}

// ─── Notification Preferences ──────────────────────────────

export interface NotificationPreferences {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  notify_supports: boolean;
  notify_comments: boolean;
  notify_follows: boolean;
  notify_mentions: boolean;
  notify_messages: boolean;
  notify_reposts: boolean;
  notify_friend_reqs: boolean;
  group_similar: boolean;
  min_interval_sec: number;
}
