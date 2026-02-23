'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { getCategoryInfo } from '@/lib/categories';
import { URGENCY_CONFIG } from '@/lib/constants';
import { MessageCircle, Share2, Clock, MapPin, Flag, Trash2, MoreHorizontal, Globe } from 'lucide-react';
import SupportButton from './SupportButton';
import DislikeButton from './DislikeButton';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';

interface PostCardProps {
  post: Post;
  onDeleted?: (postId: string) => void;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

export default function PostCard({ post, onDeleted }: PostCardProps) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const category = getCategoryInfo(post.category);
  const urgency = URGENCY_CONFIG[post.urgency as keyof typeof URGENCY_CONFIG] ?? URGENCY_CONFIG.medium;

  const handleDelete = async () => {
    if (!user || user.id !== post.author_id || deleting) return;
    if (!window.confirm('Delete this post? This action cannot be undone.')) return;

    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) {
      alert('Failed to delete post: ' + error.message);
      setDeleting(false);
      return;
    }

    if (onDeleted) {
      onDeleted(post.id);
    } else {
      window.location.reload();
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  return (
    <article className="bg-white dark:bg-[#242526] rounded-lg shadow-sm dark:shadow-none border-none">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <Link href={`/profile/${post.author_id}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-[#1877F2] to-[#42b72a] rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity">
                {post.author?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            </Link>
            <div>
              <Link
                href={`/profile/${post.author_id}`}
                className="text-[15px] font-semibold text-gray-900 dark:text-[#e4e6eb] hover:underline"
              >
                {post.author?.full_name || 'Anonymous'}
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#b0b3b8]">
                <span>{timeAgo(post.created_at)}</span>
                <span>·</span>
                {post.district && (
                  <>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />
                      {post.district}
                    </span>
                    <span>·</span>
                  </>
                )}
                <Globe className="w-3 h-3" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Urgency Badge */}
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${urgency.bgColor} ${urgency.color}`}
            >
              {urgency.label}
            </span>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-500 dark:text-[#b0b3b8]" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-9 w-48 bg-white dark:bg-[#242526] rounded-lg shadow-lg border border-gray-200 dark:border-[#393a3b] overflow-hidden z-20">
                  <button
                    onClick={() => { setShowMenu(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-[#e4e6eb] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
                  >
                    <Flag className="w-4 h-4" /> Report post
                  </button>
                  {user?.id === post.author_id && (
                    <button
                      onClick={() => { setShowMenu(false); handleDelete(); }}
                      disabled={deleting}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Delete post
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-3 pb-0">
        {/* Category Tag */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${category.bgColor} ${category.color} mb-2`}
        >
          <span>{category.icon}</span>
          {category.label}
        </span>

        <Link href={`/post/${post.id}`}>
          <h2 className="text-[15px] font-bold text-gray-900 dark:text-[#e4e6eb] mb-1 hover:underline cursor-pointer">
            {post.title}
          </h2>
        </Link>

        <p className="text-gray-700 dark:text-[#b0b3b8] text-[15px] leading-relaxed line-clamp-3">
          {post.content}
        </p>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="mt-3">
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full max-h-[500px] object-cover"
          />
        </div>
      )}

      {/* Reaction counts */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-gray-500 dark:text-[#b0b3b8]">
        <div className="flex items-center gap-1">
          {(post.supports_count > 0) && (
            <span className="flex items-center gap-1">
              <span className="w-[18px] h-[18px] bg-[#1877F2] rounded-full flex items-center justify-center text-white text-[10px]">👍</span>
              {post.supports_count}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {post.comments_count > 0 && (
            <Link href={`/post/${post.id}`} className="hover:underline">
              {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
            </Link>
          )}
          {post.dislikes_count > 0 && (
            <span>{post.dislikes_count} dislike{post.dislikes_count !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mx-4 py-1 flex items-center border-t border-gray-200 dark:border-[#393a3b]">
        <SupportButton
          postId={post.id}
          initialCount={post.supports_count}
        />

        <DislikeButton
          postId={post.id}
          initialCount={post.dislikes_count}
        />

        <Link
          href={`/post/${post.id}`}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-gray-500 dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Comment</span>
        </Link>

        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-gray-500 dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span>Share</span>
        </button>
      </div>
    </article>
  );
}
