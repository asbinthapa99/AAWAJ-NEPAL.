import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import type { Message } from '../../src/lib/types';

const PAGE_SIZE = 30;

// ─── Message bubble (memoised) ─────────────────────────────

const MessageBubble = memo(function MessageBubble({
  item,
  isOwn,
  foreground,
}: {
  item: Message;
  isOwn: boolean;
  foreground: string;
}) {
  const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={[styles.msgRow, isOwn ? styles.msgRight : styles.msgLeft]}>
      <Text style={[styles.msgText, { color: isOwn ? '#fff' : foreground }]}>{item.content}</Text>
      <View style={styles.msgMeta}>
        <Text style={[styles.msgTime, { color: isOwn ? 'rgba(255,255,255,0.7)' : '#9ca3af' }]}>{time}</Text>
        {isOwn && item.is_read && (
          <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
        )}
      </View>
    </View>
  );
});

// ─── Typing indicator ──────────────────────────────────────

function TypingIndicator({ visible, color }: { visible: boolean; color: string }) {
  if (!visible) return null;
  return (
    <View style={styles.typingRow}>
      <Text style={[styles.typingText, { color }]}>typing...</Text>
    </View>
  );
}

// ─── Main Chat Screen ──────────────────────────────────────

export default function ChatScreen() {
  const { id } = useLocalSearchParams() as { id?: string };
  const { c } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [text, setText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherUser, setOtherUser] = useState<{ username: string; full_name: string; avatar_url: string | null } | null>(null);

  const listRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load messages (paginated) ────────────────────────────

  const loadMessages = useCallback(
    async (before?: string) => {
      if (!id || !user) return;
      if (before) setLoadingMore(true);
      else setLoading(true);

      try {
        let query = supabase
          .from('messages')
          .select('*, sender:profiles(id, full_name, avatar_url)')
          .eq('conversation_id', id)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE);

        if (before) {
          query = query.lt('created_at', before);
        }

        const { data } = await query;
        const fetched = (data ?? []).reverse() as Message[];

        if (fetched.length < PAGE_SIZE) setHasMore(false);

        if (before) {
          setMessages((prev) => [...fetched, ...prev]);
        } else {
          setMessages(fetched);
        }
      } catch (err) {
        console.warn('[chat] load error:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [id, user],
  );

  // ─── Load other user profile ──────────────────────────────

  useEffect(() => {
    if (!id || !user) return;

    (async () => {
      const { data: members } = await supabase
        .from('conversation_members')
        .select('user_id')
        .eq('conversation_id', id);

      const otherId = (members ?? []).map((m: any) => m.user_id).find((uid: string) => uid !== user.id);
      if (otherId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', otherId)
          .single();
        if (profile) setOtherUser(profile as any);
      }
    })();
  }, [id, user]);

  // ─── Initial load + realtime ──────────────────────────────

  useEffect(() => {
    if (!id || !user) return;

    loadMessages();

    // Mark as read
    supabase.rpc('mark_conversation_read', {
      p_conversation_id: id,
      p_user_id: user.id,
    }).then(() => {});

    // Realtime: new messages + typing indicators
    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // De-dup (optimistic insert may already have it)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark as read if from other user
          if (newMsg.sender_id !== user.id) {
            supabase.rpc('mark_conversation_read', {
              p_conversation_id: id,
              p_user_id: user.id,
            }).then(() => {});
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'typing_indicators', filter: `conversation_id=eq.${id}` },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new as any;
            if (row.user_id !== user.id) {
              setOtherTyping(true);
              // Auto-clear after 5s
              setTimeout(() => setOtherTyping(false), 5000);
            }
          } else if (payload.eventType === 'DELETE') {
            const row = payload.old as any;
            if (row.user_id !== user.id) setOtherTyping(false);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      // Clear own typing on exit
      supabase.from('typing_indicators').delete().eq('conversation_id', id).eq('user_id', user.id).then(() => {});
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [id, user, loadMessages]);

  // ─── Auto-scroll on new messages ──────────────────────────

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // ─── Typing indicator (send) ──────────────────────────────

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);

      if (!id || !user) return;

      // Debounced typing indicator
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

      if (value.trim()) {
        supabase
          .from('typing_indicators')
          .upsert({ conversation_id: id, user_id: user.id, started_at: new Date().toISOString() }, { onConflict: 'conversation_id,user_id' })
          .then(() => {});

        // Clear after 3s of no typing
        typingTimerRef.current = setTimeout(() => {
          supabase.from('typing_indicators').delete().eq('conversation_id', id).eq('user_id', user.id).then(() => {});
        }, 3000);
      } else {
        supabase.from('typing_indicators').delete().eq('conversation_id', id!).eq('user_id', user.id).then(() => {});
      }
    },
    [id, user],
  );

  // ─── Send message (optimistic) ────────────────────────────

  const sendMessage = useCallback(async () => {
    if (!id || !user || !text.trim()) return;
    const content = text.trim();
    setText('');

    // Clear typing
    supabase.from('typing_indicators').delete().eq('conversation_id', id).eq('user_id', user.id).then(() => {});

    // Optimistic insert
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: optimisticId,
      conversation_id: id,
      sender_id: user.id,
      content,
      is_read: false,
      read_by: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: id, sender_id: user.id, content })
      .select()
      .single();

    if (error) {
      console.warn('[chat] send error:', error.message);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } else if (data) {
      // Replace optimistic with real
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? (data as Message) : m)));
    }
  }, [id, user, text]);

  // ─── Load more (pagination) ───────────────────────────────

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    const oldest = messages[0]?.created_at;
    if (oldest) loadMessages(oldest);
  }, [loadingMore, hasMore, messages, loadMessages]);

  // ─── Render ───────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble item={item} isOwn={item.sender_id === user?.id} foreground={c.foreground} />
    ),
    [user?.id, c.foreground],
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const HeaderLoader = useCallback(
    () =>
      loadingMore ? (
        <View style={styles.loadMoreContainer}>
          <ActivityIndicator size="small" color={c.primary} />
        </View>
      ) : null,
    [loadingMore, c.primary],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={c.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {otherUser?.avatar_url ? (
            <Image source={{ uri: otherUser.avatar_url }} style={styles.headerAvatar} />
          ) : null}
          <View>
            <Text style={[styles.headerTitle, { color: c.foreground }]}>
              {otherUser?.full_name || otherUser?.username || 'Chat'}
            </Text>
            {otherTyping && (
              <Text style={[styles.headerSubtitle, { color: c.primary }]}>typing...</Text>
            )}
          </View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={c.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
            ListHeaderComponent={HeaderLoader}
            onStartReached={handleLoadMore}
            onStartReachedThreshold={0.5}
            removeClippedSubviews
            maxToRenderPerBatch={20}
            windowSize={15}
          />
        )}

        <TypingIndicator visible={otherTyping} color={c.mutedForeground} />

        <View style={[styles.inputRow, { borderTopColor: c.border, backgroundColor: c.background }]}>
          <TextInput
            value={text}
            onChangeText={handleTextChange}
            placeholder="Message"
            placeholderTextColor={c.mutedForeground}
            style={[styles.input, { color: c.foreground, borderColor: c.border }]}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 0.5 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', flex: 1, marginLeft: 8 },
  headerAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  msgRow: { maxWidth: '75%', padding: 10, borderRadius: 16, marginVertical: 3 },
  msgLeft: { alignSelf: 'flex-start', backgroundColor: '#e6e7eb', borderBottomLeftRadius: 4 },
  msgRight: { alignSelf: 'flex-end', backgroundColor: '#4f46e5', borderBottomRightRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  msgTime: { fontSize: 11 },
  typingRow: { paddingHorizontal: 20, paddingBottom: 4 },
  typingText: { fontSize: 12, fontStyle: 'italic' },
  loadMoreContainer: { alignItems: 'center', paddingVertical: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, borderTopWidth: 0.5 },
  input: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 120, marginRight: 8, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
});
