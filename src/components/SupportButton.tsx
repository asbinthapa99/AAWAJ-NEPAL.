'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';

interface FloatingHeart {
  id: number;
  x: number;
}

interface SupportButtonProps {
  postId: string;
  postAuthorId?: string;
  initialCount: number;
  initialSupported?: boolean;
}

export default function SupportButton({
  postId,
  postAuthorId,
  initialCount,
  initialSupported = false,
}: SupportButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [supported, setSupported] = useState(initialSupported);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [heartCounter, setHeartCounter] = useState(0);

  const spawnFloatingHeart = useCallback(() => {
    const id = heartCounter + 1;
    setHeartCounter(id);
    // Random slight horizontal offset
    const x = (Math.random() - 0.5) * 30;
    setFloatingHearts((prev) => [...prev, { id, x }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
    }, 900);
  }, [heartCounter]);

  const toggleSupport = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      if (supported) {
        const { error } = await supabase
          .from('supports')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) { setLoading(false); return; }
        setCount((prev) => Math.max(prev - 1, 0));
        setSupported(false);
      } else {
        const { error } = await supabase
          .from('supports')
          .insert({ post_id: postId, user_id: user.id });

        if (error) { setLoading(false); return; }
        setCount((prev) => prev + 1);
        setSupported(true);

        // Notify post author (fire-and-forget)
        if (postAuthorId && postAuthorId !== user.id) {
          supabase
            .from('notifications')
            .insert({
              to_user_id: postAuthorId,
              from_user_id: user.id,
              type: 'support',
              entity_id: postId,
            })
            .then(() => { });
        }

        // Spawn 3 floating hearts with staggered timing
        spawnFloatingHeart();
        setTimeout(() => spawnFloatingHeart(), 120);
        setTimeout(() => spawnFloatingHeart(), 260);
      }
    } catch {
      // silent
    }

    setLoading(false);
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Floating hearts */}
      {floatingHearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute pointer-events-none z-20 select-none"
          style={{
            bottom: '100%',
            left: `calc(50% + ${heart.x}px)`,
            transform: 'translateX(-50%)',
            animation: 'floatHeart 0.9s ease-out forwards',
            fontSize: '1.2rem',
            lineHeight: 1,
          }}
        >
          ❤️
        </div>
      ))}

      <button
        onClick={toggleSupport}
        disabled={loading}
        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200
          ${supported
            ? 'text-rose-500'
            : 'text-muted-foreground hover:bg-accent hover:text-rose-400'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-90'}
        `}
      >
        {/* Heart SVG */}
        <svg
          viewBox="0 0 24 24"
          className={`w-5 h-5 transition-all duration-200 ${supported ? 'scale-110 drop-shadow-sm' : ''}`}
          fill={supported ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span className="hidden sm:inline">{supported ? 'Loved' : 'Love'}</span>
        {count > 0 && (
          <span className={`text-xs font-bold ${supported ? 'text-rose-400' : 'text-muted-foreground'}`}>
            {count}
          </span>
        )}
      </button>

      {/* Keyframe injected once */}
      <style>{`
        @keyframes floatHeart {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          60%  { opacity: 0.9; transform: translateX(-50%) translateY(-38px) scale(1.3); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-65px) scale(0.7); }
        }
      `}</style>
    </div>
  );
}
