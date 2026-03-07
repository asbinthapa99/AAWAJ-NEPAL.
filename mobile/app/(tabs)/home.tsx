import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { Post } from '../../src/lib/types';
import PostCard from '../../src/components/PostCard';
import SkeletonCard from '../../src/components/SkeletonCard';
import { useRouter } from 'expo-router';
import { useFeed, type UseFeedReturn } from '../../src/lib/useFeed';
import type { FeedType } from '../../src/lib/feedService';

const FEED_TABS = [
  { label: 'For You',   feedType: 'for_you'   as FeedType },
  { label: 'Following', feedType: 'following'  as FeedType },
  { label: 'Trending',  feedType: 'trending'   as FeedType },
] as const;

export default function HomeScreen() {
  const { c, mode } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FeedType>('for_you');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Feed hook replaces all inline fetch/pagination logic ─────
  const feed = useFeed({
    feedType: activeTab,
    userId: user?.id,
    searchQuery: searchQuery.trim() || null,
  });

  // ─── Impression tracking on viewable items ─────────────────
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableItems.forEach((v) => {
        if (v.isViewable && v.item?.id) {
          feed.trackView(v.item.id);
        }
      });
    },
  ).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50, minimumViewTime: 1000 }).current;

  // Raise Issue modal state
  const [raiseIssueVisible, setRaiseIssueVisible] = useState(false);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueContent, setIssueContent] = useState('');
  const [issueCategory, setIssueCategory] = useState('other');
  const [issueUrgency, setIssueUrgency] = useState('medium');
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  const renderHeader = () => (
    <View>
      {/* App Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <View>
          <Text style={[styles.logo, { color: c.foreground }]}>GuffGaff</Text>
          <Text style={[styles.logoSub, { color: c.mutedForeground }]}>गफगाफ</Text>
        </View>
        <View style={styles.headerRight}>
          {/* Find / Explore */}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: c.muted }]}
            onPress={() => router.push('/(tabs)/explore' as any)}
          >
            <Ionicons name="search" size={18} color={c.foreground} />
          </TouchableOpacity>
          {/* Notifications */}
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: c.muted }]}
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={18} color={c.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchRow, { borderBottomColor: c.border }]}>
        <View style={[styles.searchBox, { backgroundColor: c.muted }]}>
          <Ionicons name="search" size={18} color={c.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: c.foreground }]}
            placeholder="Search GuffGaff..."
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

      {/* Create Post Strip + Raise Issue */}
      <View style={[styles.createRow, { borderBottomColor: c.border }]}>
        <TouchableOpacity
          style={[styles.createStrip, { flex: 1 }]}
          onPress={() => router.push('/(tabs)/create')}
        >
          <View style={[styles.avatar, { backgroundColor: c.muted }]}>
            <Text style={{ fontSize: 16 }}>
              {profile?.full_name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={[styles.createInput, { backgroundColor: c.muted }]}>
            <Text style={{ color: c.mutedForeground, fontSize: 16 }}>
              What's on your mind?
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.raiseIssueBtn, { backgroundColor: '#ef4444' }]}
          onPress={() => setRaiseIssueVisible(true)}
        >
          <Ionicons name="megaphone" size={16} color="#fff" />
          <Text style={styles.raiseIssueBtnText}>Raise Issue</Text>
        </TouchableOpacity>
      </View>

      {/* Feed Tabs */}
      <View style={[styles.tabRow, { backgroundColor: c.background, borderBottomColor: c.border }]}>
        {FEED_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.feedType}
            onPress={() => setActiveTab(tab.feedType)}
            style={[
              styles.tab,
              activeTab === tab.feedType && { borderBottomColor: c.primary, borderBottomWidth: 2 },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab.feedType ? c.primary : c.mutedForeground },
                activeTab === tab.feedType && { fontWeight: '700' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const ISSUE_CATEGORIES = [
    { label: 'Infrastructure', value: 'infrastructure', icon: '🏗️' },
    { label: 'Education', value: 'education', icon: '📚' },
    { label: 'Health', value: 'health', icon: '🏥' },
    { label: 'Environment', value: 'environment', icon: '🌿' },
    { label: 'Governance', value: 'governance', icon: '🏛️' },
    { label: 'Safety', value: 'safety', icon: '🛡️' },
    { label: 'Other', value: 'other', icon: '💬' },
  ];

  const URGENCY_LEVELS = [
    { label: 'Low', value: 'low', color: '#22c55e' },
    { label: 'Medium', value: 'medium', color: '#eab308' },
    { label: 'High', value: 'high', color: '#f97316' },
    { label: 'Critical', value: 'critical', color: '#ef4444' },
  ];

  const handleSubmitIssue = async () => {
    if (!issueTitle.trim() || !issueContent.trim()) {
      Alert.alert('Error', 'Please fill in the title and description');
      return;
    }
    if (!user) return;

    setIsSubmittingIssue(true);
    const { error } = await supabase.from('posts').insert({
      author_id: user.id,
      title: issueTitle.trim(),
      content: issueContent.trim(),
      category: issueCategory,
      urgency: issueUrgency,
      district: profile?.district || null,
    });
    setIsSubmittingIssue(false);

    if (error) {
      Alert.alert('Error', 'Failed to submit issue. Please try again.');
    } else {
      setIssueTitle('');
      setIssueContent('');
      setIssueCategory('other');
      setIssueUrgency('medium');
      setRaiseIssueVisible(false);
      Alert.alert('Success', 'Your issue has been raised! 📢');
      // Refresh feed
      feed.refresh();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {feed.loading ? (
        <FlatList
          data={[1, 2, 3]}
          keyExtractor={(i) => String(i)}
          renderItem={() => <SkeletonCard />}
          scrollEnabled={false}
          ListHeaderComponent={renderHeader}
        />
      ) : feed.error ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 32 }}>⚠️</Text>
          <Text style={[styles.emptyTitle, { color: c.foreground, marginTop: 8 }]}>Feed Error</Text>
          <Text style={[styles.emptyText, { color: c.mutedForeground, textAlign: 'center', paddingHorizontal: 24 }]}>
            {feed.error}
          </Text>
        </View>
      ) : (
        <FlatList
          data={feed.posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} />}
          ListHeaderComponent={renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={feed.refreshing}
              onRefresh={feed.refresh}
              tintColor={c.primary}
            />
          }
          onEndReached={feed.loadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          ListFooterComponent={
            feed.loadingMore ? (
              <ActivityIndicator
                size="small"
                color={c.primary}
                style={{ paddingVertical: 20 }}
              />
            ) : !feed.hasMore && feed.posts.length > 0 ? (
              <View style={styles.endOfFeed}>
                <Text style={[styles.endOfFeedText, { color: c.mutedForeground }]}>
                  You're all caught up 🎉
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📢</Text>
              <Text style={[styles.emptyTitle, { color: c.foreground }]}>No posts yet</Text>
              <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
                Be the first to raise your voice!
              </Text>
            </View>
          }
        />
      )}

      {/* ── Raise Issue Modal ── */}
      <Modal visible={raiseIssueVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setRaiseIssueVisible(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: c.background }]} edges={['top']}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={() => setRaiseIssueVisible(false)}>
              <Ionicons name="close" size={26} color={c.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: c.foreground }]}>Raise an Issue</Text>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: c.primary, opacity: isSubmittingIssue ? 0.5 : 1 }]}
              onPress={handleSubmitIssue}
              disabled={isSubmittingIssue}
            >
              {isSubmittingIssue ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Title */}
            <Text style={[styles.fieldLabel, { color: c.foreground }]}>Issue Title *</Text>
            <TextInput
              style={[styles.fieldInput, { backgroundColor: c.muted, color: c.foreground, borderColor: c.border }]}
              placeholder="Brief title of the issue"
              placeholderTextColor={c.mutedForeground}
              value={issueTitle}
              onChangeText={setIssueTitle}
              maxLength={120}
            />

            {/* Description */}
            <Text style={[styles.fieldLabel, { color: c.foreground }]}>Description *</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldTextArea, { backgroundColor: c.muted, color: c.foreground, borderColor: c.border }]}
              placeholder="Describe the issue in detail..."
              placeholderTextColor={c.mutedForeground}
              value={issueContent}
              onChangeText={setIssueContent}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            {/* Category */}
            <Text style={[styles.fieldLabel, { color: c.foreground }]}>Category</Text>
            <View style={styles.chipRow}>
              {ISSUE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.chip,
                    { backgroundColor: issueCategory === cat.value ? c.primary : c.muted },
                  ]}
                  onPress={() => setIssueCategory(cat.value)}
                >
                  <Text style={{ fontSize: 14 }}>{cat.icon}</Text>
                  <Text style={[styles.chipText, { color: issueCategory === cat.value ? '#fff' : c.foreground }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Urgency */}
            <Text style={[styles.fieldLabel, { color: c.foreground }]}>Urgency Level</Text>
            <View style={styles.urgencyRow}>
              {URGENCY_LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl.value}
                  style={[
                    styles.urgencyPill,
                    {
                      backgroundColor: issueUrgency === lvl.value ? lvl.color : c.muted,
                      borderColor: issueUrgency === lvl.value ? lvl.color : c.border,
                    },
                  ]}
                  onPress={() => setIssueUrgency(lvl.value)}
                >
                  <Text
                    style={[
                      styles.urgencyText,
                      { color: issueUrgency === lvl.value ? '#fff' : c.foreground },
                    ]}
                  >
                    {lvl.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Info box */}
            <View style={[styles.infoBox, { backgroundColor: c.primary + '10', borderColor: c.primary + '30' }]}>
              <Ionicons name="information-circle" size={18} color={c.primary} />
              <Text style={[styles.infoText, { color: c.mutedForeground }]}>
                Your issue will be posted publicly to raise awareness and gather community support.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endOfFeed: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  endOfFeedText: {
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  logo: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  logoSub: {
    fontSize: 11,
    marginTop: -2,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 0.5,
  },
  createStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  raiseIssueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  raiseIssueBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
  },
  // ── Raise Issue Modal ──
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  submitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 72,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 16,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  fieldTextArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  urgencyPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  urgencyText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
