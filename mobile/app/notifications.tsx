import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/providers/ThemeProvider';
import { useAuth } from '../src/providers/AuthProvider';
import { supabase } from '../src/lib/supabase';

interface NotificationItem {
  id: string;
  type: 'support' | 'comment' | 'follow' | 'repost';
  from_user_id: string;
  entity_id: string | null;
  created_at: string;
  read_at: string | null;
  from_user?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

const NOTIFICATION_ICONS: Record<string, { name: string; color: string }> = {
  support: { name: 'heart', color: '#ef4444' },
  comment: { name: 'chatbubble', color: '#3b82f6' },
  follow: { name: 'person-add', color: '#8b5cf6' },
  repost: { name: 'repeat', color: '#10b981' },
};

const NOTIFICATION_TEXT: Record<string, string> = {
  support: 'loved your post',
  comment: 'commented on your post',
  follow: 'started following you',
  repost: 'reposted your post',
};

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function NotificationsScreen() {
  const { c } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, from_user:profiles!notifications_from_user_id_fkey(id, full_name, avatar_url)')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.log('[Notifications] error:', error.message);
        // Table may not exist yet — show empty
        setNotifications([]);
        return;
      }
      setNotifications((data || []) as NotificationItem[]);
    } catch (e) {
      console.log('[Notifications] catch:', e);
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handlePress = (item: NotificationItem) => {
    // Mark as read
    supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', item.id)
      .then(() => {});

    if (item.type === 'follow') {
      router.push(`/u/${item.from_user_id}` as any);
    } else if (item.entity_id) {
      router.push(`/post/${item.entity_id}` as any);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const iconConfig = NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.support;
    const text = NOTIFICATION_TEXT[item.type] || 'interacted with your post';
    const isUnread = !item.read_at;

    return (
      <TouchableOpacity
        style={[
          styles.notifRow,
          { backgroundColor: isUnread ? c.primary + '08' : 'transparent', borderBottomColor: c.border },
        ]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        {item.from_user?.avatar_url ? (
          <Image source={{ uri: item.from_user.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: c.muted }]}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: c.foreground }}>
              {item.from_user?.full_name?.charAt(0) || '?'}
            </Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.notifContent}>
          <Text style={[styles.notifText, { color: c.foreground }]} numberOfLines={2}>
            <Text style={{ fontWeight: '700' }}>{item.from_user?.full_name || 'Someone'}</Text>{' '}
            {text}
          </Text>
          <Text style={[styles.notifTime, { color: c.mutedForeground }]}>
            {timeAgo(item.created_at)}
          </Text>
        </View>

        {/* Type icon */}
        <View style={[styles.typeIcon, { backgroundColor: iconConfig.color + '18' }]}>
          <Ionicons name={iconConfig.name as any} size={16} color={iconConfig.color} />
        </View>

        {/* Unread dot */}
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={notifications.length === 0 ? { flex: 1 } : { paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={56} color={c.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: c.foreground }]}>No notifications yet</Text>
              <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
                When someone interacts with your posts, you'll see it here.
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
    gap: 2,
  },
  notifText: {
    fontSize: 14,
    lineHeight: 20,
  },
  notifTime: {
    fontSize: 12,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    left: 8,
    top: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  },
});
