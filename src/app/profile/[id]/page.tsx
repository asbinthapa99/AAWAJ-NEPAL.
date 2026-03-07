'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Post } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import FollowButton from '@/components/FollowButton';
import BlockButton from '@/components/BlockButton';
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
  Grid3X3,
  PlaySquare,
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
  const [reelCount, setReelCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editDistrict, setEditDistrict] = useState('');

  const supabase = createClient();
  const isOwnProfile = user?.id === id;

  const attachDislikeFlags = async (items: Post[]) => {
    if (!user || items.length === 0) return items;

    const postIds = items.map((post) => post.id);
    const { data, error } = await supabase
      .from('dislikes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds);

    if (error || !data) return items;

    const dislikedIds = new Set(data.map((row) => row.post_id));
    return items.map((post) => ({
      ...post,
      user_has_disliked: dislikedIds.has(post.id),
    }));
  };

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

    // Fetch user's posts (text/image only — videos appear in Reels)
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, author:profiles!author_id(*)')
      .eq('author_id', id)
      .is('deleted_at', null)
      .is('video_url', null)
      .order('created_at', { ascending: false });

    const normalizedPosts = (postsData || []).map((post: Record<string, unknown>) => ({
      ...post,
      author: Array.isArray(post.author) ? post.author[0] : post.author,
    })) as Post[];

    const hydratedPosts = await attachDislikeFlags(normalizedPosts);
    setPosts(hydratedPosts);

    // Fetch reel count for this user
    const { count: reels } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', id)
      .is('deleted_at', null)
      .not('video_url', 'is', null);
    setReelCount(reels || 0);

    // Fetch follow counts
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', id);
    setFollowerCount(followers || 0);

    const { count: followings } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', id);
    setFollowingCount(followings || 0);

    // Check if current user follows this profile
    if (user && user.id !== id) {
      const { data: followData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('follower_id', user.id)
        .eq('following_id', id)
        .single();
      setIsFollowing(!!followData);
    }

    // Check if current user has blocked this profile
    if (user && user.id !== id) {
      const { data: blockData } = await supabase
        .from('blocks')
        .select('blocker_id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', id)
        .single();
      setIsBlocked(!!blockData);
    }

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
          href="/feed"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-lg mx-auto">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 border-b border-border/40"
          style={{ background: 'hsl(var(--background)/0.9)', backdropFilter: 'blur(12px)' }}>
          <Link href="/dashboard">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <span className="font-bold text-base text-foreground truncate max-w-[200px]">
            {profile.username || profile.full_name}
          </span>
          {isOwnProfile ? (
            <button onClick={() => setEditing(!editing)}>
              <Settings className="w-5 h-5 text-foreground" />
            </button>
          ) : (
            <div className="w-5" />
          )}
        </div>

        {/* ── Profile Header ── */}
        <div className="px-6 pt-6 pb-4">
          {/* Avatar + Stats row */}
          <div className="flex items-center gap-6 mb-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-border">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.6))' }}>
                    {profile.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-1 justify-around">
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">{posts.length}</span>
                <span className="text-xs text-muted-foreground">Posts</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">{reelCount}</span>
                <span className="text-xs text-muted-foreground">Reels</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">{followerCount}</span>
                <span className="text-xs text-muted-foreground">Followers</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">{followingCount}</span>
                <span className="text-xs text-muted-foreground">Following</span>
              </div>
            </div>
          </div>

          {/* Name + bio + location */}
          <div className="mb-4">
            <p className="font-bold text-sm text-foreground">{profile.full_name}</p>
            {profile.bio && (
              <p className="text-sm text-foreground/80 mt-0.5 whitespace-pre-wrap">{profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-muted-foreground">
              {profile.district && (
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.district}</span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />Joined {formatDate(profile.created_at)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          {editing ? (
            /* ── Inline Edit Form ── */
            <div className="space-y-3 py-3 border-t border-border">
              {/* Avatar upload */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-border">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                  ) : profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <label className="text-sm font-semibold cursor-pointer px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-foreground">
                  Change photo
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const compressed = await compressImage(file, { maxWidth: 512, maxHeight: 512, quality: 0.75, mimeType: 'image/jpeg', fileName: `avatar_${Date.now()}.jpg` });
                    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                    setAvatarFile(compressed);
                    setAvatarPreview(URL.createObjectURL(compressed));
                  }} />
                </label>
              </div>

              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary" />
              <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)}
                placeholder="Bio" rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary resize-none" />
              <select value={editDistrict} onChange={(e) => setEditDistrict(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary">
                <option value="">Select district</option>
                {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>

              <div className="flex gap-2">
                <button onClick={() => setEditing(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-accent transition-colors">
                  <X className="w-4 h-4" />Cancel
                </button>
                <button onClick={handleSaveProfile} disabled={saving || !editName.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save
                </button>
              </div>

              {isOwnProfile && (
                <button onClick={handleClearCache}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors">
                  <RotateCcw className="w-4 h-4" />Clear cache &amp; sign out
                </button>
              )}
            </div>
          ) : isOwnProfile ? (
            <button onClick={() => setEditing(true)}
              className="w-full py-2 rounded-xl text-sm font-semibold border border-border hover:bg-accent transition-colors text-foreground">
              Edit profile
            </button>
          ) : (
            <div className="flex gap-2">
              <div className="flex-1">
                <FollowButton
                  targetUserId={id}
                  initialFollowing={isFollowing}
                  onToggle={(val) => { setIsFollowing(val); setFollowerCount((c) => c + (val ? 1 : -1)); }}
                />
              </div>
              <BlockButton
                targetUserId={id}
                initialBlocked={isBlocked}
                onToggle={(val) => setIsBlocked(val)}
              />
            </div>
          )}
        </div>

        {/* ── Tabs: Posts / Reels ── */}
        <div className="flex border-t border-border">
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'posts'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            POSTS
          </button>
          <button
            onClick={() => setActiveTab('reels')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors border-b-2 ${
              activeTab === 'reels'
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <PlaySquare className="w-4 h-4" />
            REELS
          </button>
        </div>

        {/* ── Posts Grid ── */}
        {activeTab === 'posts' && (
          posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <Megaphone className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {isOwnProfile ? "You haven't raised any voice yet." : 'No posts yet.'}
              </p>
              {isOwnProfile && (
                <Link href="/post/create"
                  className="mt-3 px-5 py-2 rounded-xl text-sm font-bold transition-colors"
                  style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                  Raise Your First Voice
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-px bg-border">
              {posts.map((post) => (
                <Link key={post.id} href={`/post/${post.id}`} className="relative aspect-square overflow-hidden bg-muted hover:opacity-90 transition-opacity">
                  {post.image_url ? (
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    /* Text post tile */
                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center gap-1"
                      style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.15), hsl(var(--primary)/0.05))' }}>
                      <Megaphone className="w-5 h-5 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
                      <p className="text-[10px] font-semibold text-foreground line-clamp-3 leading-tight">{post.content}</p>
                    </div>
                  )}
                  {/* Support count badge */}
                  {post.supports_count > 0 && (
                    <div className="absolute bottom-1 left-1 flex items-center gap-0.5 bg-black/50 rounded-full px-1.5 py-0.5">
                      <span className="text-white text-[9px] font-bold">♥ {post.supports_count}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )
        )}

        {/* ── Reels tab placeholder ── */}
        {activeTab === 'reels' && (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <PlaySquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {reelCount === 0
                ? (isOwnProfile ? "You haven't posted any reels yet." : 'No reels yet.')
                : `${reelCount} reel${reelCount !== 1 ? 's' : ''} — view them in the `}
              {reelCount > 0 && (
                <Link href="/reels" className="font-semibold underline" style={{ color: 'hsl(var(--primary))' }}>
                  Reels tab
                </Link>
              )}
            </p>
            {isOwnProfile && reelCount === 0 && (
              <Link href="/post/create"
                className="mt-3 px-5 py-2 rounded-xl text-sm font-bold transition-colors"
                style={{ background: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}>
                Post a Reel
              </Link>
            )}
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-20" />
      </div>
    </div>
  );
}