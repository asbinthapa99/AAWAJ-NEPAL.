import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { Post } from '../../src/lib/types';
import PostCard from '../../src/components/PostCard';
import { useFeed } from '../../src/lib/useFeed';
import { useRef } from 'react';

const CATEGORIES = [
  { label: 'All', value: 'all', icon: '🔥' },
  { label: 'Infrastructure', value: 'infrastructure', icon: '🏗️' },
  { label: 'Education', value: 'education', icon: '📚' },
  { label: 'Health', value: 'health', icon: '🏥' },
  { label: 'Environment', value: 'environment', icon: '🌿' },
  { label: 'Governance', value: 'governance', icon: '🏛️' },
  { label: 'Safety', value: 'safety', icon: '🛡️' },
];

export default function ExploreScreen() {
  const { c } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');

  // Use centralised feed service for explore
  const feed = useFeed({
    feedType: 'explore',
    userId: user?.id,
    category: category !== 'all' ? category : null,
    searchQuery: searchQuery.trim() || null,
  });

  // Track impressions
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableItems.forEach((v) => {
        if (v.isViewable && v.item?.id) feed.trackView(v.item.id, 'explore');
      });
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50, minimumViewTime: 1000 }).current;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Search Bar */}
      <View style={[styles.searchRow, { borderBottomColor: c.border }]}>
        <View style={[styles.searchBox, { backgroundColor: c.muted }]}>
          <Ionicons name="search" size={18} color={c.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: c.foreground }]}
            placeholder="Search posts..."
            placeholderTextColor={c.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={c.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Reels Navigation Banner */}
      {!searchQuery.trim() && (
        <TouchableOpacity
          style={[styles.reelsBanner, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={() => router.push('/(tabs)/reels')}
          activeOpacity={0.8}
        >
          <View style={styles.reelsBannerLeft}>
            <Ionicons name="play-circle" size={36} color={c.primary} />
            <View>
              <Text style={[styles.reelsBannerTitle, { color: c.foreground }]}>Watch Reels</Text>
              <Text style={[styles.reelsBannerSub, { color: c.mutedForeground }]}>Discover immersive full-screen videos</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={c.mutedForeground} />
        </TouchableOpacity>
      )}

      {/* Category Chips */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setCategory(item.value)}
            style={[
              styles.chip,
              {
                backgroundColor: category === item.value ? c.primary : c.muted,
              },
            ]}
          >
            <Text style={{ fontSize: 14 }}>{item.icon}</Text>
            <Text
              style={[
                styles.chipText,
                { color: category === item.value ? '#fff' : c.foreground },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Posts */}
      {feed.loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : (
        <FlatList
          data={feed.posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} />}
          refreshControl={
            <RefreshControl refreshing={feed.refreshing} onRefresh={feed.refresh} tintColor={c.primary} />
          }
          onEndReached={feed.loadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListFooterComponent={
            feed.loadingMore ? (
              <ActivityIndicator size="small" color={c.primary} style={{ paddingVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48, marginBottom: 8 }}>🔍</Text>
              <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
                No posts found
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
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: 40,
  },
  reelsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 14,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  reelsBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reelsBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  reelsBannerSub: {
    fontSize: 13,
  },
  chipRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 15,
  },
});
