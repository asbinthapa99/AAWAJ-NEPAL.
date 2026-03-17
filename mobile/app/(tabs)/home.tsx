import React, { useState, useRef } from 'react';
import { BlurView } from 'expo-blur';
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
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import PostCard from '../../src/components/PostCard';
import SkeletonCard from '../../src/components/SkeletonCard';
import { useRouter } from 'expo-router';
import { useFeed } from '../../src/lib/useFeed';
import type { FeedType } from '../../src/lib/feedService';

const FEED_TABS = [
  { label: 'For You', feedType: 'for_you' as FeedType },
  { label: 'Following', feedType: 'following' as FeedType },
  { label: 'Trending', feedType: 'trending' as FeedType },
] as const;

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

export default function HomeScreen() {
  const { c, mode } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FeedType>('for_you');
  const [searchQuery, setSearchQuery] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  // Scroll animation value
  const scrollY = useRef(new Animated.Value(0)).current;

  // Interpolations for hiding header elements
  const tabHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [45, 0],
    extrapolate: 'clamp',
  });

  const tabOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const notifWidth = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [36, 0], // Initial width of iconBtn is 36
    extrapolate: 'clamp',
  });
  
  const notifMargin = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [8, 0],
    extrapolate: 'clamp',
  });

  const feed = useFeed({
    feedType: activeTab,
    userId: user?.id,
    searchQuery: searchQuery.trim() || null,
  });

  // Impression tracking — use a ref so the callback always gets the latest feed
  const trackViewRef = useRef(feed.trackView);
  trackViewRef.current = feed.trackView;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableItems.forEach((v) => {
        if (v.isViewable && v.item?.id) {
          trackViewRef.current(v.item.id);
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
  const [issueImageUri, setIssueImageUri] = useState<string | null>(null);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  // Tap logo → scroll to top and refresh
  const handleLogoTap = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setTimeout(() => {
      feed.refresh();
    }, 300);
  };

  // Pick image for raise issue
  const pickIssueImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setIssueImageUri(result.assets[0].uri);
    }
  };

  const handleSubmitIssue = async () => {
    if (!issueTitle.trim() || !issueContent.trim()) {
      Alert.alert('Error', 'Please fill in the title and description');
      return;
    }
    if (!user) return;

    setIsSubmittingIssue(true);

    let image_url: string | null = null;

    // Upload image if selected
    if (issueImageUri) {
      try {
        const manipulated = await manipulateAsync(issueImageUri, [], {
          compress: 0.85,
          format: SaveFormat.JPEG,
        });

        const response = await fetch(manipulated.uri);
        const blob = await response.blob();
        const fileName = `issue_${user.id}_${Date.now()}.jpg`;

        const { data, error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

        if (uploadError) {
          console.log('[Issue Upload] error:', uploadError.message);
          Alert.alert('Upload Error', uploadError.message);
          setIsSubmittingIssue(false);
          return;
        } else if (data) {
          const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(data.path);
          image_url = urlData.publicUrl;
        }
      } catch (e: any) {
        console.log('[Issue Upload] exception:', e.message);
        Alert.alert('Upload Error', 'Failed to process image');
        setIsSubmittingIssue(false);
        return;
      }
    }

    const { error } = await supabase.from('posts').insert({
      author_id: user.id,
      title: issueTitle.trim(),
      content: issueContent.trim(),
      category: issueCategory,
      urgency: issueUrgency,
      district: profile?.district || null,
      image_url,
    });
    setIsSubmittingIssue(false);

    if (error) {
      Alert.alert('Error', 'Failed to submit issue. Please try again.');
    } else {
      setIssueTitle('');
      setIssueContent('');
      setIssueCategory('other');
      setIssueUrgency('medium');
      setIssueImageUri(null);
      setRaiseIssueVisible(false);
      Alert.alert('Success', 'Your issue has been raised! 📢');
      feed.refresh();
    }
  };

  // ─── Render functions (NOT components to avoid re-mount issues) ────

  const renderStickyHeader = () => (
    <View style={[styles.stickyHeaderContainer, { shadowColor: mode === 'dark' ? '#000' : '#888' }]}>
      <BlurView
        tint={mode === 'dark' ? 'dark' : 'prominent'}
        intensity={90}
        style={styles.stickyHeader}
      >
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Top Row: Logo + Action Buttons */}
        <View style={[styles.topRow, { borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={handleLogoTap} activeOpacity={0.7}>
            <Text style={[styles.logo, { color: c.foreground }]}>GuffGaff</Text>
            <Text style={[styles.logoSub, { color: c.mutedForeground }]}>गफगाफ</Text>
          </TouchableOpacity>
          <View style={[styles.headerRight, { gap: 0 }]}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: c.muted }]}
              onPress={() => router.push('/(tabs)/explore' as any)}
            >
              <Ionicons name="search" size={18} color={c.foreground} />
            </TouchableOpacity>

            <Animated.View style={{ width: notifWidth, opacity: tabOpacity, marginLeft: notifMargin, overflow: 'hidden' }}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: c.muted, width: 36 }]}
                onPress={() => router.push('/notifications' as any)}
              >
                <Ionicons name="notifications-outline" size={18} color={c.foreground} />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={{ marginLeft: notifMargin }}>
              <TouchableOpacity
                style={[styles.iconBtn, { backgroundColor: c.muted }]}
                onPress={() => router.push('/u/settings' as any)}
              >
                <Ionicons name="settings-outline" size={18} color={c.foreground} />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Feed Tabs */}
        <Animated.View style={[styles.tabRow, { borderBottomColor: c.border, height: tabHeight, opacity: tabOpacity, overflow: 'hidden' }]}>
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
        </Animated.View>
      </SafeAreaView>
    </BlurView>
    </View>
  );

  const renderScrollableHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={[styles.searchRow, { borderBottomColor: c.border, backgroundColor: c.background }]}>
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
      <View style={[styles.createRow, { borderBottomColor: c.border, backgroundColor: c.background }]}>
        <TouchableOpacity
          style={[styles.createStrip, { flex: 1 }]}
          onPress={() => router.push('/post/create' as any)}
        >
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: c.muted }]}>
              <Text style={{ fontSize: 16 }}>
                {profile?.full_name?.charAt(0) || 'U'}
              </Text>
            </View>
          )}
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
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* Fixed Sticky Header — rendered as JSX, not as a component */}
      {renderStickyHeader()}

      {/* Feed Content */}
      {feed.loading ? (
        <FlatList
          key="skeleton"
          data={[1, 2, 3]}
          keyExtractor={(i) => String(i)}
          renderItem={() => <SkeletonCard />}
          scrollEnabled={false}
          ListHeaderComponent={renderScrollableHeader}
          style={styles.feedList}
          contentContainerStyle={styles.feedContent}
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
        <Animated.FlatList
          key="feed"
          ref={flatListRef}
          data={feed.posts}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => <PostCard post={item} />}
          ListHeaderComponent={renderScrollableHeader}
          style={styles.feedList}
          contentContainerStyle={styles.feedContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
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
              <Image 
                source={require('../../assets/images/ghost.png')} 
                style={styles.emptyGhost} 
                resizeMode="contain" 
              />
              <Text style={[styles.emptyTitle, { color: c.foreground }]}>
                {searchQuery ? 'No results found' : 'No posts yet'}
              </Text>
              <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
                {searchQuery ? 'Try searching something else' : 'Be the first to raise your voice!'}
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
              style={[styles.submitBtn, { backgroundColor: '#22c55e', opacity: isSubmittingIssue ? 0.6 : 1 }]}
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

            {/* Image Upload */}
            <Text style={[styles.fieldLabel, { color: c.foreground }]}>Add Photo</Text>
            {issueImageUri ? (
              <View style={styles.issueImagePreview}>
                <Image source={{ uri: issueImageUri }} style={styles.issueImage} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setIssueImageUri(null)}
                >
                  <Ionicons name="close-circle" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addPhotoBtn, { backgroundColor: c.muted, borderColor: c.border }]}
                onPress={pickIssueImage}
              >
                <Ionicons name="camera-outline" size={24} color={c.mutedForeground} />
                <Text style={{ color: c.mutedForeground, fontSize: 14, marginTop: 4 }}>
                  Tap to add a photo
                </Text>
              </TouchableOpacity>
            )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeaderContainer: {
    zIndex: 100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
    backgroundColor: 'transparent',
  },
  stickyHeader: {
    overflow: 'hidden',
    borderBottomWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  feedList: {
    flex: 1,
  },
  feedContent: {
    paddingBottom: 16,
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 44,
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
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyGhost: {
    width: 160,
    height: 160,
    marginBottom: 20,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
  },
  // Raise Issue Modal
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
  // Image upload for issue
  issueImagePreview: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  issueImage: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
  },
  addPhotoBtn: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
