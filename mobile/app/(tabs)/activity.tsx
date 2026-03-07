import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/providers/ThemeProvider';
import { useAuth } from '../../src/providers/AuthProvider';
import { supabase } from '../../src/lib/supabase';
import { Notification } from '../../src/lib/types';
import { timeAgo } from '../../src/lib/theme';

const NOTIF_ICON: Record<string, { name: string; color: string }> = {
  support: { name: 'heart', color: '#f43f5e' },
  comment: { name: 'chatbubble', color: '#3b82f6' },
  follow: { name: 'person-add', color: '#8b5cf6' },
  repost: { name: 'repeat', color: '#22c55e' },
};

export default function ActivityScreen() {
  const { c } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*, from_user:profiles!notifications_from_user_id_fkey(id, full_name, username, avatar_url)')
      .eq('to_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setNotifications(data as Notification[]);
  }, [user]);

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false));
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconInfo = NOTIF_ICON[item.type] || NOTIF_ICON.support;
    const isRead = !!item.read_at;

    return (
      <TouchableOpacity
        style={[
          styles.notifRow,
          { backgroundColor: isRead ? c.background : c.muted },
          { borderBottomColor: c.border },
        ]}
      >
        <View style={[styles.notifIcon, { backgroundColor: iconInfo.color + '20' }]}>
          <Ionicons name={iconInfo.name as any} size={18} color={iconInfo.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.notifText, { color: c.foreground }]} numberOfLines={2}>
            <Text style={{ fontWeight: '700' }}>{item.from_user?.full_name || 'Someone'}</Text>
            {item.type === 'support' && ' loved your post'}
            {item.type === 'comment' && ' commented on your post'}
            {item.type === 'follow' && ' started following you'}
            {item.type === 'repost' && ' reposted your post'}
          </Text>
          <Text style={[styles.notifTime, { color: c.mutedForeground }]}>
            {timeAgo(item.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>Activity</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48, marginBottom: 8 }}>💤</Text>
              <Text style={[styles.emptyTitle, { color: c.foreground }]}>No notifications</Text>
              <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
                When someone interacts with you, it'll show here
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifText: { fontSize: 14, lineHeight: 20 },
  notifTime: { fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
});
