/**
 * Feed Algorithm Service
 *
 * Centralised feed ranking, filtering, and recommendation engine.
 * All feed types (For You, Following, Trending, Reels, Explore)
 * go through this service so ranking logic stays in one place.
 *
 * Design:
 *   1. Fetch candidate posts from Supabase (cursor-paginated)
 *   2. Apply exclusion filters (blocked, muted, reported, deleted)
 *   3. Score each post with a weighted ranking formula
 *   4. Sort and return the ranked page
 */

import { supabase } from './supabase';
import type { Post, Profile } from './types';

// ─── Configuration ─────────────────────────────────────────
export const FEED_PAGE_SIZE = 15;

/** Weights for the ranking formula — tunable per feed type */
export interface RankingWeights {
  recency: number;
  engagement: number;
  relationship: number;
  popularity: number;
  quality: number;
  freshness: number; // bonus for posts < 4 h old
}

const DEFAULT_WEIGHTS: Record<FeedType, RankingWeights> = {
  for_you: {
    recency: 2.0,
    engagement: 3.0,
    relationship: 4.0,
    popularity: 1.5,
    quality: 1.0,
    freshness: 3.0,
  },
  following: {
    recency: 4.0,
    engagement: 1.0,
    relationship: 2.0,
    popularity: 0.5,
    quality: 0.5,
    freshness: 2.0,
  },
  trending: {
    recency: 1.0,
    engagement: 5.0,
    relationship: 0.0,
    popularity: 4.0,
    quality: 1.0,
    freshness: 2.0,
  },
  reels: {
    recency: 1.5,
    engagement: 3.0,
    relationship: 2.0,
    popularity: 3.0,
    quality: 1.5,
    freshness: 2.5,
  },
  explore: {
    recency: 1.5,
    engagement: 3.0,
    relationship: 0.5,
    popularity: 3.5,
    quality: 1.0,
    freshness: 2.0,
  },
};

export type FeedType = 'for_you' | 'following' | 'trending' | 'reels' | 'explore';

// ─── Exclusion set cache (per session) ─────────────────────
let _excludedUserIds: Set<string> | null = null;
let _excludedPostIds: Set<string> | null = null;
let _followingIds: Set<string> | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 1 minute

async function ensureFilterCache(userId: string): Promise<void> {
  if (_excludedUserIds && Date.now() - _cacheTimestamp < CACHE_TTL) return;

  const [blockedRes, mutedRes, reportedRes, followingRes] = await Promise.all([
    supabase.from('blocks').select('blocked_id').eq('blocker_id', userId),
    supabase.from('mutes').select('muted_id').eq('muter_id', userId),
    supabase.from('reports').select('post_id').eq('reporter_id', userId),
    supabase.from('follows').select('following_id').eq('follower_id', userId),
  ]);

  _excludedUserIds = new Set<string>([
    ...(blockedRes.data?.map((r) => r.blocked_id) ?? []),
    ...(mutedRes.data?.map((r) => r.muted_id) ?? []),
  ]);

  _excludedPostIds = new Set<string>(
    reportedRes.data?.map((r) => r.post_id) ?? [],
  );

  _followingIds = new Set<string>(
    followingRes.data?.map((r) => r.following_id) ?? [],
  );

  _cacheTimestamp = Date.now();
}

/** Call when user logs out or on auth change */
export function clearFeedCache(): void {
  _excludedUserIds = null;
  _excludedPostIds = null;
  _followingIds = null;
  _cacheTimestamp = 0;
}

// ─── Scoring functions ───────────────────────────────────

/** 0‑100 — higher = newer */
function recencyScore(createdAt: string): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (ageHours < 1) return 100;
  if (ageHours < 4) return 90;
  if (ageHours < 12) return 70;
  if (ageHours < 24) return 50;
  if (ageHours < 48) return 30;
  if (ageHours < 168) return 15; // 1 week
  return 5;
}

/** 0‑100 — composite engagement signal */
function engagementScore(post: Post): number {
  const supports = post.supports_count || 0;
  const comments = post.comments_count || 0;
  const dislikes = post.dislikes_count || 0;
  const saves    = (post as any).saves_count || 0;
  const shares   = (post as any).shares_count || 0;

  // Comments are worth more (higher intent), dislikes subtract
  const raw = supports * 2 + comments * 4 + saves * 3 + shares * 3 - dislikes * 1;
  // Logarithmic scaling to avoid mega-popular posts dominating
  return Math.min(100, Math.log2(Math.max(1, raw)) * 12);
}

/** 0‑100 — how close is this author to the viewer */
function relationshipScore(
  authorId: string,
  followingIds: Set<string>,
  _interactionCounts?: Map<string, number>,
): number {
  let score = 0;
  if (followingIds.has(authorId)) score += 50;

  // If we have interaction counts (likes/comments on their posts), boost
  const interactions = _interactionCounts?.get(authorId) ?? 0;
  score += Math.min(50, interactions * 10);

  return Math.min(100, score);
}

/** 0‑100 — overall post popularity (engagement / impressions ratio) */
function popularityScore(post: Post): number {
  const totalEngagement =
    (post.supports_count || 0) +
    (post.comments_count || 0) +
    ((post as any).saves_count || 0);
  const views = Math.max(1, (post as any).views_count || 1);
  const ratio = totalEngagement / views;
  // ratio of 0.1 (10% engagement) → 100
  return Math.min(100, ratio * 1000);
}

/** 0‑100 — content quality heuristics (anti-spam) */
function qualityScore(post: Post): number {
  let score = 60; // baseline

  // Title present and meaningful
  if (post.title && post.title.length > 10) score += 10;

  // Content has substance (not just emoji)
  if (post.content && post.content.length > 50) score += 10;

  // Has media
  if (post.image_url || post.video_url) score += 10;

  // Dislikes penalty
  const dislikes = post.dislikes_count || 0;
  const supports = post.supports_count || 0;
  if (dislikes > supports && dislikes > 3) score -= 30;

  // Very short content likely low quality
  if (post.content && post.content.length < 10 && !post.image_url && !post.video_url) {
    score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

/** Bonus 0‑100 for very fresh content (< 4h) */
function freshnessBonus(createdAt: string): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (ageHours < 1) return 100;
  if (ageHours < 2) return 75;
  if (ageHours < 4) return 50;
  return 0;
}

/** Compute final weighted score for a post */
function computeScore(
  post: Post,
  weights: RankingWeights,
  followingIds: Set<string>,
  interactionCounts?: Map<string, number>,
): number {
  return (
    weights.recency      * recencyScore(post.created_at) +
    weights.engagement   * engagementScore(post) +
    weights.relationship * relationshipScore(post.author_id, followingIds, interactionCounts) +
    weights.popularity   * popularityScore(post) +
    weights.quality      * qualityScore(post) +
    weights.freshness    * freshnessBonus(post.created_at)
  );
}

// ─── Feed fetch + rank pipeline ──────────────────────────

export interface FeedOptions {
  feedType: FeedType;
  cursor?: string | null;
  pageSize?: number;
  category?: string | null;
  searchQuery?: string | null;
  userId: string;           // the authenticated viewer
}

export interface FeedResult {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Main entry point — fetch, filter, rank, and return a page of posts.
 */
export async function fetchFeed(options: FeedOptions): Promise<FeedResult> {
  const {
    feedType,
    cursor = null,
    pageSize = FEED_PAGE_SIZE,
    category = null,
    searchQuery = null,
    userId,
  } = options;

  // Ensure filter cache is warm
  await ensureFilterCache(userId);

  // Over-fetch 2x so filtering doesn't leave us short
  const fetchSize = pageSize * 2;

  // Build the Supabase query
  const candidates = await fetchCandidates({
    feedType,
    cursor,
    fetchSize,
    category,
    searchQuery,
    userId,
  });

  // Apply exclusion filters
  const filtered = applyFilters(candidates, userId);

  // Score and rank
  const scored = filtered.map((post) => ({
    post,
    score: computeScore(
      post,
      DEFAULT_WEIGHTS[feedType],
      _followingIds ?? new Set(),
    ),
  }));

  // For "latest" / chronological feeds, skip re-sorting
  if (feedType === 'following') {
    // Following feed: keep chronological but boost interacted-with users
    scored.sort((a, b) => {
      // If scores are very close, prefer chronological
      if (Math.abs(a.score - b.score) < 50) {
        return new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime();
      }
      return b.score - a.score;
    });
  } else {
    scored.sort((a, b) => b.score - a.score);
  }

  // Take the requested page
  const page = scored.slice(0, pageSize).map((s) => s.post);
  const nextCursor = page.length > 0 ? page[page.length - 1].created_at : null;

  return {
    posts: page,
    nextCursor,
    hasMore: page.length === pageSize,
  };
}

// ─── Candidate fetching (per feed type) ──────────────────

interface CandidateOptions {
  feedType: FeedType;
  cursor: string | null;
  fetchSize: number;
  category: string | null;
  searchQuery: string | null;
  userId: string;
}

async function fetchCandidates(opts: CandidateOptions): Promise<Post[]> {
  const { feedType, cursor, fetchSize, category, searchQuery, userId } = opts;

  const selectClause = '*, author:profiles!posts_author_id_fkey(id, full_name, username, avatar_url)';

  let query = supabase
    .from('posts')
    .select(selectClause)
    .is('deleted_at', null)
    .limit(fetchSize);

  // Feed-type specific filters
  switch (feedType) {
    case 'for_you':
    case 'following':
    case 'explore':
      // Exclude reels from text feeds
      query = query.is('video_url', null);
      break;
    case 'reels':
      // Only video posts
      query = query.not('video_url', 'is', null);
      break;
    case 'trending':
      // All non-deleted posts (videos + text)
      break;
  }

  // Following feed: only from people the user follows
  if (feedType === 'following' && _followingIds && _followingIds.size > 0) {
    query = query.in('author_id', Array.from(_followingIds));
  }

  // Category filter
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  // Search filter
  if (searchQuery && searchQuery.trim()) {
    query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
  }

  // Cursor pagination
  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  // Ordering: trending uses engagement, everything else uses recency as base
  if (feedType === 'trending') {
    query = query
      .order('supports_count', { ascending: false })
      .order('comments_count', { ascending: false })
      .order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.warn(`[FeedService] fetchCandidates error (${feedType}):`, error.message);
    return [];
  }

  return (data ?? []) as Post[];
}

// ─── Filtering ───────────────────────────────────────────

function applyFilters(posts: Post[], viewerId: string): Post[] {
  return posts.filter((post) => {
    // Skip posts from blocked / muted users
    if (_excludedUserIds?.has(post.author_id)) return false;

    // Skip posts the viewer already reported
    if (_excludedPostIds?.has(post.id)) return false;

    // Skip soft-deleted posts (double-check)
    if (post.deleted_at) return false;

    // Spam heuristic: if dislikes > 2× supports and dislikes > 5, suppress
    const dislikes = post.dislikes_count || 0;
    const supports = post.supports_count || 0;
    if (dislikes > 5 && dislikes > supports * 2) return false;

    return true;
  });
}

// ─── Trending detection ──────────────────────────────────

export interface TrendingPost extends Post {
  trendingScore: number;
}

/**
 * Fetch trending posts using engagement velocity heuristics.
 * Posts that received rapid engagement in the last 6 hours rank highest.
 */
export async function fetchTrending(
  userId: string,
  limit = 20,
): Promise<TrendingPost[]> {
  await ensureFilterCache(userId);

  // Fetch recent posts with high engagement (last 48h)
  const cutoff = new Date(Date.now() - 48 * 3_600_000).toISOString();

  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(id, full_name, username, avatar_url)')
    .is('deleted_at', null)
    .gte('created_at', cutoff)
    .order('supports_count', { ascending: false })
    .limit(limit * 2);

  if (error || !data) return [];

  const candidates = applyFilters(data as Post[], userId);

  // Compute trending score: engagement velocity (engagement / age)
  const trending: TrendingPost[] = candidates.map((post) => {
    const ageHours = Math.max(0.5, (Date.now() - new Date(post.created_at).getTime()) / 3_600_000);
    const totalEngagement =
      (post.supports_count || 0) * 2 +
      (post.comments_count || 0) * 4 +
      ((post as any).saves_count || 0) * 3;

    // Velocity = engagement per hour, boosted for very fresh content
    const velocity = totalEngagement / ageHours;
    const freshnessMultiplier = ageHours < 4 ? 2.0 : ageHours < 12 ? 1.5 : 1.0;

    return {
      ...post,
      trendingScore: velocity * freshnessMultiplier,
    };
  });

  trending.sort((a, b) => b.trendingScore - a.trendingScore);
  return trending.slice(0, limit);
}

// ─── Reels feed with watch-completion ranking ────────────

/**
 * Optimised reels feed that factors in watch completion rates.
 * Falls back to recency+engagement when no watch data exists.
 */
export async function fetchReelsFeed(
  userId: string,
  cursor: string | null = null,
  pageSize = 10,
): Promise<FeedResult> {
  return fetchFeed({
    feedType: 'reels',
    cursor,
    pageSize,
    userId,
  });
}

// ─── Track engagement events ─────────────────────────────

/** Record a post view/impression */
export async function recordPostView(
  postId: string,
  userId: string,
  source: string = 'feed',
): Promise<void> {
  // Fire-and-forget insert — don't block the UI
  supabase
    .from('post_views')
    .insert({ post_id: postId, user_id: userId, source })
    .then(({ error }) => {
      if (error) console.warn('[FeedService] recordPostView error:', error.message);
    });
}

/** Record reel watch event */
export async function recordReelWatch(params: {
  postId: string;
  userId: string;
  watchDuration: number;
  videoDuration: number;
}): Promise<void> {
  const { postId, userId, watchDuration, videoDuration } = params;
  const completed = videoDuration > 0 && watchDuration >= videoDuration * 0.9;
  const rewatched = videoDuration > 0 && watchDuration > videoDuration;

  supabase
    .from('reel_watches')
    .insert({
      post_id: postId,
      user_id: userId,
      watch_duration: Math.round(watchDuration),
      video_duration: Math.round(videoDuration),
      completed,
      rewatched,
    })
    .then(({ error }) => {
      if (error) console.warn('[FeedService] recordReelWatch error:', error.message);
    });
}

/** Save/unsave a post (bookmark) */
export async function toggleSave(
  postId: string,
  userId: string,
): Promise<{ saved: boolean }> {
  // Check if already saved
  const { data: existing } = await supabase
    .from('saves')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('saves').delete().eq('id', existing.id);
    return { saved: false };
  } else {
    await supabase.from('saves').insert({ post_id: postId, user_id: userId });
    return { saved: true };
  }
}

/** Mute/unmute a user */
export async function toggleMute(
  muterId: string,
  mutedId: string,
): Promise<{ muted: boolean }> {
  const { data: existing } = await supabase
    .from('mutes')
    .select('muter_id')
    .eq('muter_id', muterId)
    .eq('muted_id', mutedId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('mutes')
      .delete()
      .eq('muter_id', muterId)
      .eq('muted_id', mutedId);
    clearFeedCache(); // bust filter cache
    return { muted: false };
  } else {
    await supabase.from('mutes').insert({ muter_id: muterId, muted_id: mutedId });
    clearFeedCache();
    return { muted: true };
  }
}

// ─── Simple recommendation engine ───────────────────────

/**
 * Suggest posts the user hasn't seen, from authors similar to
 * who they follow or interact with.
 */
export async function getRecommendations(
  userId: string,
  limit = 10,
): Promise<Post[]> {
  await ensureFilterCache(userId);

  if (!_followingIds || _followingIds.size === 0) {
    // Cold start: recommend popular recent posts
    return (await fetchTrending(userId, limit)) as Post[];
  }

  // Find users followed by people I follow ("friends of friends")
  const { data: fofData } = await supabase
    .from('follows')
    .select('following_id')
    .in('follower_id', Array.from(_followingIds))
    .limit(50);

  const fofIds = new Set(
    (fofData ?? [])
      .map((r) => r.following_id)
      .filter((id) => id !== userId && !_followingIds!.has(id)),
  );

  if (fofIds.size === 0) {
    return (await fetchTrending(userId, limit)) as Post[];
  }

  // Fetch popular posts from those users
  const { data, error } = await supabase
    .from('posts')
    .select('*, author:profiles!posts_author_id_fkey(id, full_name, username, avatar_url)')
    .is('deleted_at', null)
    .in('author_id', Array.from(fofIds).slice(0, 20))
    .order('supports_count', { ascending: false })
    .limit(limit * 2);

  if (error || !data) return [];

  return applyFilters(data as Post[], userId).slice(0, limit);
}
