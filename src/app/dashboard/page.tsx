'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import PostCard from '@/components/PostCard';
import CategoryFilter from '@/components/CategoryFilter';
import CreatePostBox from '@/components/CreatePostBox';
import RaiseIssueModal from '@/components/RaiseIssueModal';
import { Post, PostCategory, News } from '@/lib/types';
import {
  Megaphone,
  TrendingUp,
  Clock,
  PlusCircle,
  Loader2,
  Newspaper,
  Users,
  Flame,
  Coins,
} from 'lucide-react';

type FeedSection = 'for-you' | 'trending' | 'latest';

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState<PostCategory | 'all'>('all');
  const [activeSection, setActiveSection] = useState<FeedSection>('for-you');
  const [hasMore, setHasMore] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [news, setNews] = useState<News[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [goldItems, setGoldItems] = useState<{ id: number; label: string; value: string }[]>([]);
  const [goldUpdatedAt, setGoldUpdatedAt] = useState<string>('');
  const [goldLoading, setGoldLoading] = useState(true);
  const [goldError, setGoldError] = useState('');
  const [showIssueModal, setShowIssueModal] = useState(false);

  const insertBufferRef = useRef<Post[]>([]);
  const insertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth/login?next=/dashboard');
    }
  }, [authLoading, user, router]);

  const fetchPosts = async (isLoadMore = false) => {
    if (!user) return;
    try {
      if (!isLoadMore) setLoading(true);
      else setLoadingMore(true);
      setFetchError('');

      let query = supabase
        .from('posts')
        .select('*, author:profiles(id, full_name, username, avatar_url)');

      if (category !== 'all') query = query.eq('category', category);

      if (activeSection === 'trending' || activeSection === 'for-you') {
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

  const fetchNews = async () => {
    setNewsLoading(true);
    const { data } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    setNews(data || []);
    setNewsLoading(false);
  };

  useEffect(() => {
    if (user) {
      setPosts([]);
      fetchPosts(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, activeSection, user]);

  useEffect(() => {
    if (user) fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const fetchGoldPrice = async () => {
      setGoldLoading(true);
      setGoldError('');
      try {
        const response = await fetch('/api/gold-price');
        if (!response.ok) throw new Error('Request failed');
        const data = await response.json();
        if (!active) return;
        setGoldItems(Array.isArray(data?.items) ? data.items : []);
        setGoldUpdatedAt(data?.updated_at ?? '');
      } catch (error) {
        if (!active) return;
        setGoldError('Unable to fetch gold prices right now.');
        setGoldItems([]);
      } finally {
        if (!active) return;
        setGoldLoading(false);
      }
    };

    fetchGoldPrice();
    const interval = setInterval(fetchGoldPrice, 5 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('posts-insert')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const newPost = payload.new as Post;

          if (activeSection !== 'for-you') return;
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
  }, [activeSection, category, supabase, user]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1877F2] mb-3" />
        <p className="text-sm text-gray-500 dark:text-[#b0b3b8]">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  const sections: { id: FeedSection; label: string; icon: React.ElementType }[] = [
    { id: 'for-you', label: 'For You', icon: Flame },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'latest', label: 'Latest', icon: Clock },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#f0f2f5] dark:bg-[#18191a]">
      <div className="max-w-[1920px] mx-auto flex gap-0">
        {/* Left Sidebar */}
        <div className="hidden lg:block w-[280px] flex-shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto p-4 pt-6">
          <div className="space-y-1">
            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/60 dark:hover:bg-[#3a3b3c] transition-colors"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-[#1877F2] to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {profile?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-[15px] font-semibold text-gray-900 dark:text-[#e4e6eb]">
                {profile?.full_name || 'User'}
              </span>
            </Link>
            <Link
              href="/feed"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/60 dark:hover:bg-[#3a3b3c] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] flex items-center justify-center">
                <Users className="w-5 h-5 text-[#1877F2]" />
              </div>
              <span className="text-[15px] font-medium text-gray-800 dark:text-[#e4e6eb]">Public Feed</span>
            </Link>
            <Link
              href="/post/create"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/60 dark:hover:bg-[#3a3b3c] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-[#42b72a]" />
              </div>
              <span className="text-[15px] font-medium text-gray-800 dark:text-[#e4e6eb]">Create Post</span>
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/60 dark:hover:bg-[#3a3b3c] transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-[15px] font-medium text-gray-800 dark:text-[#e4e6eb]">About GuffGaff</span>
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#393a3b]">
            <p className="px-3 text-xs font-semibold text-gray-500 dark:text-[#b0b3b8] uppercase tracking-wide mb-2">Category Discussions</p>
            <div className="space-y-0.5">
              {[
                { label: 'Infrastructure', icon: '🏗️', cat: 'infrastructure' as PostCategory },
                { label: 'Education', icon: '📚', cat: 'education' as PostCategory },
                { label: 'Health', icon: '🏥', cat: 'health' as PostCategory },
                { label: 'Environment', icon: '🌿', cat: 'environment' as PostCategory },
                { label: 'Governance', icon: '🏛️', cat: 'governance' as PostCategory },
                { label: 'Safety', icon: '🛡️', cat: 'safety' as PostCategory },
              ].map((item) => (
                <button
                  key={item.cat}
                  onClick={() => { setCategory(item.cat); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left transition-colors font-medium ${category === item.cat
                    ? 'bg-gradient-to-r from-[#e7f3ff] to-transparent dark:from-[#263951] text-[#1877F2]'
                    : 'hover:bg-white/60 dark:hover:bg-[#3a3b3c] text-gray-700 dark:text-[#e4e6eb]'
                    }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[14px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#393a3b]">
            <div className="flex items-center gap-2 px-3 mb-2">
              <Coins className="w-4 h-4 text-[#1877F2]" />
              <p className="text-xs font-semibold text-gray-500 dark:text-[#b0b3b8] uppercase tracking-wide">Gold Prices</p>
            </div>
            <div className="mx-3 rounded-lg bg-white/80 dark:bg-[#242526] border border-gray-200 dark:border-[#393a3b] p-3 text-xs">
              {goldUpdatedAt && (
                <p className="text-[11px] text-gray-400 dark:text-[#b0b3b8] mb-2">Updated: {goldUpdatedAt}</p>
              )}
              {goldLoading ? (
                <div className="flex items-center gap-2 text-gray-500 dark:text-[#b0b3b8]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...
                </div>
              ) : goldError ? (
                <p className="text-red-500">{goldError}</p>
              ) : goldItems.length === 0 ? (
                <p className="text-gray-500 dark:text-[#b0b3b8]">No data.</p>
              ) : (
                <div className="space-y-2">
                  {goldItems.slice(0, 4).map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-[#e4e6eb]">{item.label}</span>
                      <span className="font-semibold text-gray-900 dark:text-[#e4e6eb]">{item.value || '--'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Feed Column */}
        <div className="flex-1 max-w-[680px] mx-auto py-6 px-4">
          {/* Create Post Box */}
          <CreatePostBox
            onPostCreated={() => fetchPosts()}
            onRaiseIssue={() => setShowIssueModal(true)}
          />

          {/* Feed Section Tabs */}
          <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-gray-100 dark:border-[#393a3b] mb-5 p-1 flex">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${activeSection === s.id
                  ? 'text-[#1877F2] bg-[#e7f3ff] dark:bg-[#263951] shadow-sm'
                  : 'text-gray-500 dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
                  }`}
              >
                <s.icon className={`w-5 h-5 ${activeSection === s.id ? 'animate-pulse' : ''}`} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Mobile Category Filter */}
          <div className="lg:hidden mb-4">
            <CategoryFilter selected={category} onChange={setCategory} />
          </div>

          {/* Posts Feed */}
          {fetchError && (
            <div className="mb-4 px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm">
              ⚠️ {fetchError}
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-[#1877F2] mb-3" />
              <p className="text-sm text-gray-500 dark:text-[#b0b3b8]">Loading your feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#242526] rounded-lg shadow-sm">
              <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-[#e4e6eb] mb-2">No posts yet</h3>
              <p className="text-sm text-gray-500 dark:text-[#b0b3b8] max-w-sm mx-auto mb-4">
                {category !== 'all'
                  ? 'No posts in this category. Try another or create one!'
                  : 'Be the first to raise your voice about an issue in Nepal.'}
              </p>
              <Link
                href="/post/create"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1877F2] text-white rounded-lg text-sm font-semibold hover:bg-[#166FE5] transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Create Post
              </Link>
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

        {/* Right Sidebar */}
        <div className="hidden xl:block w-[280px] flex-shrink-0 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto p-4 pt-6">
          {/* Community News */}
          <div className="mb-5">
            <h3 className="text-[17px] font-bold text-gray-900 dark:text-[#e4e6eb] mb-3 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[#1877F2]" />
              Community News
            </h3>
            {newsLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-[#b0b3b8]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : news.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-[#b0b3b8]">No news yet.</p>
            ) : (
              <div className="space-y-3">
                {news.map((item) => (
                  <div
                    key={item.id}
                    className="group cursor-pointer"
                  >
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-[#e4e6eb] group-hover:underline leading-snug">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#b0b3b8] mt-0.5 line-clamp-2">
                      {item.body}
                    </p>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#1877F2] hover:underline mt-0.5 inline-block"
                      >
                        Read more
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending Topics */}
          <div className="mt-5 pt-4 border-t border-gray-200 dark:border-[#393a3b]">
            <h3 className="text-[17px] font-bold text-gray-900 dark:text-[#e4e6eb] mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              Trending Topics
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '🏗️ Infrastructure', cat: 'infrastructure' as PostCategory },
                { label: '📚 Education', cat: 'education' as PostCategory },
                { label: '🏥 Health', cat: 'health' as PostCategory },
                { label: '🌿 Environment', cat: 'environment' as PostCategory },
                { label: '💼 Employment', cat: 'employment' as PostCategory },
                { label: '👥 Social', cat: 'social' as PostCategory },
                { label: '🎭 Culture', cat: 'culture' as PostCategory },
                { label: '💻 Tech', cat: 'technology' as PostCategory },
              ].map((item) => (
                <button
                  key={item.cat}
                  onClick={() => { setCategory(item.cat); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${category === item.cat
                    ? 'bg-[#e7f3ff] dark:bg-[#263951] text-[#1877F2]'
                    : 'bg-[#f0f2f5] dark:bg-[#3a3b3c] text-gray-700 dark:text-[#e4e6eb] hover:bg-[#e4e6eb] dark:hover:bg-[#4e4f50]'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-[#393a3b]">
            <p className="text-xs text-gray-400 dark:text-[#b0b3b8]">
              GuffGaff · 2025 · <Link href="/privacy" className="hover:underline">Privacy</Link> · <Link href="/terms" className="hover:underline">Terms</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Raise Issue Modal */}
      {showIssueModal && (
        <RaiseIssueModal
          onClose={() => setShowIssueModal(false)}
          onCreated={() => fetchPosts()}
        />
      )}
    </div>
  );
}
