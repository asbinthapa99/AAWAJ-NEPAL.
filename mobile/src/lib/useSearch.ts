/**
 * useSearch Hook
 *
 * Provides search state management for the search/explore screen.
 * Debounces input, manages tabs, tracks recent searches.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  searchAll,
  searchPosts,
  searchUsers,
  searchHashtags,
  searchReels,
  addRecentSearch,
  getRecentSearches,
  clearRecentSearches,
  getSearchSuggestions,
  type SearchTab,
  type SearchResults,
  type SearchUserResult,
  type SearchHashtagResult,
} from '../lib/searchService';
import { trackSearch } from '../lib/analyticsService';
import type { Post } from '../lib/types';

const DEBOUNCE_MS = 350;

export interface UseSearchReturn {
  query: string;
  setQuery: (q: string) => void;
  activeTab: SearchTab;
  setActiveTab: (tab: SearchTab) => void;
  results: SearchResults;
  loading: boolean;
  recentSearches: string[];
  suggestions: Array<{ type: 'user' | 'hashtag'; text: string; id: string }>;
  search: (q?: string) => Promise<void>;
  loadMore: () => Promise<void>;
  clearRecents: () => Promise<void>;
  hasMore: boolean;
}

export function useSearch(): UseSearchReturn {
  const [query, setQueryRaw] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [results, setResults] = useState<SearchResults>({ posts: [], users: [], hashtags: [], reels: [] });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Array<{ type: 'user' | 'hashtag'; text: string; id: string }>>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load recents on mount
  useEffect(() => {
    getRecentSearches().then(setRecentSearches);
  }, []);

  // Debounced query setter with suggestions
  const setQuery = useCallback((q: string) => {
    setQueryRaw(q);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.trim().length >= 2) {
      debounceRef.current = setTimeout(async () => {
        const sugs = await getSearchSuggestions(q.trim());
        setSuggestions(sugs);
      }, 200);
    } else {
      setSuggestions([]);
    }
  }, []);

  // Execute search
  const search = useCallback(
    async (overrideQuery?: string) => {
      const q = (overrideQuery ?? query).trim();
      if (!q) return;

      setLoading(true);
      setOffset(0);
      setHasMore(true);
      setSuggestions([]);

      try {
        if (activeTab === 'all') {
          const r = await searchAll(q);
          setResults(r);
        } else if (activeTab === 'posts') {
          const posts = await searchPosts(q, 20, 0);
          setResults((prev) => ({ ...prev, posts }));
          setHasMore(posts.length >= 20);
        } else if (activeTab === 'users') {
          const users = await searchUsers(q, 20);
          setResults((prev) => ({ ...prev, users }));
        } else if (activeTab === 'hashtags') {
          const hashtags = await searchHashtags(q, 20);
          setResults((prev) => ({ ...prev, hashtags }));
        } else if (activeTab === 'reels') {
          const reels = await searchReels(q, 20, 0);
          setResults((prev) => ({ ...prev, reels }));
          setHasMore(reels.length >= 20);
        }

        // Track + save to recents
        const totalResults =
          (activeTab === 'all'
            ? results.posts.length + results.users.length + results.hashtags.length + results.reels.length
            : 0);
        trackSearch(q, totalResults);
        await addRecentSearch(q);
        const recents = await getRecentSearches();
        setRecentSearches(recents);
      } catch (err) {
        console.warn('[useSearch] error:', err);
      } finally {
        setLoading(false);
      }
    },
    [query, activeTab],
  );

  // Pagination (posts & reels only)
  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !query.trim()) return;

    const nextOffset = offset + 20;
    setLoading(true);

    try {
      if (activeTab === 'posts') {
        const more = await searchPosts(query, 20, nextOffset);
        setResults((prev) => ({ ...prev, posts: [...prev.posts, ...more] }));
        setHasMore(more.length >= 20);
        setOffset(nextOffset);
      } else if (activeTab === 'reels') {
        const more = await searchReels(query, 20, nextOffset);
        setResults((prev) => ({ ...prev, reels: [...prev.reels, ...more] }));
        setHasMore(more.length >= 20);
        setOffset(nextOffset);
      }
    } catch (err) {
      console.warn('[useSearch] loadMore error:', err);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, query, offset, activeTab]);

  const clearRecents = useCallback(async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  }, []);

  return {
    query,
    setQuery,
    activeTab,
    setActiveTab,
    results,
    loading,
    recentSearches,
    suggestions,
    search,
    loadMore,
    clearRecents,
    hasMore,
  };
}
