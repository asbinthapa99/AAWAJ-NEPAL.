/**
 * Discovery Service
 *
 * Powers the explore / discover feed with:
 *   - Suggested users (mutual follows, same district, popular)
 *   - Trending posts / hashtags / reels
 *   - Topic exploration (by category / district)
 *   - "More like this" post recommendations
 */

import { supabase } from './supabase';
import type { Post, Profile } from './types';

// ─── Types ─────────────────────────────────────────────────

export interface SuggestedUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  reason: string;          // 'mutual_friends' | 'similar_interests' | 'popular' | 'same_district'
  score: number;
  mutual_count?: number;   // how many mutual friends
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

export interface TopicGroup {
  category: string;
  post_count: number;
  recent_posts: Post[];
}

// ─── Suggested Users ───────────────────────────────────────

/**
 * Get personalised user suggestions for a given user.
 *
 * Strategy (in order of preference):
 *   1. Users followed by people I follow (mutual network)
 *   2. Users in the same district
 *   3. Users with similar category interests
 *   4. Globally popular users
 */
export async function getSuggestedUsers(
  userId: string,
  limit: number = 10,
): Promise<SuggestedUser[]> {
  // First try the cached suggestions
  const { data: cached } = await supabase
    .from('suggested_follows')
    .select(`
      suggested_id,
      reason,
      score,
      profile:profiles!suggested_follows_suggested_id_fkey(
        id, username, full_name, avatar_url, bio, is_verified
      )
    `)
    .eq('user_id', userId)
    .order('score', { ascending: false })
    .limit(limit);

  if (cached && cached.length >= 3) {
    return cached.map((row: any) => ({
      id: row.profile.id,
      username: row.profile.username,
      full_name: row.profile.full_name,
      avatar_url: row.profile.avatar_url,
      bio: row.profile.bio,
      reason: row.reason,
      score: row.score,
      is_verified: row.profile.is_verified,
    }));
  }

  // Compute on-the-fly if cache is stale
  return computeSuggestions(userId, limit);
}

async function computeSuggestions(
  userId: string,
  limit: number,
): Promise<SuggestedUser[]> {
  // Get who I follow
  const { data: myFollows } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = new Set((myFollows ?? []).map((f) => f.following_id));
  followingIds.add(userId); // exclude self

  // Get blocked users
  const { data: blocked } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);
  const blockedIds = new Set((blocked ?? []).map((b) => b.blocked_id));

  const suggestions: SuggestedUser[] = [];

  // Strategy 1: Mutual follows — "friends of friends"
  if (followingIds.size > 1) {
    const followArr = [...followingIds].filter((id) => id !== userId);
    const { data: fof } = await supabase
      .from('follows')
      .select('following_id')
      .in('follower_id', followArr.slice(0, 50));

    if (fof) {
      // Count how many of my friends follow each user
      const counts = new Map<string, number>();
      for (const row of fof) {
        if (followingIds.has(row.following_id) || blockedIds.has(row.following_id)) continue;
        counts.set(row.following_id, (counts.get(row.following_id) ?? 0) + 1);
      }

      // Get top mutual candidates
      const sorted = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      if (sorted.length > 0) {
        const candidateIds = sorted.map(([id]) => id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, is_verified')
          .in('id', candidateIds)
          .is('banned_at', null);

        for (const p of profiles ?? []) {
          const mutualCount = counts.get(p.id) ?? 0;
          suggestions.push({
            id: p.id,
            username: p.username,
            full_name: p.full_name,
            avatar_url: p.avatar_url,
            bio: p.bio,
            reason: 'mutual_friends',
            score: mutualCount * 10,
            mutual_count: mutualCount,
            is_verified: p.is_verified,
          });
        }
      }
    }
  }

  // Strategy 2: Same district
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('district')
    .eq('id', userId)
    .single();

  if (myProfile?.district) {
    const excludeIds = [...followingIds, ...blockedIds, ...suggestions.map((s) => s.id)];
    const { data: districtUsers } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, is_verified')
      .eq('district', myProfile.district)
      .is('banned_at', null)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .limit(5);

    for (const p of districtUsers ?? []) {
      suggestions.push({
        id: p.id,
        username: p.username,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        bio: p.bio,
        reason: 'same_district',
        score: 5,
        is_verified: p.is_verified,
      });
    }
  }

  // Strategy 3: Globally popular (fallback)
  if (suggestions.length < limit) {
    const excludeIds = [...followingIds, ...blockedIds, ...suggestions.map((s) => s.id)];
    const need = limit - suggestions.length;
    const { data: popular } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, bio, is_verified, post_count')
      .is('banned_at', null)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .order('post_count', { ascending: false })
      .limit(need);

    for (const p of popular ?? []) {
      suggestions.push({
        id: p.id,
        username: p.username,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        bio: p.bio,
        reason: 'popular',
        score: 2,
        is_verified: p.is_verified,
      });
    }
  }

  // Cache the suggestions
  if (suggestions.length > 0) {
    const rows = suggestions.map((s) => ({
      user_id: userId,
      suggested_id: s.id,
      reason: s.reason,
      score: s.score,
    }));

    // Clear old suggestions first
    await supabase.from('suggested_follows').delete().eq('user_id', userId);
    await supabase.from('suggested_follows').insert(rows);
  }

  return suggestions.slice(0, limit);
}


// ─── Trending ──────────────────────────────────────────────

/**
 * Get trending items from the pre-computed cache.
 * Falls back to on-the-fly computation if cache is empty.
 */
export async function getTrending(
  itemType?: 'post' | 'hashtag' | 'user' | 'topic',
  limit: number = 20,
): Promise<TrendingItem[]> {
  let query = supabase
    .from('trending_cache')
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('score', { ascending: false })
    .limit(limit);

  if (itemType) {
    query = query.eq('item_type', itemType);
  }

  const { data } = await query;

  if (data && data.length > 0) {
    return data as TrendingItem[];
  }

  // Fallback: compute trending posts by engagement in last 24h
  if (!itemType || itemType === 'post') {
    return computeTrendingPosts(limit);
  }
  if (itemType === 'hashtag') {
    return computeTrendingHashtags(limit);
  }

  return [];
}

async function computeTrendingPosts(limit: number): Promise<TrendingItem[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('posts')
    .select('id, title, supports_count, comments_count, views_count')
    .is('deleted_at', null)
    .gte('created_at', since)
    .order('supports_count', { ascending: false })
    .limit(limit);

  return (data ?? []).map((p: any) => ({
    id: p.id,
    item_type: 'post' as const,
    item_id: p.id,
    item_text: p.title,
    score: (p.supports_count ?? 0) * 3 + (p.comments_count ?? 0) * 2 + (p.views_count ?? 0),
    metadata: { supports: p.supports_count, comments: p.comments_count, views: p.views_count },
  }));
}

async function computeTrendingHashtags(limit: number): Promise<TrendingItem[]> {
  const { data } = await supabase
    .from('hashtags')
    .select('id, tag, post_count')
    .order('post_count', { ascending: false })
    .limit(limit);

  return (data ?? []).map((h: any) => ({
    id: h.id,
    item_type: 'hashtag' as const,
    item_id: h.id,
    item_text: h.tag,
    score: h.post_count,
    metadata: { post_count: h.post_count },
  }));
}


// ─── Topic Exploration ─────────────────────────────────────

/**
 * Get categories with their recent posts.
 * Powers the "browse by topic" section of explore.
 */
export async function getTopicGroups(
  topN: number = 6,
  postsPerTopic: number = 3,
): Promise<TopicGroup[]> {
  // Get top categories by post count (last 7 days)
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: catCounts } = await supabase
    .from('posts')
    .select('category')
    .is('deleted_at', null)
    .gte('created_at', since)
    .not('category', 'is', null);

  if (!catCounts || catCounts.length === 0) return [];

  // Count by category
  const counts = new Map<string, number>();
  for (const row of catCounts) {
    if (row.category) {
      counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
    }
  }

  const topCategories = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  // Fetch recent posts per category
  const groups: TopicGroup[] = [];

  for (const [category, count] of topCategories) {
    const { data: posts } = await supabase
      .from('posts')
      .select('*, author:profiles(*)')
      .eq('category', category)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(postsPerTopic);

    groups.push({
      category,
      post_count: count,
      recent_posts: (posts ?? []) as Post[],
    });
  }

  return groups;
}


// ─── "More like this" recommendations ──────────────────────

/**
 * Find posts similar to a given post.
 * Uses category + district matching + engagement score.
 */
export async function getRelatedPosts(
  postId: string,
  limit: number = 6,
): Promise<Post[]> {
  // Get the source post
  const { data: source } = await supabase
    .from('posts')
    .select('category, district, author_id')
    .eq('id', postId)
    .single();

  if (!source) return [];

  // Find posts in same category, excluding source
  const { data } = await supabase
    .from('posts')
    .select('*, author:profiles(*)')
    .eq('category', source.category)
    .neq('id', postId)
    .is('deleted_at', null)
    .order('supports_count', { ascending: false })
    .limit(limit);

  return (data ?? []) as Post[];
}


// ─── District-based discovery ──────────────────────────────

export async function getPostsByDistrict(
  district: string,
  limit: number = 20,
  offset: number = 0,
): Promise<Post[]> {
  const { data } = await supabase
    .from('posts')
    .select('*, author:profiles(*)')
    .eq('district', district)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return (data ?? []) as Post[];
}

/**
 * Get a list of active districts (that have recent posts).
 */
export async function getActiveDistricts(): Promise<Array<{ district: string; count: number }>> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('posts')
    .select('district')
    .is('deleted_at', null)
    .not('district', 'is', null)
    .gte('created_at', since);

  if (!data) return [];

  const counts = new Map<string, number>();
  for (const row of data) {
    if (row.district) {
      counts.set(row.district, (counts.get(row.district) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => b.count - a.count);
}
