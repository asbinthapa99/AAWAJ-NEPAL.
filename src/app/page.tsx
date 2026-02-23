'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Post, PostCategory } from '@/lib/types';
import PostCard from '@/components/PostCard';
import CategoryFilter from '@/components/CategoryFilter';
import { APP_NAME, APP_NAME_NP } from '@/lib/constants';
import { Megaphone, TrendingUp, Clock, Loader2, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import NepalFlag3D from '@/components/NepalFlag3D';

type SortMode = 'latest' | 'trending';

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<PostCategory | 'all'>('all');
  const [sort, setSort] = useState<SortMode>('latest');

  const supabase = createClient();

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort]);

  const fetchPosts = async () => {
    setLoading(true);

    let query = supabase
      .from('posts')
      .select('*, author:profiles(*)');

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    if (sort === 'trending') {
      query = query.order('supports_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    query = query.limit(50);

    const { data, error } = await query;
    if (error) {
      console.error('Failed to fetch posts:', error.message);
    }
    setPosts(data || []);
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Hero Section */}
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white via-red-50/30 to-blue-50/30 dark:from-gray-900 dark:via-red-950/20 dark:to-blue-950/20 animate-hero-glow">
        <div className="flex flex-col md:flex-row items-center gap-6 p-6 md:p-10">
          {/* Text Content */}
          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm font-medium mb-4 animate-hero-fade-up">
              <Megaphone className="w-4 h-4" />
              <span>Voice of Nepali Youth</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight animate-hero-fade-up-delay">
              {APP_NAME}{' '}
              <span className="text-xl md:text-2xl text-gray-400">({APP_NAME_NP})</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg animate-hero-fade-up-delay-2">
              Raise your voice about the problems affecting Nepal. Together we can make a difference.
              <br />
              <span className="text-sm">नेपालमा भइरहेका समस्याहरूमा आफ्नो आवाज उठाउनुहोस्।</span>
            </p>

            {user && (
              <Link
                href="/post/create"
                className="inline-flex items-center gap-2 mt-5 px-6 py-3 bg-gradient-to-r from-red-500 to-blue-600 text-white rounded-2xl font-semibold hover:scale-105 hover:shadow-xl transition-all duration-300 shadow-lg shadow-red-500/20 text-sm animate-hero-fade-up-delay-3"
              >
                <PlusCircle className="w-5 h-5" />
                Raise Your Voice
              </Link>
            )}
          </div>

          {/* 3D Flag */}
          <div className="w-48 h-64 md:w-56 md:h-72 flex-shrink-0 animate-hero-scale-in">
            <NepalFlag3D />
          </div>
        </div>

        {/* Background decorative blobs */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-200/20 dark:bg-red-800/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-blue-200/20 dark:bg-blue-800/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Sort Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSort('latest')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              sort === 'latest'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            Latest
          </button>
          <button
            onClick={() => setSort('trending')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              sort === 'trending'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Trending
          </button>
        </div>

        {/* Category Filter */}
        <CategoryFilter selected={category} onChange={setCategory} />
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading problems...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            No problems posted yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-4">
            Be the first to raise your voice about an issue affecting Nepal.
          </p>
          {user && (
            <Link
              href="/post/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <PlusCircle className="w-4 h-4" />
              Create First Post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
