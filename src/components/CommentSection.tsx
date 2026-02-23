'use client';

import { useState, useEffect } from 'react';
import { Comment } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';
import { Send, Loader2, Trash2 } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    setComments(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || submitting) return;

    setSubmitting(true);

    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      author_id: user.id,
      content: content.trim(),
    });

    if (!error) {
      setContent('');
      await fetchComments();
    }

    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) {
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
        Comments ({comments.length})
      </h3>

      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold mt-1">
            {user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your comment..."
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white placeholder-gray-500 transition-all"
            />
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center">
          <a href="/auth/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Sign in
          </a>{' '}
          to comment
        </p>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
          No comments yet. Be the first to speak up!
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-3 group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
                {comment.author?.full_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {comment.author?.full_name || 'Anonymous'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {timeAgo(comment.created_at)}
                    </span>
                    {user?.id === comment.author_id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
