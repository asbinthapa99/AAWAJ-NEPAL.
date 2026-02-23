'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/lib/types';
import { getCategoryInfo } from '@/lib/categories';
import { URGENCY_CONFIG } from '@/lib/constants';
import CommentSection from '@/components/CommentSection';
import SupportButton from '@/components/SupportButton';
import DislikeButton from '@/components/DislikeButton';
import ReportDialog from '@/components/ReportDialog';
import {
  Clock,
  MapPin,
  Share2,
  Flag,
  ArrowLeft,
  Loader2,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [userSupported, setUserSupported] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPost = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, author:profiles(*)')
      .eq('id', id)
      .single();

    setPost(data);

    // Check if user has supported this post
    if (user && data) {
      const { data: support } = await supabase
        .from('supports')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', user.id)
        .single();

      setUserSupported(!!support);

      const { data: dislike } = await supabase
        .from('dislikes')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', user.id)
        .single();

      setUserDisliked(!!dislike);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Post not found
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          This post may have been removed or doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Link>
      </div>
    );
  }

  const category = getCategoryInfo(post.category);
  const urgency = URGENCY_CONFIG[post.urgency as keyof typeof URGENCY_CONFIG] ?? URGENCY_CONFIG.medium;

  const handleDelete = async () => {
    if (!user || user.id !== post.author_id) return;
    if (!window.confirm('Delete this post? This action cannot be undone.')) return;

    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) {
      alert('Failed to delete post: ' + error.message);
      return;
    }

    window.location.href = '/feed';
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to feed
      </Link>

      {/* Post */}
      <article className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${post.author_id}`}>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:opacity-90 transition-opacity">
                  {post.author?.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
              </Link>
              <div>
                <Link
                  href={`/profile/${post.author_id}`}
                  className="font-semibold text-gray-900 dark:text-white hover:underline"
                >
                  {post.author?.full_name || 'Anonymous'}
                </Link>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeAgo(post.created_at)}
                  </span>
                  {post.district && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {post.district}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${urgency.bgColor} ${urgency.color}`}
            >
              {urgency.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Category */}
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium ${category.bgColor} ${category.color} mb-3`}
          >
            <span>{category.icon}</span>
            {category.label}
          </span>

          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
            {post.title}
          </h1>

          <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Image */}
          {post.image_url && (
            <div className="mt-4 rounded-xl overflow-hidden">
              <img
                src={post.image_url}
                alt={post.title}
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
          <div className="flex items-center gap-2">
            <SupportButton
              postId={post.id}
              initialCount={post.supports_count}
              initialSupported={userSupported}
            />
            <DislikeButton
              postId={post.id}
              initialCount={post.dislikes_count}
              initialDisliked={userDisliked}
            />
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Flag className="w-4 h-4" />
              <span>Report</span>
            </button>
            {user?.id === post.author_id && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Comments */}
      <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <CommentSection postId={post.id} />
      </div>

      {/* Report Dialog */}
      {showReport && (
        <ReportDialog postId={post.id} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}
