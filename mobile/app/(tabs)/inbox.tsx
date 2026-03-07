import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { useRouter } from 'expo-router';
import type { InboxConversation } from '../../src/lib/types';

// ─── Optimised inbox row (memoised) ────────────────────────

const InboxRow = memo(function InboxRow({
  item,
  foreground,
  mutedForeground,
  onPress,
}: {
  item: InboxConversation;
  foreground: string;
  mutedForeground: string;
  onPress: () => void;
}) {
  const timeAgo = item.last_message_at ? formatTimeAgo(item.last_message_at) : '';

  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      {item.other_avatar_url ? (
        <Image source={{ uri: item.other_avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person" size={22} color="#334155" />
        </View>
      )}
      <View style={styles.meta}>
        <View style={styles.metaTop}>
          <Text style={[styles.name, { color: foreground }]} numberOfLines={1}>
            {item.other_full_name || item.other_username || 'User'}
          </Text>
          <Text style={[styles.time, { color: mutedForeground }]}>{timeAgo}</Text>
        </View>
        <View style={styles.metaBottom}>
          <Text
            style={[
              styles.lastMessage,
              { color: mutedForeground },
              item.unread_count > 0 && styles.lastMessageUnread,
            ]}
            numberOfLines={1}
          >
            {item.last_message_text || 'No messages yet'}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {item.unread_count > 99 ? '99+' : item.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Time formatting ───────────────────────────────────────

function formatTimeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(isoDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Main Screen ───────────────────────────────────────────

export default function InboxScreen() {
  const { c } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const channelRef = useRef<any>(null);

  /**
   * Single RPC call replaces the old N+1 loop.
   * get_inbox() joins conversations ↔ members ↔ profiles in one query.
   */
  const loadConversations = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const { data, error } = await supabase.rpc('get_inbox', {
        p_user_id: user.id,
      });

      if (error) throw error;
      setConversations((data ?? []) as InboxConversation[]);
    } catch (err) {
      console.warn('[inbox] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();

    // Subscribe to conversation updates for current user's conversations.
    // Instead of reloading everything on every message, we do a lightweight
    // optimistic update from the realtime payload.
    if (!user) return;

    const channel = supabase
      .channel(`inbox:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'conversations' },
        (payload) => {
          const updated = payload.new as any;
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.conversation_id === updated.id);
            if (idx === -1) {
              // New conversation — reload to get full data
              loadConversations();
              return prev;
            }
            const copy = [...prev];
            copy[idx] = {
              ...copy[idx],
              last_message_text: updated.last_message_text ?? copy[idx].last_message_text,
              last_message_at: updated.last_message_at ?? copy[idx].last_message_at,
              last_message_sender: updated.last_message_sender ?? copy[idx].last_message_sender,
            };
            // Re-sort by last_message_at DESC
            copy.sort((a, b) => {
              const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
              const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
              return tb - ta;
            });
            return copy;
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_members',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setConversations((prev) =>
            prev.map((c) =>
              c.conversation_id === updated.conversation_id
                ? { ...c, unread_count: updated.unread_count ?? c.unread_count }
                : c,
            ),
          );
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [user, loadConversations]);

  const openChat = useCallback(
    (convId: string) => {
      router.push(`/chat/${convId}` as any);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: InboxConversation }) => (
      <InboxRow
        item={item}
        foreground={c.foreground}
        mutedForeground={c.mutedForeground}
        onPress={() => openChat(item.conversation_id)}
      />
    ),
    [c.foreground, c.mutedForeground, openChat],
  );

  const keyExtractor = useCallback((item: InboxConversation) => item.conversation_id, []);

  const Separator = useCallback(
    () => <View style={[styles.sep, { borderBottomColor: c.border }]} />,
    [c.border],
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.title, { color: c.foreground }]}>Inbox</Text>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={48} color={c.mutedForeground} />
          <Text style={[styles.emptyText, { color: c.mutedForeground }]}>No conversations yet</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={Separator}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshing={refreshing}
          onRefresh={() => loadConversations(true)}
          removeClippedSubviews
          maxToRenderPerBatch={15}
          windowSize={10}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  title: { fontSize: 20, fontWeight: '800' },
  row: { flexDirection: 'row', padding: 14, alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  avatarPlaceholder: { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  meta: { flex: 1 },
  metaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  name: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  time: { fontSize: 12 },
  lastMessage: { fontSize: 13, flex: 1, marginRight: 8 },
  lastMessageUnread: { fontWeight: '600' },
  unreadBadge: { backgroundColor: '#ef4444', minWidth: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  emptyText: { fontSize: 15, marginTop: 8 },
  sep: { height: 0.5 },
});
