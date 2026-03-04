'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Post } from '@/lib/types';
import { getCategoryInfo } from '@/lib/categories';
import { URGENCY_CONFIG } from '@/lib/constants';
import { timeAgo } from '@/lib/utils';
import { MessageCircle, Share2, MapPin, Flag, Trash2, MoreHorizontal, Globe, Repeat2 } from 'lucide-react';
import SupportButton from './SupportButton';
import DislikeButton from './DislikeButton';
import RepostButton from './RepostButton';
import ReportDialog from './ReportDialog';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';
import { cn } from '@/lib/cn';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';

interface PostCardProps {
  post: Post;
  onDeleted?: (postId: string) => void;
}

export default function PostCard({ post, onDeleted }: PostCardProps) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
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
        return;
      } catch {
        // User cancelled share dialog.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied!');
    } catch {
      window.prompt('Copy this link:', url);
    }
  };

  useEffect(() => {
    if (!showMenu) return;
    const closeMenu = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, [showMenu]);

  return (
    <>
      <article className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {/* Repost Header */}
        {post.repost_user && (
          <div className="px-4 pt-3 pb-0 flex items-center gap-2 text-sm text-muted-foreground">
            <Repeat2 className="w-4 h-4 text-success" />
            <Link href={`/profile/${post.repost_user.id}`} className="font-semibold hover:underline">
              {post.repost_user.full_name}
            </Link>
            <span>reposted</span>
            {post.repost_caption && (
              <span className="text-foreground italic truncate max-w-[200px]">
                &mdash; &ldquo;{post.repost_caption}&rdquo;
              </span>
            )}
          </div>
        )}
        {/* Header */}
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <Link href={`/profile/${post.author_id}`}>
                <Avatar
                  src={post.author?.avatar_url || undefined}
                  fallback={post.author?.full_name || 'U'}
                  size="md"
                  className="hover:opacity-90 transition-opacity cursor-pointer"
                />
              </Link>
              <div>
                <Link
                  href={`/profile/${post.author_id}`}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  {post.author?.full_name || 'Anonymous'}
                </Link>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
              <Badge variant={urgency.label === 'Critical' || urgency.label === 'High' ? 'destructive' : urgency.label === 'Low' ? 'success' : 'warning'}>
                {urgency.label}
              </Badge>
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent transition-colors focus-ring"
                  aria-label="Post options"
                >
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-9 w-48 bg-popover rounded-lg shadow-lg border border-border overflow-hidden z-20 animate-scale-in">
                    <button
                      onClick={() => { setShowMenu(false); setShowReport(true); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-popover-foreground hover:bg-accent transition-colors"
                    >
                      <Flag className="w-4 h-4" /> Report post
                    </button>
                    {user?.id === post.author_id && (
                      <button
                        onClick={() => { setShowMenu(false); handleDelete(); }}
                        disabled={deleting}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
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
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium mb-2',
              category.bgColor, category.color,
            )}
          >
            <span>{category.icon}</span>
            {category.label}
          </span>

          <Link href={`/post/${post.id}`}>
            <h2 className="text-sm font-bold text-foreground mb-1 hover:underline cursor-pointer">
              {post.title}
            </h2>
          </Link>

          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4 mt-1">
            {post.content}
          </p>
        </div>

        {/* Image */}
        {post.image_url && (
          <div className="mt-3">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full max-h-[500px] object-cover border-y border-border"
            />
          </div>
        )}

        {/* Reaction counts */}
        <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            {(post.supports_count > 0 || post.dislikes_count > 0) && (
              <span className="flex items-center gap-1.5">
                <div className="flex -space-x-1 border-r border-border pr-2">
                  {post.supports_count > 0 && <span className="relative z-10 w-[18px] h-[18px] bg-primary rounded-full flex items-center justify-center text-primary-foreground text-[10px] ring-2 ring-card shadow-sm">👍</span>}
                  {post.dislikes_count > 0 && <span className="relative z-0 w-[18px] h-[18px] bg-destructive rounded-full flex items-center justify-center text-destructive-foreground text-[10px] ring-2 ring-card shadow-sm">👎</span>}
                </div>
                <span className="font-medium">{post.supports_count + post.dislikes_count}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 font-medium">
            {post.comments_count > 0 && (
              <Link href={`/post/${post.id}`} className="hover:underline">
                {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
              </Link>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mx-2 sm:mx-4 py-1.5 flex items-center border-t border-border">
          <SupportButton
            postId={post.id}
            initialCount={post.supports_count}
          />

          <DislikeButton
            postId={post.id}
            initialCount={post.dislikes_count}
            initialDisliked={post.user_has_disliked}
          />

          <Link
            href={`/post/${post.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-accent transition-all group"
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Comment</span>
          </Link>

          <RepostButton
            postId={post.id}
            postAuthorId={post.author_id}
          />

          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-accent transition-all group"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </article>

      {/* Report Dialog — BUG FIX: was never rendered before */}
      {showReport && (
        <ReportDialog postId={post.id} onClose={() => setShowReport(false)} />
      )}
    </>
  );
}
