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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { Post } from '../../src/lib/types';
import { timeAgo } from '../../src/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AVATAR_SIZE = 100;

type TabType = 'feed' | 'reels' | 'tagged';

export default function ProfileScreen() {
  const { c } = useTheme();
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Fetch regular posts (no video)
    const { data: postsData, error: postsErr } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(id, full_name, username, avatar_url)')
      .eq('author_id', user.id)
      .is('deleted_at', null)
      .is('video_url', null)
      .order('created_at', { ascending: false });
    if (postsErr) console.log('[Profile] posts error:', postsErr.message);
    if (postsData) setPosts(postsData as Post[]);

    // Fetch reels (video posts)
    const { data: reelsData, error: reelsErr } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', user.id)
      .is('deleted_at', null)
      .not('video_url', 'is', null)
      .order('created_at', { ascending: false });
    if (reelsErr) console.log('[Profile] reels error:', reelsErr.message);
    if (reelsData) setReels(reelsData as Post[]);

    // Fetch follower / following counts
    try {
      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
      ]);
      setFollowerCount(followers || 0);
      setFollowingCount(following || 0);
    } catch (e) {
      console.log('[Profile] follows query error:', e);
    }
  }, [user]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), refreshProfile()]);
    setRefreshing(false);
  }, [fetchData, refreshProfile]);

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const tabIcons: Record<TabType, string> = {
    feed: 'leaf-outline',
    reels: 'play-circle-outline',
    tagged: 'pricetag-outline',
  };

  /* ─── Post Card (full-width, like Dribbble) ─── */
  const renderPostCard = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={[styles.postCard, { backgroundColor: c.card, borderColor: c.border }]}
      activeOpacity={0.88}
      onPress={() => router.push(`/post/${item.id}` as any)}
    >
      {/* Card header */}
      <View style={styles.postCardHeader}>
        <View style={styles.postCardAvatarWrap}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.postCardAvatar} />
          ) : (
            <View style={[styles.postCardAvatarFb, { backgroundColor: c.muted }]}>
              <Text style={{ color: c.foreground, fontWeight: '700', fontSize: 12 }}>
                {profile?.full_name?.charAt(0) || 'U'}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.postCardName, { color: c.foreground }]}>{profile?.full_name || 'You'}</Text>
          <Text style={[styles.postCardTime, { color: c.mutedForeground }]}>{timeAgo(item.created_at)}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={18} color={c.mutedForeground} />
      </View>

      {/* Caption */}
      {item.content ? (
        <Text style={[styles.postCardCaption, { color: c.foreground }]} numberOfLines={3}>
          {item.content}
        </Text>
      ) : null}

      {/* Image */}
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.postCardImage} resizeMode="cover" />
      ) : null}

      {/* Footer metrics */}
      <View style={styles.postCardFooter}>
        <View style={styles.postCardMetric}>
          <Ionicons name="chatbubble-outline" size={16} color={c.mutedForeground} />
          <Text style={[styles.postCardMetricText, { color: c.mutedForeground }]}>{item.comments_count || 0}</Text>
        </View>
        <View style={styles.postCardMetric}>
          <Ionicons name="heart-outline" size={16} color={c.mutedForeground} />
          <Text style={[styles.postCardMetricText, { color: c.mutedForeground }]}>{item.supports_count || 0}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={16} color={c.mutedForeground} style={{ marginLeft: 'auto' }} />
      </View>
    </TouchableOpacity>
  );

  /* ─── Reel Grid Tile ─── */
  const GRID_GAP = 2;
  const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * 2) / 3;

  const renderReelTile = ({ item }: { item: Post }) => (
    <TouchableOpacity style={[styles.tile, { width: TILE_SIZE, height: TILE_SIZE }]} activeOpacity={0.85}>
      {item.video_url ? (
        <View style={[styles.tilePlaceholder, { backgroundColor: c.muted }]}>
          <Ionicons name="play-circle" size={32} color={c.mutedForeground} />
        </View>
      ) : item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.tileImage} />
      ) : (
        <View style={[styles.tilePlaceholder, { backgroundColor: c.muted }]}>
          <Text style={{ color: c.foreground, fontSize: 11, textAlign: 'center', paddingHorizontal: 6 }} numberOfLines={3}>
            {item.content}
          </Text>
        </View>
      )}
      <View style={styles.tileOverlay}>
        <Ionicons name="heart" size={12} color="#fff" />
        <Text style={styles.tileCount}>{item.supports_count || 0}</Text>
      </View>
    </TouchableOpacity>
  );

  /* ─── Header ─── */
  const renderHeader = () => (
    <View>
      {/* Top Bar: "My profile" + bell + gear */}
      <View style={[styles.topBar, { backgroundColor: c.background }]}>
        <Text style={[styles.topBarTitle, { color: c.foreground }]}>My profile</Text>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.topBarIconBtn}
            onPress={() => router.push('/(tabs)/activity' as any)}
          >
            <Ionicons name="notifications-outline" size={22} color={c.foreground} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.topBarIconBtn}
            onPress={() => router.push('/profile/settings' as any)}
          >
            <Ionicons name="settings-outline" size={22} color={c.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Centered Avatar */}
      <View style={styles.avatarSection}>
        <View style={[styles.avatarRing, { borderColor: c.border }]}>
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
      </View>

      {/* Name + Verified Badge */}
      <View style={styles.nameSection}>
        <Text style={[styles.displayName, { color: c.foreground }]}>
          {profile?.full_name || 'Your Name'}
        </Text>
        {profile?.role === 'admin' && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
          </View>
        )}
      </View>

      {/* Followers · Following */}
      <Text style={[styles.statsLine, { color: c.mutedForeground }]}>
        {formatCount(followerCount)} followers{'  '}·{'  '}{formatCount(followingCount)} following
      </Text>

      {/* Pill Tabs: Feed · Reels · Tagged */}
      <View style={styles.pillRow}>
        {(['feed', 'reels', 'tagged'] as TabType[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.pill,
                active
                  ? { backgroundColor: '#c6f740' }
                  : { backgroundColor: c.muted, borderColor: c.border, borderWidth: 1 },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons
                name={tabIcons[tab] as any}
                size={14}
                color={active ? '#000' : c.mutedForeground}
              />
              <Text
                style={[
                  styles.pillText,
                  { color: active ? '#000' : c.mutedForeground },
                  active && { fontWeight: '700' },
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

  /* ─── Loading ─── */
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const activeData = activeTab === 'reels' ? reels : posts;
  const isGrid = activeTab === 'reels' || activeTab === 'tagged';

  /* ─── Main ─── */
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {isGrid ? (
        <FlatList
          data={activeData}
          keyExtractor={(item) => item.id}
          numColumns={3}
          columnWrapperStyle={{ gap: 2 }}
          contentContainerStyle={{ gap: 2, paddingBottom: 120 }}
          ListHeaderComponent={renderHeader}
          renderItem={renderReelTile}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={activeTab === 'reels' ? 'videocam-outline' : 'pricetag-outline'}
                size={48}
                color={c.mutedForeground}
              />
              <Text style={[styles.emptyTitle, { color: c.foreground }]}>
                {activeTab === 'reels' ? 'No reels yet' : 'No tagged posts'}
              </Text>
              <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
                {activeTab === 'reels' ? 'Share your first video reel!' : 'When people tag you, it will appear here'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={activeData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListHeaderComponent={renderHeader}
          renderItem={renderPostCard}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="camera-outline" size={48} color={c.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: c.foreground }]}>No posts yet</Text>
              <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
                Share your first post with the community!
              </Text>
            </View>
          }
        />
      )}
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
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  topBarIconBtn: {
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },

  /* ── Avatar ── */
  avatarSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 14,
  },
  avatarRing: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
    borderWidth: 3,
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
    fontSize: 36,
    fontWeight: '800',
  },

  /* ── Name ── */
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  verifiedBadge: {},
  statsLine: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 20,
  },

  /* ── Pill tabs ── */
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
  },

  /* ── Post Card (Feed tab) ── */
  postCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0.5,
  },
  postCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  postCardAvatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  postCardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  postCardAvatarFb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postCardName: {
    fontSize: 14,
    fontWeight: '700',
  },
  postCardTime: {
    fontSize: 11,
  },
  postCardCaption: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  postCardImage: {
    width: '100%',
    height: SCREEN_WIDTH * 0.65,
  },
  postCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 18,
  },
  postCardMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  postCardMetricText: {
    fontSize: 13,
    fontWeight: '600',
  },

  /* ── Grid (Reels / Tagged) ── */
  tile: {
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
  tileOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tileCount: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },

  /* ── Empty ── */
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 240,
  },
});
