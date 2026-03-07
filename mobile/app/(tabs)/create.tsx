import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { File as ExpoFile } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { categoryColors } from '../../src/lib/theme';

type PostingStatus = 'idle' | 'posting' | 'success' | 'error';

const POSTING_STAGES = [
  'Uploading media…',
  'Saving your post…',
  'Notifying followers…',
  'Almost done…',
];

const CATEGORIES = [
  { label: 'Infrastructure', value: 'infrastructure', icon: '🏗️' },
  { label: 'Education', value: 'education', icon: '📚' },
  { label: 'Health', value: 'health', icon: '🏥' },
  { label: 'Environment', value: 'environment', icon: '🌿' },
  { label: 'Governance', value: 'governance', icon: '🏛️' },
  { label: 'Safety', value: 'safety', icon: '🛡️' },
  { label: 'Other', value: 'other', icon: '💬' },
];

export default function CreateScreen() {
  const { c } = useTheme();
  const { user, profile } = useAuth();
  const router = useRouter();

  const [content, setContent] = useState('');
  const [category, setCategory] = useState('other');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [postingStatus, setPostingStatus] = useState<PostingStatus>('idle');
  const [postingError, setPostingError] = useState('');
  const [stageIndex, setStageIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  // Track whether the successfully submitted post had a video so we can
  // navigate to Reels instead of Home after the state has been cleared.
  const wasVideoPostRef = useRef(false);

  // Animate modal in when status changes to posting/success/error
  useEffect(() => {
    if (postingStatus === 'idle') return;
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 180 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [postingStatus]);

  // Cycle stage labels + animate progress bar while posting
  useEffect(() => {
    if (postingStatus !== 'posting') return;
    setStageIndex(0);
    progressAnim.setValue(0);

    Animated.timing(progressAnim, { toValue: 85, duration: 3500, useNativeDriver: false }).start();

    const interval = setInterval(() => {
      setStageIndex((i) => (i < POSTING_STAGES.length - 1 ? i + 1 : i));
    }, 900);
    return () => clearInterval(interval);
  }, [postingStatus]);

  // Jump bar to 100 on success, then navigate to the right tab
  useEffect(() => {
    if (postingStatus !== 'success') return;
    Animated.timing(progressAnim, { toValue: 100, duration: 400, useNativeDriver: false }).start();
    const timer = setTimeout(() => {
      setPostingStatus('idle');
      // Navigate to Reels if a video was posted, otherwise Home
      if (wasVideoPostRef.current) {
        router.push('/(tabs)/reels');
      } else {
        router.push('/(tabs)/home');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [postingStatus]);

  // Video ref for preview (expo-av)
  const videoPreviewRef = useRef<InstanceType<typeof Video>>(null);

  // Play video preview when a video is selected
  useEffect(() => {
    if (videoUri && videoPreviewRef.current) {
      videoPreviewRef.current.playAsync().catch(() => {});
    }
  }, [videoUri]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(null);
      setImageUri(result.assets[0].uri);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      videoMaxDuration: 60,
      quality: 0.75,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(null);
      setVideoUri(result.assets[0].uri);
    }
  };

  // Helper: compress image to JPEG & read as bytes (fixes HEIC/PNG 0-byte uploads on iOS)
  const getImageBytes = async (uri: string): Promise<{ bytes: Uint8Array; mimeType: 'image/jpeg' }> => {
    // Always convert to JPEG so the content-type, extension, and bytes all match
    const result = await manipulateAsync(uri, [], {
      compress: 0.85,
      format: SaveFormat.JPEG,
    });
    const file = new ExpoFile(result.uri);
    const bytes = await file.bytes();
    return { bytes, mimeType: 'image/jpeg' };
  };

  // Helper: read video file as bytes
  const getVideoBytes = async (uri: string): Promise<{ bytes: Uint8Array; mimeType: string }> => {
    const ext = uri.split('.').pop()?.toLowerCase() || 'mp4';
    const mimeMap: Record<string, string> = {
      mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm',
    };
    const file = new ExpoFile(uri);
    const bytes = await file.bytes();
    return { bytes, mimeType: mimeMap[ext] || 'video/mp4' };
  };

  const handleSubmit = async () => {
    // Allow posting with just an image or video (no text required)
    if (!content.trim() && !imageUri && !videoUri) {
      Alert.alert('Error', 'Please write something or add a photo/video');
      return;
    }
    if (!user) {
      Alert.alert('Sign in required', 'You need to be signed in to post.');
      return;
    }

    setLoading(true);
    setPostingError('');
    setPostingStatus('posting');

    let image_url: string | null = null;
    let video_url: string | null = null;

    // Upload image (always compressed to JPEG via expo-image-manipulator)
    if (imageUri) {
      try {
        const { bytes, mimeType } = await getImageBytes(imageUri);
        const fileName = `post_${user.id}_${Date.now()}.jpg`;
        console.log('[Upload] image size:', bytes.byteLength, 'mime:', mimeType);

        const { data, error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, bytes, { contentType: mimeType, upsert: false });

        if (uploadError) {
          console.log('[Upload] image error:', uploadError.message);
          Alert.alert('Upload failed', 'Could not upload image: ' + uploadError.message);
        } else if (data) {
          const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(data.path);
          image_url = urlData.publicUrl;
          console.log('[Upload] image OK:', image_url);
        }
      } catch (e: any) {
        console.log('[Upload] image exception:', e.message);
        Alert.alert('Upload failed', 'Could not process image file.');
      }
    }

    // Upload video
    if (videoUri) {
      try {
        const { bytes, mimeType } = await getVideoBytes(videoUri);
        const ext = videoUri.split('.').pop()?.toLowerCase() || 'mp4';
        const fileName = `video_${user.id}_${Date.now()}.${ext}`;
        console.log('[Upload] video size:', bytes.byteLength, 'mime:', mimeType);

        const { data, error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, bytes, { contentType: mimeType, upsert: false });

        if (uploadError) {
          console.log('[Upload] video error:', uploadError.message);
          Alert.alert('Upload failed', 'Could not upload video: ' + uploadError.message);
        } else if (data) {
          const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(data.path);
          video_url = urlData.publicUrl;
          console.log('[Upload] video OK:', video_url);
        }
      } catch (e: any) {
        console.log('[Upload] video exception:', e.message);
        Alert.alert('Upload failed', 'Could not read video file.');
      }
    }

    const postContent = content.trim() || (imageUri ? '📷' : '🎬');
    const { error } = await supabase.from('posts').insert({
      author_id: user.id,
      title: postContent.slice(0, 100),
      content: postContent,
      category,
      urgency: 'low',
      district: profile?.district || null,
      image_url,
      video_url,
    });

    setLoading(false);

    if (error) {
      setPostingStatus('error');
      setPostingError('Failed to create post. Please try again.');
    } else {
      wasVideoPostRef.current = !!videoUri;
      setContent('');
      setImageUri(null);
      setVideoUri(null);
      setCategory('other');
      setPostingStatus('success');
      // Navigation happens after toast auto-dismisses (useEffect above)
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={c.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Create Post</Text>
          <TouchableOpacity
            style={[styles.postBtn, { backgroundColor: c.primary, opacity: loading ? 0.6 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Author Row */}
          <View style={styles.authorRow}>
            <View style={[styles.avatar, { backgroundColor: c.muted }]}>
              <Text style={{ fontSize: 16 }}>{profile?.full_name?.charAt(0) || 'U'}</Text>
            </View>
            <View>
              <Text style={[styles.authorName, { color: c.foreground }]}>
                {profile?.full_name || 'User'}
              </Text>
              <Text style={[styles.authorSub, { color: c.mutedForeground }]}>
                @{profile?.username || 'user'}
              </Text>
            </View>
          </View>

          {/* Text Input */}
          <TextInput
            style={[styles.textInput, { color: c.foreground }]}
            placeholder="What's on your mind? Raise your voice! 📢"
            placeholderTextColor={c.mutedForeground}
            multiline
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
            autoFocus
          />

          {/* Image Preview */}
          {imageUri && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setImageUri(null)}
              >
                <Ionicons name="close-circle" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Video Preview */}
          {videoUri && (
            <View style={styles.imagePreview}>
              <Video
                ref={videoPreviewRef}
                source={{ uri: videoUri }}
                style={styles.previewImage}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay
                isMuted
                useNativeControls={false}
              />
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setVideoUri(null)}
              >
                <Ionicons name="close-circle" size={28} color="#fff" />
              </TouchableOpacity>
              <View style={styles.videoLabel}>
                <Ionicons name="videocam" size={14} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, marginLeft: 4 }}>Reel</Text>
              </View>
            </View>
          )}

          {/* Category Selector — optional */}
          <View style={styles.sectionLabelRow}>
            <Text style={[styles.sectionLabel, { color: c.foreground }]}>Topic</Text>
            <Text style={[styles.optionalBadge, { color: c.mutedForeground }]}>optional</Text>
          </View>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                onPress={() => setCategory(cat.value === category ? 'other' : cat.value)}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: category === cat.value && cat.value !== 'other'
                      ? (categoryColors[cat.value] || c.primary)
                      : c.muted,
                  },
                ]}
              >
                <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.catLabel,
                    { color: category === cat.value && cat.value !== 'other' ? '#fff' : c.foreground },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Bottom Toolbar */}
        <View style={[styles.toolbar, { backgroundColor: c.background, borderTopColor: c.border }]}>
          <TouchableOpacity onPress={pickImage} style={styles.toolBtn}>
            <Ionicons name="image-outline" size={24} color={c.success} />
            <Text style={[styles.toolLabel, { color: c.success }]}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickVideo} style={styles.toolBtn}>
            <Ionicons name="videocam-outline" size={24} color="#a855f7" />
            <Text style={[styles.toolLabel, { color: '#a855f7' }]}>Reel</Text>
          </TouchableOpacity>
          <View style={styles.charCount}>
            <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
              {content.length}/2000
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ── Posting / Posted overlay modal ── */}
      <Modal transparent visible={postingStatus !== 'idle'} animationType="none" statusBarTranslucent>
        <View style={styles.toastBackdrop}>
          <Animated.View
            style={[
              styles.toastCard,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
                borderColor:
                  postingStatus === 'success' ? '#059669'
                  : postingStatus === 'error'  ? '#e11d48'
                  : '#334155',
              },
            ]}
          >
            {/* Progress bar */}
            {(postingStatus === 'posting' || postingStatus === 'success') && (
              <View style={styles.progressTrack}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: postingStatus === 'success' ? '#34d399' : '#3b82f6',
                    },
                  ]}
                />
              </View>
            )}

            <View style={styles.toastBody}>
              {/* Icon */}
              <View style={[
                styles.toastIconWrap,
                {
                  backgroundColor:
                    postingStatus === 'success' ? 'rgba(52,211,153,0.15)'
                    : postingStatus === 'error'  ? 'rgba(251,113,133,0.15)'
                    : 'rgba(59,130,246,0.15)',
                },
              ]}>
                {postingStatus === 'posting' && (
                  <ActivityIndicator color="#3b82f6" size="small" />
                )}
                {postingStatus === 'success' && (
                  <Ionicons name="checkmark-circle" size={24} color="#34d399" />
                )}
                {postingStatus === 'error' && (
                  <Ionicons name="close-circle" size={24} color="#fb7185" />
                )}
              </View>

              {/* Text */}
              <View style={{ flex: 1 }}>
                <Text style={[
                  styles.toastTitle,
                  {
                    color:
                      postingStatus === 'success' ? '#34d399'
                      : postingStatus === 'error'  ? '#fb7185'
                      : '#f1f5f9',
                  },
                ]}>
                  {postingStatus === 'posting' && 'Publishing your voice…'}
                  {postingStatus === 'success' && '🎉 Voice published!'}
                  {postingStatus === 'error'   && 'Post failed'}
                </Text>
                <Text style={styles.toastSub}>
                  {postingStatus === 'posting' && POSTING_STAGES[stageIndex]}
                  {postingStatus === 'success' && 'Your post is now live for all to see'}
                  {postingStatus === 'error'   && (postingError || 'Something went wrong. Try again.')}
                </Text>
              </View>

              {/* Megaphone on success */}
              {postingStatus === 'success' && (
                <Text style={{ fontSize: 28, marginLeft: 8 }}>📢</Text>
              )}
            </View>

            {/* Retry / dismiss on error */}
            {postingStatus === 'error' && (
              <TouchableOpacity
                style={styles.toastDismiss}
                onPress={() => setPostingStatus('idle')}
              >
                <Text style={styles.toastDismissText}>Dismiss</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  postBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: { fontSize: 15, fontWeight: '700' },
  authorSub: { fontSize: 12 },
  textInput: {
    fontSize: 17,
    lineHeight: 24,
    minHeight: 120,
  },
  imagePreview: { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  previewImage: { width: '100%', height: 300, borderRadius: 14 },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
  },
  videoLabel: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', marginTop: 24, marginBottom: 10 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24, marginBottom: 10 },
  optionalBadge: { fontSize: 11, fontWeight: '500', opacity: 0.6 },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  catLabel: { fontSize: 13, fontWeight: '600' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  toolBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toolLabel: { fontSize: 14, fontWeight: '600' },
  charCount: {},

  // Posting toast modal
  toastBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 48,
    paddingHorizontal: 20,
  },
  toastCard: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  progressTrack: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  toastBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  toastIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  toastTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  toastSub: {
    fontSize: 13,
    color: 'rgba(148,163,184,0.9)',
    lineHeight: 18,
  },
  toastDismiss: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  toastDismissText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fb7185',
  },
});
