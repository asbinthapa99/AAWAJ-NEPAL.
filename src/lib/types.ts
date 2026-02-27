export interface Profile {
  id: string;
  username: string;
  email?: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  district: string | null;
  role: 'user' | 'admin';
  banned_at: string | null;
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
  supports_count: number;
  dislikes_count: number;
  comments_count: number;
  created_at: string;
  deleted_at: string | null;
  author?: Profile;
  user_has_disliked?: boolean;
  // Repost fields (populated when viewing as repost)
  repost_caption?: string;
  repost_user?: Profile;
  repost_id?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
  author?: Profile;
}

export interface Support {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  post_id: string;
  reporter_id: string;
  target_type: 'post' | 'user';
  target_id: string;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Repost {
  id: string;
  user_id: string;
  post_id: string;
  caption: string | null;
  created_at: string;
}

export type NotificationType = 'support' | 'comment' | 'follow' | 'repost';

export interface Notification {
  id: string;
  to_user_id: string;
  from_user_id: string;
  type: NotificationType;
  entity_id: string | null;
  data: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
  from_user?: Profile;
}

export interface Block {
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface News {
  id: string;
  author_id: string;
  title: string;
  body: string;
  link: string | null;
  created_at: string;
}

export type Theme = 'light' | 'dark' | 'system';
