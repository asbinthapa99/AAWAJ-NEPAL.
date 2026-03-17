/**
 * useFeed — reusable hook for all feed screens.
 *
 * Encapsulates:
 *  • Paginated fetching via FeedService
 *  • Pull-to-refresh
 *  • Infinite scroll (load more)
 *  • Impression tracking (record views)
 *  • Cache invalidation on tab change
 *
 * Usage:
 *   const feed = useFeed({ feedType: 'for_you', userId: user.id });
 *   <FlatList data={feed.posts} onEndReached={feed.loadMore} ... />
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  fetchFeed,
  fetchTrending,
  recordPostView,
  clearFeedCache,
  FEED_PAGE_SIZE,
  type FeedType,
  type FeedResult,
  type TrendingPost,
} from './feedService';
import type { Post } from './types';

export interface UseFeedOptions {
  feedType: FeedType;
  userId: string | undefined;
  category?: string | null;
  searchQuery?: string | null;
  pageSize?: number;
  enabled?: boolean; // set false to disable auto-fetch
}

export interface UseFeedReturn {
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  trackView: (postId: string, source?: string) => void;
}

export function useFeed(options: UseFeedOptions): UseFeedReturn {
  const {
    feedType,
    userId,
    category = null,
    searchQuery = null,
    pageSize = FEED_PAGE_SIZE,
    enabled = true,
  } = options;

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cursorRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ─── Core fetch ─────────────────────────────────────
  const fetchPage = useCallback(
    async (cursor: string | null, append: boolean) => {
      try {
        let result: FeedResult;

        if (feedType === 'trending' && !cursor) {
          // Use the dedicated trending algorithm for the first page
          const trending = await fetchTrending(userId, pageSize);
          result = {
            posts: trending,
            nextCursor: trending.length > 0 ? trending[trending.length - 1].created_at : null,
            hasMore: trending.length === pageSize,
          };
        } else {
          result = await fetchFeed({
            feedType,
            cursor,
            pageSize,
            category,
            searchQuery,
            userId,
          });
        }

        if (!isMountedRef.current) return;

        if (append) {
          setPosts((prev) => {
            // Deduplicate in case of overlapping pages
            const existingIds = new Set(prev.map((p) => p.id));
            const newPosts = result.posts.filter((p) => !existingIds.has(p.id));
            return [...prev, ...newPosts];
          });
        } else {
          setPosts(result.posts);
        }

        cursorRef.current = result.nextCursor;
        setHasMore(result.hasMore);
        setError(null);
      } catch (e: any) {
        if (!isMountedRef.current) return;
        setError(e?.message || 'Failed to load feed');
      }
    },
    [feedType, userId, category, searchQuery, pageSize],
  );

  // ─── Initial load + reload on deps change ───────────
  useEffect(() => {
    if (!enabled) return;

    const init = async () => {
      cursorRef.current = null;
      setHasMore(true);
      setError(null);
      setLoading(true);

      try {
        await fetchPage(null, false);
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };
    init();
  }, [fetchPage, enabled]);

  // ─── Pull to refresh ───────────────────────────────
  const refresh = useCallback(async () => {
    setRefreshing(true);
    cursorRef.current = null;
    setHasMore(true);
    clearFeedCache(); // bust stale filter cache on refresh
    await fetchPage(null, false);
    if (isMountedRef.current) setRefreshing(false);
  }, [fetchPage]);

  // ─── Load more (infinite scroll) ──────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursorRef.current) return;
    setLoadingMore(true);
    await fetchPage(cursorRef.current, true);
    if (isMountedRef.current) setLoadingMore(false);
  }, [fetchPage, loadingMore, hasMore]);

  // ─── View tracking ────────────────────────────────
  const trackView = useCallback(
    (postId: string, source?: string) => {
      if (userId) recordPostView(postId, userId, source ?? feedType);
    },
    [userId, feedType],
  );

  return {
    posts,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    trackView,
  };
}
