'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { Post } from '@/lib/types';
import { getCategoryInfo } from '@/lib/categories';
import { URGENCY_CONFIG } from '@/lib/constants';
import { timeAgo } from '@/lib/utils';
import { MessageCircle, Share2, MapPin, Flag, Trash2, MoreHorizontal, Repeat2, Bookmark } from 'lucide-react';
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
  const [saved, setSaved] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const category = getCategoryInfo(post.category);
  const urgency = URGENCY_CONFIG[post.urgency as keyof typeof URGENCY_CONFIG] ?? URGENCY_CONFIG.medium;

  const handleDelete = async () => {
    if (!user || user.id !== post.author_id || deleting) return;
    if (!window.confirm('Delete this post? This action cannot be undone.')) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', post.id);
    if (error) { alert('Failed to delete post: ' + error.message); setDeleting(false); return; }
    if (onDeleted) { onDeleted(post.id); } else { window.location.reload(); }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) { try { await navigator.share({ title: post.title, url }); return; } catch { /* cancelled */ } }
    try { await navigator.clipboard.writeText(url); alert('Link copied!'); } catch { window.prompt('Copy this link:', url); }
  };

  useEffect(() => {
    if (!showMenu) return;
    const closeMenu = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
        menuBtnRef.current && !menuBtnRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', closeMenu);

    // Always return cleanup correctly
    return () => {
      document.removeEventListener('mousedown', closeMenu);
    };
  }, [showMenu]);

  const toggleMenu = () => {
    if (!showMenu && menuBtnRef.current) {
      const rect = menuBtnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setShowMenu(!showMenu);
  };

  return (
    <>
      <article className="bg-card border-b border-border/50 md:rounded-2xl md:border md:border-border md:shadow-sm overflow-hidden">
        {post.repost_user && (
          <div className="px-4 pt-2.5 pb-0 flex items-center gap-2 text-xs text-muted-foreground">
            <Repeat2 className="w-3.5 h-3.5" />
            <Link href={`/profile/${post.repost_user.id}`} className="font-semibold hover:underline">{post.repost_user.full_name}</Link>
            <span>reposted</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${post.author_id}`}>
              <div className="w-9 h-9 rounded-full ring-2 ring-primary/20 overflow-hidden">
                <Avatar src={post.author?.avatar_url || undefined} fallback={post.author?.full_name || 'U'} size="sm" />
              </div>
            </Link>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <Link href={`/profile/${post.author_id}`} className="text-[13px] font-bold text-foreground hover:underline">
                  {post.author?.full_name || 'Anonymous'}
                </Link>
                <span className={cn('inline-block w-1.5 h-1.5 rounded-full', category.bgColor)} />
                <span className="text-[11px] text-muted-foreground font-medium">{category.label}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span>{timeAgo(post.created_at)}</span>
                {post.district && (<><span>·</span><span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{post.district}</span></>)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant={urgency.label === 'Critical' || urgency.label === 'High' ? 'destructive' : urgency.label === 'Low' ? 'success' : 'warning'}>{urgency.label}</Badge>
            <div className="relative">
              <button ref={menuBtnRef} onClick={toggleMenu} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-accent transition-colors">
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Image */}
        {post.image_url && (
          <Link href={`/post/${post.id}`}>
            <div className="relative bg-muted"><img src={post.image_url} alt={post.title} className="w-full max-h-[520px] object-cover" loading="lazy" /></div>
          </Link>
        )}

        {/* Action Row */}
        <div className="px-4 pt-2 flex items-center justify-between">
          <div className="flex items-center -ml-2">
            <SupportButton postId={post.id} postAuthorId={post.author_id} initialCount={post.supports_count} />
            <Link href={`/post/${post.id}`} className="flex items-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors group">
              <MessageCircle className="w-[22px] h-[22px] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            </Link>
            <button onClick={handleShare} className="flex items-center gap-1 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors group">
              <Share2 className="w-[22px] h-[22px] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
            </button>
            <RepostButton postId={post.id} postAuthorId={post.author_id} />
          </div>
          <div className="flex items-center gap-1">
            <DislikeButton postId={post.id} initialCount={post.dislikes_count} initialDisliked={post.user_has_disliked} />
            <button onClick={() => setSaved(!saved)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-all active:scale-90">
              <Bookmark className="w-[22px] h-[22px]" strokeWidth={1.5} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Likes */}
        {post.supports_count > 0 && (
          <div className="px-4 pt-1"><p className="text-[13px] font-bold text-foreground">{post.supports_count.toLocaleString()} {post.supports_count === 1 ? 'love' : 'loves'}</p></div>
        )}

        {/* Caption */}
        <div className="px-4 pt-1.5 pb-1">
          <Link href={`/post/${post.id}`}><h2 className="text-[13px] font-bold text-foreground inline hover:underline cursor-pointer">{post.title}</h2></Link>
          <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{post.content}</p>
        </div>

        {/* Comments */}
        {post.comments_count > 0 && (
          <Link href={`/post/${post.id}`} className="block px-4 pb-1">
            <span className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">View all {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}</span>
          </Link>
        )}
        <div className="h-2" />
      </article>
      {showMenu && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed w-48 bg-popover rounded-xl shadow-xl border border-border overflow-hidden z-50"
          style={{ top: menuPos.top, right: menuPos.right, animation: 'scaleIn 0.12s ease' }}
        >
          <button onClick={() => { setShowMenu(false); setShowReport(true); }} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm hover:bg-accent transition-colors">
            <Flag className="w-4 h-4" /> Report
          </button>
          {user?.id === post.author_id && (
            <button onClick={() => { setShowMenu(false); handleDelete(); }} disabled={deleting} className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>,
        document.body
      )}
      {showReport && <ReportDialog postId={post.id} onClose={() => setShowReport(false)} />}
    </>
  );
}
