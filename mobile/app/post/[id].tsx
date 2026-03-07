import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { Post, Comment } from '../../src/lib/types';
import { timeAgo, categoryColors } from '../../src/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Build comment tree (top-level + nested replies) ─────────────────────────
function buildCommentTree(flat: Comment[]): Comment[] {
  const map = new Map<string, Comment>();
  const roots: Comment[] = [];
  flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));
  map.forEach((comment) => {
    if (comment.reply_to_id && map.has(comment.reply_to_id)) {
      map.get(comment.reply_to_id)!.replies!.push(comment);
    } else {
      roots.push(comment);
    }
  });
  return roots;
}

// ─── Single Comment Row (recursive for replies) ───────────────────────────────
interface CommentItemProps {
  comment: Comment;
  onReply: (c: Comment) => void;
  c: any;      // theme colors
  depth?: number;
}

function CommentItem({ comment, onReply, c, depth = 0 }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const replies = comment.replies || [];
  const isNested = depth > 0;

  return (
    <View style={isNested ? styles.replyWrapper : undefined}>
      {isNested && <View style={[styles.replyLine, { backgroundColor: c.border }]} />}
      <View style={[styles.commentItem, isNested && styles.commentItemNested]}>
        {/* Avatar */}
        <View style={[styles.cAvatar, { backgroundColor: c.muted }]}>
          {comment.author?.avatar_url ? (
            <Image source={{ uri: comment.author.avatar_url }} style={styles.cAvatarImg} />
          ) : (
            <Text style={[styles.cAvatarLetter, { color: c.foreground }]}>
              {comment.author?.full_name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          )}
        </View>

        {/* Bubble + meta */}
        <View style={{ flex: 1 }}>
          <View style={[styles.cBubble, { backgroundColor: c.muted }]}>
            <Text style={[styles.cAuthorName, { color: c.foreground }]}>
              {comment.author?.full_name || 'Unknown'}
            </Text>
            <Text style={[styles.cContent, { color: c.foreground }]}>
              {comment.content}
            </Text>
          </View>
          <View style={styles.cMeta}>
            <Text style={[styles.cTime, { color: c.mutedForeground }]}>
              {timeAgo(comment.created_at)}
            </Text>
            <TouchableOpacity onPress={() => onReply(comment)} hitSlop={8}>
              <Text style={[styles.replyBtn, { color: c.mutedForeground }]}>Reply</Text>
            </TouchableOpacity>
            {replies.length > 0 && depth === 0 && (
              <TouchableOpacity onPress={() => setShowReplies((v) => !v)} hitSlop={8}>
                <Text style={[styles.replyBtn, { color: c.primary }]}>
                  {showReplies
                    ? `Hide ${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}`
                    : `${replies.length} repl${replies.length === 1 ? 'y' : 'ies'}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Nested replies */}
      {showReplies && replies.map((reply) => (
        <CommentItem key={reply.id} comment={reply} onReply={onReply} c={c} depth={depth + 1} />
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PostDetailScreen() {
  const { c } = useTheme();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [post, setPost] = useState<Post | null>(null);
  const [commentTree, setCommentTree] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [imgHeight, setImgHeight] = useState(SCREEN_WIDTH * 0.75);

  const fetchPost = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(id, full_name, username, avatar_url)')
      .eq('id', id)
      .single();
    if (data) setPost(data as Post);
  }, [id]);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    let result = await supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(id, full_name, username, avatar_url)')
      .eq('post_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (result.error) {
      result = await supabase
        .from('comments')
        .select('*, author:profiles(id, full_name, username, avatar_url)')
        .eq('post_id', id)
        .order('created_at', { ascending: true });
    }
    if (result.data) setCommentTree(buildCommentTree(result.data as Comment[]));
  }, [id]);

  useEffect(() => {
    Promise.all([fetchPost(), fetchComments()]).finally(() => setLoading(false));
  }, [fetchPost, fetchComments]);

  useEffect(() => {
    if (!post?.image_url) return;
    Image.getSize(
      post.image_url,
      (w, h) => {
        if (w && h) {
          const ratio = h / w;
          setImgHeight(SCREEN_WIDTH * Math.min(Math.max(ratio, 0.5), 1.4));
        }
      },
      () => {}
    );
  }, [post?.image_url]);

  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    setCommentText(`@${comment.author?.full_name || 'user'} `);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText('');
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    if (!user) {
      Alert.alert('Sign in required', 'You need to be signed in to comment.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.replace('/auth/login' as any) },
      ]);
      return;
    }
    if (!id) return;
    setSubmitting(true);

    const payload: any = {
      post_id: id,
      author_id: user.id,
      content: commentText.trim(),
    };
    if (replyingTo) payload.reply_to_id = replyingTo.id;

    const { error } = await supabase.from('comments').insert(payload);

    if (error) {
      console.log('[Comment] insert error:', error.message, error.code);
      if (error.code === '42501') {
        Alert.alert('Permission denied', 'Please sign out and sign back in.');
      } else if (error.code === 'PGRST205' || error.message?.includes("'public.comments'")) {
        Alert.alert('Setup required', 'Run migration_v8_definitive_fix.sql in Supabase SQL Editor.');
      } else {
        Alert.alert('Error', `Could not post comment: ${error.message}`);
      }
    } else {
      setCommentText('');
      setReplyingTo(null);
      await fetchComments();
      await fetchPost();
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.center}>
          <Text style={{ color: c.mutedForeground }}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = categoryColors[post.category] || categoryColors.other;
  const totalComments = commentTree.reduce((acc, c2) => acc + 1 + (c2.replies?.length || 0), 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={c.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Post</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={commentTree}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <CommentItem comment={item} onReply={handleReply} c={c} />
          )}
          ListHeaderComponent={
            <View>
              {/* Author Row */}
              <View style={styles.authorRow}>
                <View style={[styles.authorAvatar, { borderColor: c.primary }]}>
                  {post.author?.avatar_url ? (
                    <Image source={{ uri: post.author.avatar_url }} style={styles.authorAvatarImg} />
                  ) : (
                    <View style={[styles.authorAvatarFb, { backgroundColor: c.muted }]}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: c.foreground }}>
                        {post.author?.full_name?.charAt(0) || 'U'}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.authorName, { color: c.foreground }]}>
                    {post.author?.full_name || 'Unknown'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <View style={[styles.catDot, { backgroundColor: categoryColor }]} />
                    <Text style={{ color: categoryColor, fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>
                      {post.category}
                    </Text>
                    <Text style={{ color: c.mutedForeground, fontSize: 12 }}>
                      · {timeAgo(post.created_at)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Content */}
              <View style={styles.content}>
                {post.title && post.title !== post.content && (
                  <Text style={[styles.title, { color: c.foreground }]}>{post.title}</Text>
                )}
                <Text style={[styles.body, { color: c.foreground }]}>{post.content}</Text>
              </View>

              {/* Post Image */}
              {post.image_url && (
                <Image
                  source={{ uri: post.image_url }}
                  style={[styles.postImage, { height: imgHeight }]}
                  resizeMode="cover"
                />
              )}

              {/* Stats */}
              <View style={[styles.statsRow, { borderTopColor: c.border, borderBottomColor: c.border }]}>
                <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
                  <Ionicons name="heart" size={14} color={c.rose} />
                  <Text style={{ color: c.mutedForeground, fontSize: 13 }}>{post.supports_count || 0}</Text>
                </View>
                <Text style={{ color: c.mutedForeground, fontSize: 13 }}>
                  {totalComments} comment{totalComments !== 1 ? 's' : ''}
                </Text>
              </View>

              {totalComments > 0 && (
                <View style={[styles.commentsHeader, { borderBottomColor: c.border }]}>
                  <Text style={[styles.commentsTitle, { color: c.foreground }]}>Comments</Text>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 28, marginBottom: 6 }}>💬</Text>
              <Text style={{ color: c.mutedForeground, fontSize: 14 }}>No comments yet. Be the first!</Text>
            </View>
          }
        />

        {/* Reply banner */}
        {replyingTo && (
          <View style={[styles.replyBanner, { backgroundColor: c.muted, borderTopColor: c.border }]}>
            <Text style={{ color: c.mutedForeground, fontSize: 13, flex: 1 }} numberOfLines={1}>
              Replying to{' '}
              <Text style={{ fontWeight: '700', color: c.foreground }}>
                {replyingTo.author?.full_name || 'user'}
              </Text>
            </Text>
            <TouchableOpacity onPress={cancelReply} hitSlop={8}>
              <Ionicons name="close" size={16} color={c.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Comment Input */}
        <View style={[styles.inputBar, { backgroundColor: c.background, borderTopColor: c.border }]}>
          <View style={[styles.inputWrap, { backgroundColor: c.muted }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: c.foreground }]}
              placeholder={replyingTo ? `Reply to ${replyingTo.author?.full_name}…` : 'Add a comment…'}
              placeholderTextColor={c.mutedForeground}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={1000}
            />
          </View>
          <TouchableOpacity
            onPress={handleSubmitComment}
            disabled={submitting || !commentText.trim()}
            style={[
              styles.sendBtn,
              { backgroundColor: commentText.trim() ? c.primary : c.muted },
            ]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={16} color={commentText.trim() ? '#fff' : c.mutedForeground} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },

  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  authorAvatarImg: { width: 40, height: 40, borderRadius: 20 },
  authorAvatarFb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  catDot: { width: 6, height: 6, borderRadius: 3 },

  content: { paddingHorizontal: 16, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 6, lineHeight: 26 },
  body: { fontSize: 16, lineHeight: 24 },

  postImage: { width: SCREEN_WIDTH },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  commentsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  commentsTitle: { fontSize: 15, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingTop: 40 },

  // ── Comment item ──
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'flex-start',
  },
  commentItemNested: { paddingLeft: 0 },
  replyWrapper: {
    flexDirection: 'row',
    paddingLeft: 40,
  },
  replyLine: {
    width: 2,
    marginLeft: 10,
    marginRight: 8,
    borderRadius: 2,
    minHeight: 40,
  },

  cAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  cAvatarImg: { width: 34, height: 34, borderRadius: 17 },
  cAvatarLetter: { fontSize: 13, fontWeight: '700' },

  cBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cAuthorName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  cContent: { fontSize: 14, lineHeight: 20 },

  cMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    paddingLeft: 4,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  cTime: { fontSize: 11 },
  replyBtn: { fontSize: 12, fontWeight: '600' },

  // ── Reply banner ──
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 0.5,
    gap: 8,
  },

  // ── Comment input bar ──
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    minHeight: 40,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
});
