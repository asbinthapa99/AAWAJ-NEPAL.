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
import { Avatar } from '@/components/ui/Avatar';
import { Alert } from '@/components/ui/Alert';
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
        .select('*, author:profiles!posts_author_id_fkey(id, full_name, username, avatar_url)');

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
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading...</p>
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
    <div className="min-h-[100dvh] bg-background">
      <div className="max-w-[1920px] mx-auto flex gap-0">
        {/* Left Sidebar — desktop only */}
        <div className="hidden lg:block w-[280px] flex-shrink-0 sticky top-[58px] h-[calc(100vh-58px)] overflow-y-auto p-4 pt-6">
          <div className="space-y-1">
            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-colors"
            >
              <Avatar
                src={profile?.avatar_url || undefined}
                fallback={profile?.full_name || 'U'}
                size="sm"
              />
              <span className="text-[15px] font-semibold text-foreground">
                {profile?.full_name || 'User'}
              </span>
            </Link>
            <Link
              href="/feed"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="text-[15px] font-medium text-foreground">Public Feed</span>
            </Link>
            <Link
              href="/post/create"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-success" />
              </div>
              <span className="text-[15px] font-medium text-foreground">Create Post</span>
            </Link>
            <Link
              href="/about"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-warning" />
              </div>
              <span className="text-[15px] font-medium text-foreground">About GuffGaff</span>
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Category Discussions</p>
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
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-accent text-foreground'
                    }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-[14px]">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Feed Column */}
        <div className="flex-1 max-w-[680px] mx-auto py-0 md:py-6 px-0 md:px-4">
          {/* Create Post Box — hidden on mobile, use + button in bottom nav */}
          <div className="hidden md:block">
            <CreatePostBox
              onPostCreated={() => fetchPosts()}
              onRaiseIssue={() => setShowIssueModal(true)}
            />
          </div>

          {/* Feed Section Tabs — compact on mobile */}
          <div className="sticky top-[58px] md:top-auto z-30 mb-0 md:mb-5 p-1 flex border-b md:border border-border/50 md:rounded-2xl"
            style={{ background: 'hsl(var(--background)/0.95)', backdropFilter: 'blur(12px)' }}>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeSection === s.id
                  ? 'shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
                style={activeSection === s.id ? {
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--primary))',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                } : {}}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </div>

          {/* Mobile Category Filter */}
          <div className="lg:hidden mb-0 px-3 pt-2">
            <CategoryFilter selected={category} onChange={setCategory} />
          </div>

          {/* Posts Feed */}
          {fetchError && (
            <div className="mb-4 px-3 md:px-0">
              <Alert variant="error">⚠️ {fetchError}</Alert>
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading your feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 mx-3 md:mx-0 bg-card rounded-xl shadow-sm border border-border">
              <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">No posts yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
                {category !== 'all'
                  ? 'No posts in this category. Try another or create one!'
                  : 'Be the first to raise your voice about an issue in Nepal.'}
              </p>
              <Link
                href="/post/create"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Create Post
              </Link>
            </div>
          ) : (
            <div className="space-y-0 md:space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}

              {hasMore && (
                <div className="px-3 md:px-0 py-3">
                  <button
                    onClick={() => fetchPosts(true)}
                    disabled={loadingMore}
                    className="w-full py-3.5 rounded-xl bg-card shadow-sm border border-border text-primary font-semibold text-sm hover:bg-accent transition-colors disabled:opacity-50"
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
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="hidden xl:block w-[280px] flex-shrink-0 sticky top-[58px] h-[calc(100vh-58px)] overflow-y-auto p-4 pt-6">
          {/* Community News */}
          <div className="mb-5">
            <h3 className="text-[17px] font-bold text-foreground mb-3 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" />
              Community News
            </h3>
            {newsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            ) : news.length === 0 ? (
              <p className="text-sm text-muted-foreground">No news yet.</p>
            ) : (
              <div className="space-y-3">
                {news.map((item) => (
                  <div key={item.id} className="group cursor-pointer">
                    <p className="text-[13px] font-semibold text-foreground group-hover:underline leading-snug">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {item.body}
                    </p>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-0.5 inline-block"
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
          <div className="mt-5 pt-4 border-t border-border">
            <h3 className="text-[17px] font-bold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-destructive" />
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
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-foreground hover:bg-accent'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
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
