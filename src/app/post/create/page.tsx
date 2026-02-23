'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { categories } from '@/lib/categories';
import { districts } from '@/lib/categories';
import { PostCategory, UrgencyLevel } from '@/lib/types';
import { URGENCY_CONFIG } from '@/lib/constants';
import {
  Megaphone,
  Loader2,
  AlertTriangle,
  MapPin,
  Tag,
} from 'lucide-react';
import Link from 'next/link';

export default function CreatePostPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PostCategory>('other');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');
  const [district, setDistrict] = useState(profile?.district || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Sign in to raise your voice
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          You need to be signed in to create a post.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex px-5 py-2.5 bg-gradient-to-r from-red-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Please fill in the title and description.');
      return;
    }

    setLoading(true);
    setError('');

    const supabase = createClient();

    // Ensure profile exists (in case trigger didn't run at signup)
    await supabase.from('profiles').upsert({
      id: user.id,
      username: user.user_metadata?.username || `user_${user.id.slice(0, 8)}`,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      district: user.user_metadata?.district || null,
    }, { onConflict: 'id', ignoreDuplicates: true });

    // Create post
    const { error: postError, data: post } = await supabase
      .from('posts')
      .insert({
        author_id: user.id,
        title: title.trim(),
        content: content.trim(),
        category,
        urgency,
        district: district || null,
        image_url: null,
      })
      .select()
      .single();

    if (postError) {
      setError(postError.message);
      setLoading(false);
    } else {
      router.push(`/post/${post.id}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          🗣️ Raise Your Voice
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Tell Nepal about a problem that needs attention
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5"
      >
        {error && (
          <div className="px-4 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Problem Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Road condition in Kathmandu is deteriorating"
            required
            maxLength={150}
            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl text-sm outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-500"
          />
          <p className="text-xs text-gray-400 mt-1">{title.length}/150</p>
        </div>

        {/* Category & Urgency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <Tag className="w-3.5 h-3.5 inline mr-1" />
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PostCategory)}
              className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl text-sm outline-none transition-colors text-gray-900 dark:text-white appearance-none"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label} ({cat.labelNp})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
              Urgency Level
            </label>
            <div className="flex gap-2">
              {(Object.keys(URGENCY_CONFIG) as UrgencyLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setUrgency(level)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    urgency === level
                      ? `${URGENCY_CONFIG[level].bgColor} ${URGENCY_CONFIG[level].color} ring-2 ring-current/20`
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {URGENCY_CONFIG[level].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* District */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <MapPin className="w-3.5 h-3.5 inline mr-1" />
            Location (Optional)
          </label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl text-sm outline-none transition-colors text-gray-900 dark:text-white appearance-none"
          >
            <option value="">Select district</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Describe the Problem *
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Provide details about the problem. What's happening? Where? How does it affect people? What should be done?"
            required
            rows={6}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl text-sm outline-none transition-colors text-gray-900 dark:text-white placeholder-gray-500 resize-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !title.trim() || !content.trim()}
          className="w-full py-3 bg-gradient-to-r from-red-500 to-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Megaphone className="w-5 h-5" />
              Publish Voice
            </>
          )}
        </button>
      </form>
    </div>
  );
}
