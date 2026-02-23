'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';

interface DislikeButtonProps {
  postId: string;
  initialCount: number;
  initialDisliked?: boolean;
}

export default function DislikeButton({
  postId,
  initialCount,
  initialDisliked = false,
}: DislikeButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [disliked, setDisliked] = useState(initialDisliked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleDislike = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    setError('');
    const supabase = createClient();

    try {
      if (disliked) {
        const { error } = await supabase
          .from('dislikes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error removing dislike:', error);
          setError('Failed to remove dislike. Please try again.');
          setLoading(false);
          return;
        }
        
        setCount((prev) => Math.max(prev - 1, 0));
        setDisliked(false);
      } else {
        const { error } = await supabase
          .from('dislikes')
          .insert({ post_id: postId, user_id: user.id });
        
        if (error) {
          console.error('Error adding dislike:', error);
          if (error.message?.includes('duplicate')) {
            setError('You already disliked this post.');
          } else {
            setError('Failed to dislike post. Please try again.');
          }
          setLoading(false);
          return;
        }
        
        setCount((prev) => prev + 1);
        setDisliked(true);
      }
    } catch (err) {
      console.error('Dislike error:', err);
      setError('An error occurred. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col">
      <button
        onClick={toggleDislike}
        disabled={loading}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
          disliked
            ? 'text-red-500'
            : 'text-gray-500 dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <ThumbsDown className="w-5 h-5" />
        <span>Dislike</span>
      </button>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400 text-center">{error}</span>
      )}
    </div>
  );
}
