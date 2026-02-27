'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Post, PostCategory } from '@/lib/types';
import PostCard from '@/components/PostCard';
import CategoryFilter from '@/components/CategoryFilter';
import { Megaphone, TrendingUp, Clock, Loader2, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

type SortMode = 'latest' | 'trending';

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState<PostCategory | 'all'>('all');
  const [sort, setSort] = useState<SortMode>('latest');
  const [hasMore, setHasMore] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const insertBufferRef = useRef<Post[]>([]);
  const insertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = createClient();
  const POSTS_PER_PAGE = 15;

  const attachDislikeFlags = async (items: Post[]) => {
    if (!user || items.length === 0) return items;

    const postIds = items.map((post) => post.id);
    const { data, error } = await supabase
      .from('dislikes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds);

    if (error || !data) return items;

    const dislikedIds = new Set(data.map((row) => row.post_id));
    return items.map((post) => ({
      ...post,
      user_has_disliked: dislikedIds.has(post.id),
    }));
  };

  const fetchPosts = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);
      setFetchError('');

      let query = supabase
        .from('posts')
        .select('*, author:profiles(id, full_name, username, avatar_url)');

      if (category !== 'all') query = query.eq('category', category);

      if (sort === 'trending') {
        query = query.order('supports_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const offset = isLoadMore ? posts.length : 0;
      query = query.range(offset, offset + POSTS_PER_PAGE - 1);

      const { data, error } = await query;

      if (error) {
        console.error('Failed to fetch posts:', error);
        setFetchError('Failed to load posts: ' + error.message);
        setHasMore(false);
        return;
      }

      const normalizedData = (data || []).map((post: Record<string, unknown>) => ({
        ...post,
        author: Array.isArray(post.author) ? post.author[0] : post.author,
      })) as Post[];

      const hydratedData = await attachDislikeFlags(normalizedData);

      setPosts((prev) => (isLoadMore ? [...prev, ...hydratedData] : hydratedData));
      setHasMore(hydratedData.length >= POSTS_PER_PAGE);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setFetchError('Error loading posts: ' + (err instanceof Error ? err.message : String(err)));
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPosts([]);
    fetchPosts(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort]);

  useEffect(() => {
    if (sort !== 'latest') return;

    const channel = supabase
      .channel('feed-posts-insert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const newPost = payload.new as Post;

          if (category !== 'all' && newPost.category !== category) return;

          insertBufferRef.current.push(newPost);

          if (insertTimerRef.current) return;
          insertTimerRef.current = setTimeout(async () => {
            const buffer = [...insertBufferRef.current];
            insertBufferRef.current = [];
            insertTimerRef.current = null;

            if (buffer.length === 0) return;

            const authorIds = [...new Set(buffer.map((post) => post.author_id))];
            const { data: authors } = await supabase
              .from('profiles')
              .select('*')
              .in('id', authorIds);

            const authorMap = new Map((authors || []).map((author) => [author.id, author]));
            const hydrated = buffer.map((post) => ({
              ...post,
              author: authorMap.get(post.author_id),
              user_has_disliked: false,
            }));

            setPosts((prev) => {
              const existingIds = new Set(prev.map((post) => post.id));
              const additions = hydrated.filter((post) => !existingIds.has(post.id));
              return additions.length ? [...additions, ...prev] : prev;
            });
          }, 400);
        }
      )
      .subscribe();

    return () => {
      if (insertTimerRef.current) {
        clearTimeout(insertTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [category, sort, supabase]);

  return (
    <div className="min-h-[100dvh] bg-[#f0f2f5] dark:bg-[#18191a]">
      <div className="max-w-[680px] mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-gray-100 dark:border-[#393a3b] p-4 mb-5 hover:shadow-md transition-shadow">
          <h1 className="text-[20px] font-bold text-gray-900 dark:text-[#e4e6eb]">Public Feed</h1>
          <p className="text-[13px] text-gray-500 dark:text-[#b0b3b8] mt-0.5">Voices raised by citizens across Nepal</p>

          {/* Sort Tabs */}
          <div className="flex mt-3 pt-3 border-t border-gray-100 dark:border-[#393a3b]">
            <button
              onClick={() => setSort('latest')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${sort === 'latest'
                ? 'text-[#1877F2] bg-[#e7f3ff] dark:bg-[#263951] shadow-sm'
                : 'text-gray-500 dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
                }`}
            >
              <Clock className={`w-5 h-5 ${sort === 'latest' ? 'animate-pulse' : ''}`} />
              Latest
            </button>
            <button
              onClick={() => setSort('trending')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${sort === 'trending'
                ? 'text-[#1877F2] bg-[#e7f3ff] dark:bg-[#263951] shadow-sm'
                : 'text-gray-500 dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
                }`}
            >
              <TrendingUp className={`w-5 h-5 ${sort === 'trending' ? 'animate-pulse' : ''}`} />
              Trending
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <CategoryFilter selected={category} onChange={setCategory} />
        </div>

        {/* Posts */}
        {fetchError && (
          <div className="mb-4 px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm">
            ⚠️ {fetchError}
          </div>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#1877F2] mb-3" />
            <p className="text-sm text-gray-500 dark:text-[#b0b3b8]">Loading...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#242526] rounded-lg shadow-sm">
            <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-[#e4e6eb] mb-2">No posts yet</h3>
            <p className="text-sm text-gray-500 dark:text-[#b0b3b8] max-w-sm mx-auto mb-4">
              Be the first to raise your voice about an issue affecting Nepal.
            </p>
            {user && (
              <Link
                href="/post/create"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1877F2] text-white rounded-lg text-sm font-semibold hover:bg-[#166FE5] transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Create Post
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {hasMore && (
              <button
                onClick={() => fetchPosts(true)}
                disabled={loadingMore}
                className="w-full py-3.5 rounded-xl bg-white dark:bg-[#242526] shadow-sm border border-gray-100 dark:border-[#393a3b] text-[#1877F2] font-semibold text-sm hover:bg-gray-50 dark:hover:bg-[#3a3b3c] transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  'See More'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
