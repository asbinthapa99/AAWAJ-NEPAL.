import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { Post, Profile } from '../../src/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 2;
const GRID_COLS = 3;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
const COVER_HEIGHT = 180;
const AVATAR_SIZE = 110;
const AVATAR_BORDER = 4;

type TabType = 'posts' | 'reels';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams() as { id?: string };
  const { c } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (data) setProfile(data as Profile);
  }, [id]);

  const fetchPosts = useCallback(async () => {
    if (!id) return;

    // Regular posts (no video)
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', id)
      .is('deleted_at', null)
      .is('video_url', null)
      .order('created_at', { ascending: false });
    if (postsData) setPosts(postsData as Post[]);

    // Reels (video posts)
    const { data: reelsData } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', id)
      .is('deleted_at', null)
      .not('video_url', 'is', null)
      .order('created_at', { ascending: false });
    if (reelsData) setReels(reelsData as Post[]);
  }, [id]);

  const fetchFollowData = useCallback(async () => {
    if (!id) return;

    try {
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
      ]);
      setFollowerCount(followers || 0);
      setFollowingCount(following || 0);

      // Check if current user follows this person
      if (user && user.id !== id) {
        const { data } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', id)
          .maybeSingle();
        setIsFollowing(!!data);
      }
    } catch (e) {
      console.log('[UserProfile] follows query error:', e);
    }
  }, [id, user]);

  useEffect(() => {
    Promise.all([fetchProfile(), fetchPosts(), fetchFollowData()]).finally(() => setLoading(false));
  }, [fetchProfile, fetchPosts, fetchFollowData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchPosts(), fetchFollowData()]);
    setRefreshing(false);
  }, [fetchProfile, fetchPosts, fetchFollowData]);

  const handleFollow = async () => {
    if (!user || !id || user.id === id) return;
    setFollowLoading(true);
    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount((p) => Math.max(0, p - 1));
      const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', id);
      if (error) {
        setIsFollowing(true);
        setFollowerCount((p) => p + 1);
      }
    } else {
      setIsFollowing(true);
      setFollowerCount((p) => p + 1);
      const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: id });
      if (error) {
        setIsFollowing(false);
        setFollowerCount((p) => Math.max(0, p - 1));
      }
    }
    setFollowLoading(false);
  };

  const startConversation = async () => {
    if (!user || !profile) return;

    // Find existing conversation
    const { data: myMembers } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', user.id);
    const convIds = (myMembers || []).map((r: any) => r.conversation_id);

    for (const convId of convIds) {
      const { data: found } = await supabase
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', convId)
        .eq('user_id', profile.id);
      if (found && found.length > 0) {
        router.push(`/chat/${convId}` as any);
        return;
      }
    }

    // Create new conversation
    const { data: conv } = await supabase.from('conversations').insert({}).select('id').single();
    if (!conv) return;
    await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: profile.id },
    ]);
    router.push(`/chat/${conv.id}` as any);
  };

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const openWebsite = () => {
    if (!profile?.website) return;
    let url = profile.website;
    if (!url.startsWith('http')) url = 'https://' + url;
    Linking.openURL(url);
  };

  const activeData = activeTab === 'reels' ? reels : posts;
  const isSelf = user?.id === id;

  /* ───────── Header ───────── */
  const renderHeader = () => (
    <View>
      {/* Top bar: back + username */}
      <View style={[styles.topBar, { backgroundColor: c.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.topBarUsername, { color: c.foreground }]} numberOfLines={1}>
          {profile?.username || 'user'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Cover Image + Avatar */}
      <View style={styles.coverContainer}>
        {profile?.cover_image_url ? (
          <Image source={{ uri: profile.cover_image_url }} style={styles.coverImage} />
        ) : (
          <LinearGradient
            colors={['#6366f1', '#8b5cf6', '#a78bfa']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.coverImage}
          />
        )}
        {/* Avatar overlapping the cover */}
        <View style={[styles.avatarWrapper, { borderColor: c.background }]}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: c.muted }]}>
              <Text style={[styles.avatarLetter, { color: c.foreground }]}>
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </View>

        {/* Follow + Message buttons */}
        {!isSelf && (
          <View style={styles.coverActions}>
            <TouchableOpacity
              style={[
                styles.followBtn,
                isFollowing
                  ? { backgroundColor: c.muted, borderWidth: 1, borderColor: c.border }
                  : { backgroundColor: c.primary },
              ]}
              onPress={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={isFollowing ? c.foreground : '#fff'} />
              ) : (
                <Text style={[styles.followBtnText, { color: isFollowing ? c.foreground : '#fff' }]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.msgBtn, { backgroundColor: c.muted }]}
              onPress={startConversation}
            >
              <Ionicons name="chatbubble-outline" size={18} color={c.foreground} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Name, subtitle, bio, location, website */}
      <View style={styles.infoSection}>
        <Text style={[styles.displayName, { color: c.foreground }]}>
          {profile?.full_name || 'User'}
        </Text>
        {profile?.bio_subtitle ? (
          <Text style={[styles.bioSubtitle, { color: c.primary }]}>{profile.bio_subtitle}</Text>
        ) : null}
        {profile?.bio ? (
          <Text style={[styles.bioText, { color: c.foreground }]}>{profile.bio}</Text>
        ) : null}
        {profile?.district ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={c.mutedForeground} />
            <Text style={[styles.locationText, { color: c.mutedForeground }]}>{profile.district}</Text>
          </View>
        ) : null}
        {profile?.website ? (
          <TouchableOpacity style={styles.linkRow} onPress={openWebsite}>
            <Ionicons name="link-outline" size={14} color={c.primary} />
            <Text style={[styles.linkText, { color: c.primary }]} numberOfLines={1}>
              {profile.website}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Stats Row */}
      <View style={[styles.statsRow, { borderColor: c.border }]}>
        <View style={[styles.statBox, { borderColor: c.border }]}>
          <Text style={[styles.statNumber, { color: c.foreground }]}>{formatCount(posts.length)}</Text>
          <Text style={[styles.statLabel, { color: c.mutedForeground }]}>POSTS</Text>
        </View>
        <View style={[styles.statBox, { borderColor: c.border }]}>
          <Text style={[styles.statNumber, { color: c.foreground }]}>{formatCount(followerCount)}</Text>
          <Text style={[styles.statLabel, { color: c.mutedForeground }]}>FOLLOWERS</Text>
        </View>
        <View style={[styles.statBox]}>
          <Text style={[styles.statNumber, { color: c.foreground }]}>{formatCount(followingCount)}</Text>
          <Text style={[styles.statLabel, { color: c.mutedForeground }]}>FOLLOWING</Text>
        </View>
      </View>

      {/* Tabs: Posts / Reels */}
      <View style={[styles.tabRow, { borderBottomColor: c.border }]}>
        {(['posts', 'reels'] as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons
                name={tab === 'posts' ? 'grid-outline' : 'play-circle-outline'}
                size={20}
                color={isActive ? c.primary : c.mutedForeground}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? c.primary : c.mutedForeground },
                  isActive && { fontWeight: '700' },
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  /* ───────── Grid Tile ───────── */
  const renderTile = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={styles.tile}
      activeOpacity={0.85}
      onPress={() => router.push(`/post/${item.id}` as any)}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.tileImage} />
      ) : item.video_url ? (
        <View style={[styles.tilePlaceholder, { backgroundColor: c.muted }]}>
          <Ionicons name="play-circle" size={32} color={c.mutedForeground} />
        </View>
      ) : (
        <View style={[styles.tilePlaceholder, { backgroundColor: c.muted }]}>
          <Text
            style={{ color: c.foreground, fontSize: 11, textAlign: 'center', paddingHorizontal: 6 }}
            numberOfLines={3}
          >
            {item.content}
          </Text>
        </View>
      )}
      {item.video_url && (
        <View style={styles.reelBadge}>
          <Ionicons name="play" size={10} color="#fff" />
        </View>
      )}
      <View style={styles.tileOverlay}>
        <Ionicons name="heart" size={12} color="#fff" />
        <Text style={styles.tileCount}>{item.supports_count || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  /* ───────── Loading ───────── */
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.center}>
          <Ionicons name="person-outline" size={48} color={c.mutedForeground} />
          <Text style={{ color: c.mutedForeground, marginTop: 12 }}>User not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: c.primary, fontWeight: '600' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ───────── Main ───────── */
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <FlatList
        data={activeData}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={{ gap: GRID_GAP }}
        contentContainerStyle={{ gap: GRID_GAP, paddingBottom: 120 }}
        ListHeaderComponent={renderHeader}
        renderItem={renderTile}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name={activeTab === 'reels' ? 'videocam-outline' : 'camera-outline'}
              size={48}
              color={c.mutedForeground}
            />
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>
              {activeTab === 'reels' ? 'No reels yet' : 'No posts yet'}
            </Text>
            <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
              {activeTab === 'reels'
                ? "This user hasn't shared any reels"
                : "This user hasn't shared any posts"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  /* ── Top bar ── */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarUsername: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
    textAlign: 'center',
  },

  /* ── Cover + Avatar ── */
  coverContainer: {
    height: COVER_HEIGHT + AVATAR_SIZE / 2,
    marginBottom: 8,
  },
  coverImage: {
    width: SCREEN_WIDTH,
    height: COVER_HEIGHT,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 18,
    width: AVATAR_SIZE + AVATAR_BORDER * 2,
    height: AVATAR_SIZE + AVATAR_BORDER * 2,
    borderRadius: (AVATAR_SIZE + AVATAR_BORDER * 2) / 2,
    borderWidth: AVATAR_BORDER,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 38,
    fontWeight: '800',
  },
  coverActions: {
    position: 'absolute',
    right: 14,
    bottom: 8,
    flexDirection: 'row',
    gap: 8,
  },
  followBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  msgBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Info ── */
  infoSection: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  bioSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  bioText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  locationText: {
    fontSize: 13,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '500',
  },

  /* ── Stats ── */
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    marginHorizontal: 18,
    marginBottom: 2,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRightWidth: 0.5,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 1,
  },

  /* ── Tabs ── */
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    marginTop: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#dc2626',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },

  /* ── Grid ── */
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    position: 'relative',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tilePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  tileOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  tileCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  /* ── Empty ── */
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
