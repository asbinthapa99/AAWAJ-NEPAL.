'use client';

import { useState, useEffect } from 'react';
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
  const [category, setCategory] = useState<PostCategory | 'all'>('all');
  const [sort, setSort] = useState<SortMode>('latest');

  const supabase = createClient();

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      let query = supabase.from('posts').select('*, author:profiles(*)');
      if (category !== 'all') query = query.eq('category', category);
      if (sort === 'trending') {
        query = query.order('supports_count', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }
      query = query.limit(50);
      const { data, error } = await query;
      if (error) console.error('Failed to fetch posts:', error.message);
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">All Issues</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Problems raised by citizens across Nepal</p>
      </div>

      <div className="mb-6 space-y-4">
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
        <CategoryFilter selected={category} onChange={setCategory} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading problems...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No problems posted yet</h3>
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
