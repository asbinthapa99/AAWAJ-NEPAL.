export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  district: string | null;
  created_at: string;
}

export type PostCategory =
  | 'politics'
  | 'education'
  | 'health'
  | 'infrastructure'
  | 'environment'
  | 'economy'
  | 'social'
  | 'corruption'
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
  author?: Profile;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
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
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  created_at: string;
}

export type Theme = 'light' | 'dark' | 'system';
