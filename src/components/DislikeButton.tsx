'use client';

import { useState } from 'react';
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
  const [disliked, setDisliked] = useState(initialDisliked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggleDislike = async () => {
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (disliked) {
      const { error } = await supabase
        .from('dislikes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      if (!error) {
        setCount((prev) => Math.max(prev - 1, 0));
        setDisliked(false);
      }
    } else {
      const { error } = await supabase
        .from('dislikes')
        .insert({ post_id: postId, user_id: user.id });
      if (!error) {
        setCount((prev) => prev + 1);
        setDisliked(true);
      }
    }

    setLoading(false);
  };

  return (
    <button
      onClick={toggleDislike}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        disliked
          ? 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <ThumbsDown className="w-4 h-4" />
      <span>{count} Dislike{count !== 1 ? 's' : ''}</span>
    </button>
  );
}
