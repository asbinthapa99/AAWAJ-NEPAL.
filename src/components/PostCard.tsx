'use client';

import Link from 'next/link';
import { Post } from '@/lib/types';
import { getCategoryInfo } from '@/lib/categories';
import { URGENCY_CONFIG } from '@/lib/constants';
import { MessageCircle, Share2, Clock, MapPin, Volume2, Flag } from 'lucide-react';
import SupportButton from './SupportButton';

interface PostCardProps {
  post: Post;
}

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

export default function PostCard({ post }: PostCardProps) {
  const category = getCategoryInfo(post.category);
  const urgency = URGENCY_CONFIG[post.urgency];

  return (
    <article className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 shadow-sm hover:shadow-md">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${post.author_id}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity">
                {post.author?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
            </Link>
            <div>
              <Link
                href={`/profile/${post.author_id}`}
                className="text-sm font-semibold text-gray-900 dark:text-white hover:underline"
              >
                {post.author?.full_name || 'Anonymous'}
              </Link>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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

          {/* Urgency Badge */}
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${urgency.bgColor} ${urgency.color}`}
          >
            {urgency.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category Tag */}
        <div className="mb-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${category.bgColor} ${category.color}`}
          >
            <span>{category.icon}</span>
            {category.label}
          </span>
        </div>

        <Link href={`/post/${post.id}`}>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
            {post.title}
          </h2>
        </Link>

        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-3">
          {post.content}
        </p>

        {/* Voice indicator */}
        {post.voice_url && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 text-sm">
            <Volume2 className="w-4 h-4" />
            <span className="font-medium">Voice message attached</span>
          </div>
        )}

        {/* Image */}
        {post.image_url && (
          <div className="mt-3 rounded-xl overflow-hidden">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
        <div className="flex items-center gap-1">
          <SupportButton
            postId={post.id}
            initialCount={post.supports_count}
          />

          <Link
            href={`/post/${post.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.comments_count}</span>
          </Link>

          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <button className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <Flag className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}
