'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Post } from '@/lib/types';
import { Heart, MessageCircle, Share2, Bookmark, Volume2, VolumeX, Play, Loader2, Film } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { Avatar } from '@/components/ui/Avatar';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export default function ReelsPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // ── Fetch reels (video-only posts) ────────────────────────────────────────
  const fetchReels = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(id, full_name, username, avatar_url)')
      .is('deleted_at', null)
      .not('video_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error && data) setReels(data as Post[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchReels(); }, [fetchReels]);

  // ── IntersectionObserver: play/pause the video that's in view ────────────
  useEffect(() => {
    if (reels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute('data-index'));
          const video = videoRefs.current[idx];
          if (!video) return;

          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            setActiveIndex(idx);
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    cardRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, [reels]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black gap-3">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <p className="text-white/60 text-sm">Loading reels…</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black gap-4">
        <Film className="w-16 h-16 text-white/30" />
        <p className="text-white text-xl font-bold">No reels yet</p>
        <p className="text-white/50 text-sm">Be the first to post a video!</p>
        {user && (
          <Link
            href="/post/create"
            className="mt-2 px-6 py-2.5 rounded-full text-sm font-bold text-black bg-white hover:bg-white/90 transition"
          >
            + Create Reel
          </Link>
        )}
      </div>
    );
  }

  return (
    // Full-screen black container, snap-scroll like TikTok
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black hide-scrollbar"
      style={{ scrollbarWidth: 'none' }}
    >
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      {reels.map((reel, index) => (
        <ReelItem
          key={reel.id}
          reel={reel}
          index={index}
          isActive={index === activeIndex}
          cardRef={(el) => { cardRefs.current[index] = el; }}
          videoRef={(el) => { videoRefs.current[index] = el; }}
          user={user}
          supabase={supabase}
        />
      ))}
    </div>
  );
}

// ── Single reel card ──────────────────────────────────────────────────────────
interface ReelItemProps {
  reel: Post;
  index: number;
  isActive: boolean;
  cardRef: (el: HTMLDivElement | null) => void;
  videoRef: (el: HTMLVideoElement | null) => void;
  user: { id: string } | null;
  supabase: ReturnType<typeof createClient>;
}

function ReelItem({ reel, index, isActive, cardRef, videoRef, user, supabase }: ReelItemProps) {
  const [muted, setMuted] = useState(true); // muted by default so browser allows autoplay
  const [playing, setPlaying] = useState(false);
  const [loved, setLoved] = useState(false);
  const [loveCount, setLoveCount] = useState(reel.supports_count ?? 0);
  const [saved, setSaved] = useState(false);
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);

  // Unmute automatically when the reel becomes active (after first tap/click)
  useEffect(() => {
    if (!isActive) return;
    const vid = internalVideoRef.current;
    if (!vid) return;
    vid.play().catch(() => {});
    setPlaying(true);
  }, [isActive]);

  const handleVideoClick = () => {
    const vid = internalVideoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play();
      setPlaying(true);
    } else {
      vid.pause();
      setPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const vid = internalVideoRef.current;
    if (!vid) return;
    vid.muted = !muted;
    setMuted(!muted);
  };

  const handleLove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (loved) {
      setLoved(false);
      setLoveCount((c) => Math.max(0, c - 1));
      await supabase.from('supports').delete().eq('post_id', reel.id).eq('user_id', user.id);
    } else {
      setLoved(true);
      setLoveCount((c) => c + 1);
      await supabase.from('supports').upsert({ post_id: reel.id, user_id: user.id });
    }
  };

  const fmt = (n: number) => n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
    : n >= 1_000 ? (n / 1_000).toFixed(1) + 'k'
      : String(n);

  return (
    <div
      ref={cardRef}
      data-index={index}
      className="relative w-full h-screen snap-start snap-always flex items-center justify-center bg-black overflow-hidden"
      onClick={handleVideoClick}
      style={{ cursor: 'pointer' }}
    >
      {/* ── Video ── */}
      <video
        ref={(el) => {
          internalVideoRef.current = el;
          videoRef(el);
        }}
        src={reel.video_url!}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        playsInline
        muted={muted}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* ── Dark gradient overlays ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30 pointer-events-none" />

      {/* ── Play/Pause icon flash ── */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}

      {/* ── Mute button (top right) ── */}
      <button
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm border border-white/10"
        onClick={toggleMute}
      >
        {muted
          ? <VolumeX className="w-5 h-5 text-white" />
          : <Volume2 className="w-5 h-5 text-white" />
        }
      </button>

      {/* ── Right action bar ── */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
        {/* Love */}
        <button className="flex flex-col items-center gap-1" onClick={handleLove}>
          <div className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-90',
            loved ? 'bg-rose-500/20' : 'bg-black/30'
          )}>
            <Heart
              className={cn('w-6 h-6 transition-colors', loved ? 'text-rose-500 fill-rose-500' : 'text-white')}
            />
          </div>
          <span className="text-white text-xs font-bold drop-shadow">{fmt(loveCount)}</span>
        </button>

        {/* Comments */}
        <Link href={`/post/${reel.id}`} className="flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <div className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-bold drop-shadow">{fmt(reel.comments_count ?? 0)}</span>
        </Link>

        {/* Share */}
        <button
          className="flex flex-col items-center gap-1"
          onClick={async (e) => {
            e.stopPropagation();
            if (navigator.share) {
              await navigator.share({ url: `${window.location.origin}/post/${reel.id}` }).catch(() => {});
            } else {
              await navigator.clipboard.writeText(`${window.location.origin}/post/${reel.id}`);
            }
          }}
        >
          <div className="w-11 h-11 rounded-full bg-black/30 flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs font-bold drop-shadow">Share</span>
        </button>

        {/* Save */}
        <button
          className="flex flex-col items-center gap-1"
          onClick={(e) => { e.stopPropagation(); setSaved((s) => !s); }}
        >
          <div className={cn('w-11 h-11 rounded-full flex items-center justify-center', saved ? 'bg-yellow-500/20' : 'bg-black/30')}>
            <Bookmark className={cn('w-6 h-6', saved ? 'text-yellow-400 fill-yellow-400' : 'text-white')} />
          </div>
        </button>

        {/* Author avatar */}
        <Link href={`/profile/${reel.author?.id}`} onClick={(e) => e.stopPropagation()}>
          <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-white">
            <Avatar
              src={reel.author?.avatar_url || undefined}
              fallback={reel.author?.full_name || 'U'}
              size="sm"
            />
          </div>
        </Link>
      </div>

      {/* ── Bottom info ── */}
      <div className="absolute bottom-6 left-4 right-20 z-20 pointer-events-none">
        <Link
          href={`/profile/${reel.author?.id}`}
          className="flex items-center gap-2 mb-2 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-white font-bold text-base drop-shadow">
            @{reel.author?.username || reel.author?.full_name || 'unknown'}
          </span>
          <span className="text-white/60 text-xs capitalize">· {reel.category}</span>
        </Link>
        <p className="text-white text-sm leading-5 line-clamp-2 drop-shadow">
          {reel.content}
        </p>
      </div>
    </div>
  );
}
