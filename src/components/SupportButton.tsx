'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsUp } from 'lucide-react';
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
  const router = useRouter();
  const [supported, setSupported] = useState(initialSupported);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleSupport = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    setError('');
    const supabase = createClient();

    try {
      if (supported) {
        const { error } = await supabase
          .from('supports')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error removing support:', error);
          setError('Failed to remove support. Please try again.');
          setLoading(false);
          return;
        }
        
        setCount((prev) => Math.max(prev - 1, 0));
        setSupported(false);
      } else {
        const { error } = await supabase
          .from('supports')
          .insert({ post_id: postId, user_id: user.id });
        
        if (error) {
          console.error('Error adding support:', error);
          if (error.message?.includes('duplicate')) {
            setError('You already supported this post.');
          } else {
            setError('Failed to support post. Please try again.');
          }
          setLoading(false);
          return;
        }
        
        setCount((prev) => prev + 1);
        setSupported(true);
      }
    } catch (err) {
      console.error('Support error:', err);
      setError('An error occurred. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col">
      <button
        onClick={toggleSupport}
        disabled={loading}
        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors ${
          supported
            ? 'text-[#1877F2]'
            : 'text-gray-500 dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <ThumbsUp
          className={`w-5 h-5 transition-transform ${
            supported ? 'scale-110' : ''
          }`}
          fill={supported ? 'currentColor' : 'none'}
        />
        <span>Like</span>
      </button>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400 text-center">{error}</span>
      )}
    </div>
  );
}
