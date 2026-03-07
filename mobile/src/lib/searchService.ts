/**
 * Search Service
 *
 * Unified search across users, posts, hashtags, and reels.
 *
 * Features:
 *   - Full-text post search via PostgreSQL tsvector (search_posts RPC)
 *   - Fuzzy user search via pg_trgm (search_users RPC)
 *   - Hashtag search with popularity ranking
 *   - Combined search (all entity types in one call)
 *   - Recent search history (local)
 *   - Search suggestions / autocomplete
 */

import { supabase } from './supabase';
import type { Post, Profile } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ─────────────────────────────────────────────────

export type SearchTab = 'all' | 'posts' | 'users' | 'hashtags' | 'reels';

export interface SearchUserResult {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  similarity: number;
}

export interface SearchHashtagResult {
  id: string;
  tag: string;
  post_count: number;
}

export interface SearchResults {
  posts: Post[];
  users: SearchUserResult[];
  hashtags: SearchHashtagResult[];
  reels: Post[];
}

// ─── Configuration ─────────────────────────────────────────

const RECENTS_KEY = '@search_recents';
const MAX_RECENTS = 15;

// ─── Post Search (full-text via RPC) ───────────────────────

export async function searchPosts(
  query: string,
  limit: number = 20,
  offset: number = 0,
): Promise<Post[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase.rpc('search_posts', {
    query: query.trim(),
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.warn('[search] post search error:', error.message);
    // Fallback: ilike search
    return fallbackPostSearch(query, limit, offset);
  }

  return (data ?? []) as Post[];
}

/** Fallback when full-text RPC unavailable */
async function fallbackPostSearch(
  query: string,
  limit: number,
  offset: number,
): Promise<Post[]> {
  const pattern = `%${query.trim()}%`;
  const { data } = await supabase
    .from('posts')
    .select('*, author:profiles(*)')
    .is('deleted_at', null)
    .or(`title.ilike.${pattern},content.ilike.${pattern}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  return (data ?? []) as Post[];
}


// ─── User Search (fuzzy via RPC) ───────────────────────────

export async function searchUsers(
  query: string,
  limit: number = 20,
): Promise<SearchUserResult[]> {
  if (!query.trim()) return [];

  const { data, error } = await supabase.rpc('search_users', {
    query: query.trim(),
    p_limit: limit,
  });

  if (error) {
    console.warn('[search] user search error:', error.message);
    // Fallback: ilike
    return fallbackUserSearch(query, limit);
  }

  return (data ?? []) as SearchUserResult[];
}

async function fallbackUserSearch(
  query: string,
  limit: number,
): Promise<SearchUserResult[]> {
  const pattern = `%${query.trim()}%`;
  const { data } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio')
    .is('banned_at', null)
    .or(`username.ilike.${pattern},full_name.ilike.${pattern}`)
    .limit(limit);

  return (data ?? []).map((p: any) => ({
    ...p,
    is_verified: false,
    similarity: 0,
  }));
}


// ─── Hashtag Search ────────────────────────────────────────

export async function searchHashtags(
  query: string,
  limit: number = 15,
): Promise<SearchHashtagResult[]> {
  if (!query.trim()) return [];

  const tag = query.trim().replace(/^#/, '').toLowerCase();

  const { data } = await supabase
    .from('hashtags')
    .select('id, tag, post_count')
    .ilike('tag', `%${tag}%`)
    .order('post_count', { ascending: false })
    .limit(limit);

  return (data ?? []) as SearchHashtagResult[];
}

/**
 * Get posts for a specific hashtag.
 */
export async function getPostsByHashtag(
  hashtagId: string,
  limit: number = 20,
  offset: number = 0,
): Promise<Post[]> {
  const { data } = await supabase
    .from('post_hashtags')
    .select('post_id')
    .eq('hashtag_id', hashtagId)
    .range(offset, offset + limit - 1);

  if (!data || data.length === 0) return [];

  const postIds = data.map((r) => r.post_id);

  const { data: posts } = await supabase
    .from('posts')
    .select('*, author:profiles(*)')
    .in('id', postIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (posts ?? []) as Post[];
}


// ─── Reel Search ───────────────────────────────────────────

export async function searchReels(
  query: string,
  limit: number = 20,
  offset: number = 0,
): Promise<Post[]> {
  if (!query.trim()) return [];

  const pattern = `%${query.trim()}%`;

  const { data } = await supabase
    .from('posts')
    .select('*, author:profiles(*)')
    .not('video_url', 'is', null)
    .is('deleted_at', null)
    .or(`title.ilike.${pattern},content.ilike.${pattern}`)
    .order('supports_count', { ascending: false })
    .range(offset, offset + limit - 1);

  return (data ?? []) as Post[];
}


// ─── Combined Search ───────────────────────────────────────

/**
 * Search across all entity types in parallel.
 * Returns structured results for each tab.
 */
export async function searchAll(
  query: string,
  limits?: { posts?: number; users?: number; hashtags?: number; reels?: number },
): Promise<SearchResults> {
  if (!query.trim()) {
    return { posts: [], users: [], hashtags: [], reels: [] };
  }

  const [posts, users, hashtags, reels] = await Promise.all([
    searchPosts(query, limits?.posts ?? 10),
    searchUsers(query, limits?.users ?? 8),
    searchHashtags(query, limits?.hashtags ?? 5),
    searchReels(query, limits?.reels ?? 6),
  ]);

  return { posts, users, hashtags, reels };
}


// ─── Recent Searches (local storage) ───────────────────────

export async function getRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addRecentSearch(query: string): Promise<void> {
  const q = query.trim();
  if (!q) return;

  try {
    const recents = await getRecentSearches();
    const filtered = recents.filter((r) => r !== q);
    filtered.unshift(q);
    await AsyncStorage.setItem(
      RECENTS_KEY,
      JSON.stringify(filtered.slice(0, MAX_RECENTS)),
    );
  } catch {
    // ignore storage errors
  }
}

export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECENTS_KEY);
  } catch {
    // ignore
  }
}


// ─── Search Suggestions ────────────────────────────────────

/**
 * Get search suggestions for autocomplete.
 * Combines trending hashtags + popular users matching prefix.
 */
export async function getSearchSuggestions(
  prefix: string,
  limit: number = 8,
): Promise<Array<{ type: 'user' | 'hashtag'; text: string; id: string }>> {
  if (prefix.length < 2) return [];

  const [hashtagRes, userRes] = await Promise.all([
    supabase
      .from('hashtags')
      .select('id, tag')
      .ilike('tag', `${prefix.toLowerCase()}%`)
      .order('post_count', { ascending: false })
      .limit(Math.ceil(limit / 2)),
    supabase
      .from('profiles')
      .select('id, username')
      .is('banned_at', null)
      .ilike('username', `${prefix}%`)
      .limit(Math.ceil(limit / 2)),
  ]);

  const suggestions: Array<{ type: 'user' | 'hashtag'; text: string; id: string }> = [];

  (hashtagRes.data ?? []).forEach((h: any) => {
    suggestions.push({ type: 'hashtag', text: `#${h.tag}`, id: h.id });
  });

  (userRes.data ?? []).forEach((u: any) => {
    suggestions.push({ type: 'user', text: `@${u.username}`, id: u.id });
  });

  return suggestions.slice(0, limit);
}


// ─── Hashtag extraction helper ─────────────────────────────

const HASHTAG_REGEX = /#([a-zA-Z0-9_\u0900-\u097F]+)/g;

/**
 * Extract hashtags from text, upsert into hashtags & post_hashtags tables.
 * Call after creating / updating a post.
 */
export async function syncPostHashtags(postId: string, text: string): Promise<void> {
  const matches = text.matchAll(HASHTAG_REGEX);
  const tags = [...new Set([...matches].map((m) => m[1].toLowerCase()))];

  if (tags.length === 0) return;

  // Upsert hashtags
  for (const tag of tags) {
    const { data: existing } = await supabase
      .from('hashtags')
      .select('id')
      .eq('tag', tag)
      .single();

    let hashtagId: string;

    if (existing) {
      hashtagId = existing.id;
      // Increment post_count
      await supabase.rpc('increment_hashtag_count', { p_hashtag_id: hashtagId }).catch(async () => {
        // Fallback: manual increment
        const { data: ht } = await supabase.from('hashtags').select('post_count').eq('id', hashtagId).single();
        if (ht) await supabase.from('hashtags').update({ post_count: ht.post_count + 1 }).eq('id', hashtagId);
      });
    } else {
      const { data: created } = await supabase
        .from('hashtags')
        .insert({ tag, post_count: 1 })
        .select('id')
        .single();
      if (!created) continue;
      hashtagId = created.id;
    }

    // Link post ↔ hashtag
    await supabase
      .from('post_hashtags')
      .upsert({ post_id: postId, hashtag_id: hashtagId }, { onConflict: 'post_id,hashtag_id' });
  }
}
