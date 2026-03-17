import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Share,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import AnimatedPressable from './AnimatedPressable';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../providers/ThemeProvider';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../lib/supabase';
import { toggleSave, toggleMute } from '../lib/feedService';
import { Post, Comment } from '../lib/types';
import { timeAgo, categoryColors } from '../lib/theme';

interface PostCardProps {
  post: Post;
  index?: number;
}

export default function PostCard({ post, index = 0 }: PostCardProps) {
  const { c } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [loved, setLoved] = useState(false);
  const [loveCount, setLoveCount] = useState(post.supports_count || 0);
  const [saved, setSaved] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [previewComments, setPreviewComments] = useState<Comment[]>([]);
  const [imgHeight, setImgHeight] = useState(screenWidth * 0.85);

  const author = post.author;
  const categoryColor = categoryColors[post.category] || categoryColors.other;
  const isOwner = user?.id === post.author_id;

  // Check if user already loved this post
  useEffect(() => {
    if (!user) return;
    supabase
      .from('supports')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setLoved(true);
      });
  }, [post.id, user]);

  // Fetch top 2 comments for preview
  useEffect(() => {
    const fetchPreview = async () => {
      let result = await supabase
        .from('comments')
        .select('*, author:profiles!comments_author_id_fkey(id, full_name, username, avatar_url)')
        .eq('post_id', post.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(2);

      // Fallback if deleted_at column doesn't exist
      if (result.error) {
        result = await supabase
          .from('comments')
          .select('*, author:profiles(id, full_name, username, avatar_url)')
          .eq('post_id', post.id)
          .order('created_at', { ascending: false })
          .limit(2);
      }

      if (result.data) setPreviewComments(result.data as Comment[]);
    };
    fetchPreview();
  }, [post.id]);

  // Compute image aspect ratio so we don't crop tall/portrait photos
  useEffect(() => {
    if (!post.image_url) return;
    Image.getSize(
      post.image_url,
      (w, h) => {
        if (w && h) {
          const ratio = h / w;
          // Clamp: min 0.5 (wide landscape), max 1.4 (tall portrait)
          const clamped = Math.min(Math.max(ratio, 0.5), 1.4);
          setImgHeight(screenWidth * clamped);
        }
      },
      () => { } // ignore error, keep default
    );
  }, [post.image_url, screenWidth]);

  // Check if post is saved (bookmarked)
  useEffect(() => {
    if (!user) return;
    supabase
      .from('saves')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSaved(true);
      });
  }, [post.id, user]);

  // Shared values for popping animations
  const likeScale = useSharedValue(1);
  const saveScale = useSharedValue(1);

  const handleSave = useCallback(async () => {
    if (!user) {
      Alert.alert('Sign in required', 'You need to be signed in to save posts.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth/login' as any) },
      ]);
      return;
    }

    // Pop animation map
    saveScale.value = withSequence(
      withSpring(1.4, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    setSaved((prev) => !prev); // optimistic
    const result = await toggleSave(post.id, user.id);
    if (!result.saved && result.saved !== undefined) {
      // Revert if API explicitely returns un-saved while we optimistically assume saved
    }
  }, [user, post.id, router]);

  const handleMuteUser = useCallback(async () => {
    setMenuVisible(false);
    if (!user || !post.author_id) return;
    Alert.alert(
      'Mute User',
      `Posts from ${post.author?.full_name || 'this user'} will be hidden from your feed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mute',
          style: 'destructive',
          onPress: async () => {
            await toggleMute(user.id, post.author_id);
            Alert.alert('Muted', 'You can unmute from your settings.');
          },
        },
      ]
    );
  }, [user, post.author_id, post.author?.full_name]);

  const handleLove = async () => {
    if (!user) {
      Alert.alert('Sign in required', 'You need to be signed in to react to posts.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth/login' as any) },
      ]);
      return;
    }

    // Scale sequence bounding effect
    likeScale.value = withSequence(
      withSpring(1.5, { damping: 10, stiffness: 200 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    if (loved) {
      // Optimistic: un-love
      setLoved(false);
      setLoveCount((p) => Math.max(0, p - 1));
      const { error } = await supabase
        .from('supports')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id);
      if (error) {
        console.log('[Love] delete error:', error.message);
        // Rollback
        setLoved(true);
        setLoveCount((p) => p + 1);
      }
    } else {
      // Optimistic: love
      setLoved(true);
      setLoveCount((p) => p + 1);
      const { error } = await supabase
        .from('supports')
        .insert({ post_id: post.id, user_id: user.id });
      if (error) {
        // If already exists (duplicate), just stay loved
        if (error.code === '23505') {
          // Unique violation — already loved, keep state
          return;
        }
        console.log('[Love] insert error:', error.message);
        // Rollback
        setLoved(false);
        setLoveCount((p) => Math.max(0, p - 1));
      }
    }
  };

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }]
  }));

  const saveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }]
  }));

  const handleDelete = async () => {
    setMenuVisible(false);
    Alert.alert('Delete Post', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', post.id);
        },
      },
    ]);
  };

  const handleCopyLink = () => {
    setMenuVisible(false);
    Alert.alert('Link', `guffgaff.app/post/${post.id}`, [
      { text: 'OK' },
    ]);
  };

  const handleReport = () => {
    setMenuVisible(false);
    Alert.alert('Reported', 'Thank you. We will review this post.');
  };

  const handleRaiseIssue = () => {
    setMenuVisible(false);
    // Navigate to home with raise issue intent — or show inline alert
    Alert.alert(
      '📢 Raise an Issue',
      'Use the "Raise Issue" button on the Home feed to submit a new issue with full details (title, category, urgency).',
      [
        { text: 'Go to Home', onPress: () => router.push('/(tabs)/home' as any) },
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  const handleComment = () => {
    if (!user) {
      Alert.alert('Sign in required', 'You need to be signed in to comment.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth/login' as any) },
      ]);
      return;
    }
    router.push(`/post/${post.id}`);
  };

  const handleOpenProfile = () => {
    if (!author) return;
    if (author.id === user?.id) {
      // Navigate to own profile tab
      router.push('/(tabs)/profile' as any);
    } else {
      router.push(`/u/${author.id}` as any);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.title || post.content}\n\nhttps://guffgaff.app/post/${post.id}`,
      });
    } catch (_) {
      // User cancelled or share failed — ignore
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(index * 100).springify()}
      style={[styles.card, { backgroundColor: c.card, borderBottomColor: c.border }]}
    >

      {/* ── Header: Avatar + Username + time + ... ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleOpenProfile} activeOpacity={0.7} style={styles.avatarWrap}>
          {author?.avatar_url ? (
            <Image source={{ uri: author.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: c.primary + '22' }]}>
              <Text style={[styles.avatarLetter, { color: c.primary }]}>
                {author?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleOpenProfile} activeOpacity={0.7} style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={[styles.authorName, { color: c.foreground }]} numberOfLines={1}>
              {author?.full_name || 'Unknown'}
            </Text>
            <View style={[styles.categoryPill, { backgroundColor: categoryColor + '22' }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>{post.category}</Text>
            </View>
          </View>
          <Text style={[styles.meta, { color: c.mutedForeground }]}>
            {timeAgo(post.created_at)}
            {post.district ? ` · ${post.district}` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMenuVisible(true)} hitSlop={10} style={styles.menuBtn}>
          <Ionicons name="ellipsis-horizontal" size={20} color={c.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* ── Caption above image ── */}
      {post.title && post.title !== post.content && (
        <Text style={[styles.postTitle, { color: c.foreground }]}>{post.title}</Text>
      )}
      {/* Hide caption when it's just our placeholder emoji (image/video already shows content) */}
      {post.content && post.content !== '📷' && post.content !== '🎬' && (
        <Text
          style={[
            styles.caption,
            {
              color: c.foreground,
              fontSize: post.image_url ? 15 : 20,
              lineHeight: post.image_url ? 23 : 32,
            },
          ]}
        >
          {post.content}
        </Text>
      )}

      {/* ── Image or Video ── */}
      {post.video_url ? (
        <TouchableOpacity
          style={[styles.postImage, { width: screenWidth, height: imgHeight, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}
          activeOpacity={0.8}
          onPress={() => router.push(`/post/${post.id}` as any)}
        >
          <Ionicons name="play-circle" size={48} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      ) : post.image_url ? (
        <Image source={{ uri: post.image_url }} style={[styles.postImage, { width: screenWidth, height: imgHeight }]} resizeMode="cover" />
      ) : null}

      {/* ── Metrics row ── */}
      {(loveCount > 0 || post.comments_count > 0) && (
        <View style={[styles.metricsRow, { borderTopColor: c.border, borderBottomColor: c.border }]}>
          {loveCount > 0 && (
            <View style={styles.metricItem}>
              <Ionicons name="heart" size={14} color={c.rose} />
              <Text style={[styles.metricText, { color: c.mutedForeground }]}>{loveCount.toLocaleString()}</Text>
            </View>
          )}
          {post.comments_count > 0 && (
            <Text style={[styles.metricText, styles.metricRight, { color: c.mutedForeground }]}>
              {post.comments_count} comments
            </Text>
          )}
        </View>
      )}



      {/* ── Action Buttons ── */}
      <View style={[styles.actions, { borderBottomColor: c.border }]}>
        {/* Love */}
        <AnimatedPressable onPress={handleLove} style={styles.actionBtn}>
          <Animated.View style={likeAnimatedStyle}>
            <Text style={styles.actionEmoji}>{loved ? '❤️' : '🤍'}</Text>
          </Animated.View>
          <Text style={[styles.actionLabel, { color: loved ? c.rose : c.mutedForeground }]}>Love</Text>
        </AnimatedPressable>

        {/* Comment */}
        <AnimatedPressable onPress={handleComment} style={styles.actionBtn}>
          <Text style={styles.actionEmoji}>💬</Text>
          <Text style={[styles.actionLabel, { color: c.mutedForeground }]}>Comment</Text>
        </AnimatedPressable>

        {/* Share */}
        <AnimatedPressable onPress={handleShare} style={styles.actionBtn}>
          <Text style={styles.actionEmoji}>↗</Text>
          <Text style={[styles.actionLabel, { color: c.mutedForeground }]}>Share</Text>
        </AnimatedPressable>

        {/* Save / Bookmark */}
        <AnimatedPressable onPress={handleSave} style={styles.actionBtn}>
          <Animated.View style={saveAnimatedStyle}>
            <Text style={styles.actionEmoji}>{saved ? '🔖' : '📑'}</Text>
          </Animated.View>
          <Text style={[styles.actionLabel, { color: saved ? '#eab308' : c.mutedForeground }]}>
            {saved ? 'Saved' : 'Save'}
          </Text>
        </AnimatedPressable>
      </View>

      {/* ── Comment Preview ── */}
      {previewComments.length > 0 && (
        <TouchableOpacity onPress={handleComment} activeOpacity={0.7} style={styles.commentsPreview}>
          {post.comments_count > previewComments.length && (
            <Text style={[styles.viewAllComments, { color: c.mutedForeground }]}>
              View all {post.comments_count} comments
            </Text>
          )}
          {previewComments.map((c2) => (
            <View key={c2.id} style={styles.commentRow}>
              <Text style={[styles.commentAuthor, { color: c.foreground }]}>
                {c2.author?.full_name || 'User'}
              </Text>
              <Text style={[styles.commentContent, { color: c.foreground }]} numberOfLines={2}>
                {' '}{c2.content}
              </Text>
            </View>
          ))}
        </TouchableOpacity>
      )}

      {/* ── Post Action Menu (Modal) ── */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menuSheet, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[styles.menuTitle, { color: c.mutedForeground }]}>Post options</Text>

            <TouchableOpacity style={styles.menuItem} onPress={handleCopyLink}>
              <Ionicons name="link-outline" size={20} color={c.foreground} />
              <Text style={[styles.menuItemText, { color: c.foreground }]}>Copy link</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleReport}>
              <Ionicons name="flag-outline" size={20} color={c.foreground} />
              <Text style={[styles.menuItemText, { color: c.foreground }]}>Report this post</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleRaiseIssue}>
              <Ionicons name="megaphone-outline" size={20} color={c.foreground} />
              <Text style={[styles.menuItemText, { color: c.foreground }]}>Raise an Issue</Text>
            </TouchableOpacity>

            {!isOwner && (
              <TouchableOpacity style={styles.menuItem} onPress={handleMuteUser}>
                <Ionicons name="volume-mute-outline" size={20} color={c.foreground} />
                <Text style={[styles.menuItemText, { color: c.foreground }]}>Mute user</Text>
              </TouchableOpacity>
            )}

            {isOwner && (
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Delete post</Text>
              </TouchableOpacity>
            )}

            <AnimatedPressable
              style={[styles.menuItem, styles.menuCancel, { borderTopColor: c.border }]}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={[styles.menuItemText, { color: c.mutedForeground }]}>Cancel</Text>
            </AnimatedPressable>
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderBottomWidth: 0.5,
    marginBottom: 6,
  },
  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(150,150,150,0.25)',
  },
  avatarImage: {
    width: 42,
    height: 42,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  meta: {
    fontSize: 12,
    marginTop: 1,
  },
  menuBtn: {
    padding: 4,
  },
  // ── Content ──
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 14,
    paddingBottom: 4,
  },
  caption: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  postImage: {
    minHeight: 200,
  },
  // ── Metrics ──
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 13,
  },
  metricRight: {
    flexGrow: 1,
    textAlign: 'right',
  },
  // ── Action Bar ──
  actions: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    paddingVertical: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionEmoji: {
    fontSize: 17,
    lineHeight: 22,
  },
  // ── Comments Preview ──
  commentsPreview: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 4,
  },
  viewAllComments: {
    fontSize: 13,
    marginBottom: 4,
  },
  commentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
  },
  commentContent: {
    fontSize: 13,
    flex: 1,
  },
  // ── Action Menu ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menuSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 0.5,
    paddingTop: 8,
    paddingBottom: 32,
  },
  menuTitle: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  menuItemText: {
    fontSize: 16,
  },
  menuCancel: {
    borderTopWidth: 0.5,
    marginTop: 4,
    justifyContent: 'center',
  },
});
