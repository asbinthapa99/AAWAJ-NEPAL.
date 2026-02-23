'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Post } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import PostCard from '@/components/PostCard';
import { compressImage } from '@/lib/image';
import {
  MapPin,
  Calendar,
  Loader2,
  Settings,
  Megaphone,
  ArrowLeft,
  Save,
  X,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { districts } from '@/lib/categories';

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export default function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, refreshProfile, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editDistrict, setEditDistrict] = useState('');

  const supabase = createClient();
  const isOwnProfile = user?.id === id;

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProfile = async () => {
    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    setProfile(profileData);

    if (profileData) {
      setEditName(profileData.full_name);
      setEditBio(profileData.bio || '');
      setEditDistrict(profileData.district || '');
    }

    // Fetch user's posts
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, author:profiles(*)')
      .eq('author_id', id)
      .order('created_at', { ascending: false });

    setPosts(postsData || []);
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user || !isOwnProfile) return;

    setSaving(true);

    let avatar_url = profile?.avatar_url ?? null;
    if (avatarFile) {
      const fileName = `avatar_${user.id}_${Date.now()}.jpg`;
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          contentType: avatarFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Failed to upload avatar:', uploadError.message);
        setSaving(false);
        return;
      }

      if (data) {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(data.path);
        avatar_url = urlData.publicUrl;
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editName.trim(),
        bio: editBio.trim() || null,
        district: editDistrict || null,
        avatar_url,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to save profile:', error.message);
      setSaving(false);
      return;
    }

    await refreshProfile();
    await fetchProfile();
    setEditing(false);
    setSaving(false);
  };

  const handleClearCache = async () => {
    if (!isOwnProfile) return;

    try {
      await signOut();
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          User not found
        </h2>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm mb-6">
        {/* Cover gradient */}
        <div className="h-32 bg-gradient-to-r from-red-500 via-purple-500 to-blue-600" />

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="w-24 h-24 rounded-2xl border-4 border-white dark:border-gray-900 shadow-lg overflow-hidden bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-3xl font-bold">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.full_name[0]?.toUpperCase() || 'U'
              )}
            </div>

            {isOwnProfile && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            /* Edit Form */
            <div className="space-y-4">
              {isOwnProfile && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profile Photo
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <ImageIcon className="w-4 h-4" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const compressed = await compressImage(file, {
                            maxWidth: 512,
                            maxHeight: 512,
                            quality: 0.75,
                            mimeType: 'image/jpeg',
                            fileName: `avatar_${Date.now()}.jpg`,
                          });

                          if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                          setAvatarFile(compressed);
                          setAvatarPreview(URL.createObjectURL(compressed));
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl text-sm outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl text-sm outline-none text-gray-900 dark:text-white resize-none placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  District
                </label>
                <select
                  value={editDistrict}
                  onChange={(e) => setEditDistrict(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-blue-500 rounded-xl text-sm outline-none text-gray-900 dark:text-white appearance-none"
                >
                  <option value="">Select district</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || !editName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>
            </div>
          ) : (
            /* Profile Info */
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">
                {profile.full_name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{profile.username}
              </p>

              {profile.bio && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  {profile.bio}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                {profile.district && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.district}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDate(profile.created_at)}
                </span>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {posts.length}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Voices Raised
                  </p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {posts.reduce((sum, p) => sum + p.supports_count, 0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Total Supports
                  </p>
                </div>
              </div>

              {isOwnProfile && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleClearCache}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Clear cache and sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User's Posts */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Megaphone className="w-5 h-5" />
          Voices Raised ({posts.length})
        </h2>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <Megaphone className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isOwnProfile
              ? "You haven't raised any voice yet."
              : 'This user hasn\'t posted anything yet.'}
          </p>
          {isOwnProfile && (
            <Link
              href="/post/create"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-gradient-to-r from-red-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Raise Your First Voice
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
