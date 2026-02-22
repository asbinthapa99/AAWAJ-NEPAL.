'use client';

import { useState } from 'react';
import { HandHeart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';

interface SupportButtonProps {
  postId: string;
  initialCount: number;
  initialSupported?: boolean;
}

export default function SupportButton({
  postId,
  initialCount,
  initialSupported = false,
}: SupportButtonProps) {
  const { user } = useAuth();
  const [supported, setSupported] = useState(initialSupported);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const toggleSupport = async () => {
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (supported) {
      // Remove support
      await supabase
        .from('supports')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
      setCount((prev) => Math.max(prev - 1, 0));
      setSupported(false);
    } else {
      // Add support
      await supabase
        .from('supports')
        .insert({ post_id: postId, user_id: user.id });
      setCount((prev) => prev + 1);
      setSupported(true);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={toggleSupport}
      disabled={loading}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        supported
          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <HandHeart
        className={`w-4 h-4 transition-transform ${
          supported ? 'scale-110' : ''
        }`}
        fill={supported ? 'currentColor' : 'none'}
      />
      <span>{count} Support{count !== 1 ? 's' : ''}</span>
    </button>
  );
}
