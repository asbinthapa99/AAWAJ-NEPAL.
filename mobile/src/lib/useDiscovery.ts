/**
 * useDiscovery Hook
 *
 * Provides state management for the discover/explore screen.
 * Fetches suggested users, trending content, and topic groups.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  getSuggestedUsers,
  getTrending,
  getTopicGroups,
  getRelatedPosts,
  getActiveDistricts,
  type SuggestedUser,
  type TrendingItem,
  type TopicGroup,
} from '../lib/discoveryService';
import type { Post } from '../lib/types';

export interface UseDiscoveryReturn {
  suggestedUsers: SuggestedUser[];
  trendingPosts: TrendingItem[];
  trendingHashtags: TrendingItem[];
  topicGroups: TopicGroup[];
  districts: Array<{ district: string; count: number }>;
  loading: boolean;
  refreshing: boolean;
  refresh: () => Promise<void>;
  loadRelated: (postId: string) => Promise<Post[]>;
}

export function useDiscovery(userId: string | undefined): UseDiscoveryReturn {
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<TrendingItem[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingItem[]>([]);
  const [topicGroups, setTopicGroups] = useState<TopicGroup[]>([]);
  const [districts, setDistricts] = useState<Array<{ district: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(
    async (isRefresh = false) => {
      if (!userId) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const [users, posts, hashtags, topics, dists] = await Promise.all([
          getSuggestedUsers(userId, 10),
          getTrending('post', 10),
          getTrending('hashtag', 10),
          getTopicGroups(6, 3),
          getActiveDistricts(),
        ]);

        setSuggestedUsers(users);
        setTrendingPosts(posts);
        setTrendingHashtags(hashtags);
        setTopicGroups(topics);
        setDistricts(dists);
      } catch (err) {
        console.warn('[useDiscovery] error:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refresh = useCallback(() => fetchAll(true), [fetchAll]);

  const loadRelated = useCallback(
    async (postId: string) => {
      return getRelatedPosts(postId, 6);
    },
    [],
  );

  return {
    suggestedUsers,
    trendingPosts,
    trendingHashtags,
    topicGroups,
    districts,
    loading,
    refreshing,
    refresh,
    loadRelated,
  };
}
