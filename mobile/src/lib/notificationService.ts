/**
 * Notification Service
 *
 * Manages notification delivery, preferences, push tokens,
 * and realtime subscriptions.
 *
 * Features:
 *   - Fetch & paginate notifications
 *   - Mark as read (single / all)
 *   - Notification preferences (per-type toggles, quiet hours)
 *   - Push token registration (Expo push)
 *   - Realtime subscription helper
 *   - Grouped notifications
 */

import { supabase } from './supabase';
import type { Notification } from './types';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// ─── Types ─────────────────────────────────────────────────

export type NotificationType =
  | 'support'
  | 'comment'
  | 'follow'
  | 'repost'
  | 'message'
  | 'save'
  | 'mention'
  | 'friend_request'
  | 'warning'
  | 'suspension'
  | 'report_resolved'
  | 'trending'
  | 'recommendation';

export interface NotificationPreferences {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  quiet_hours_start: string | null;     // "22:00"
  quiet_hours_end: string | null;       // "07:00"
  notify_supports: boolean;
  notify_comments: boolean;
  notify_follows: boolean;
  notify_mentions: boolean;
  notify_messages: boolean;
  notify_reposts: boolean;
  notify_friend_reqs: boolean;
  group_similar: boolean;
  min_interval_sec: number;
}

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'user_id'> = {
  push_enabled: true,
  email_enabled: false,
  quiet_hours_start: null,
  quiet_hours_end: null,
  notify_supports: true,
  notify_comments: true,
  notify_follows: true,
  notify_mentions: true,
  notify_messages: true,
  notify_reposts: true,
  notify_friend_reqs: true,
  group_similar: true,
  min_interval_sec: 5,
};


// ─── Fetch Notifications ───────────────────────────────────

export async function getNotifications(
  userId: string,
  limit: number = 30,
  offset: number = 0,
): Promise<Notification[]> {
  const { data } = await supabase
    .from('notifications')
    .select('*, from_user:profiles!notifications_from_user_id_fkey(id, username, full_name, avatar_url)')
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return (data ?? []) as Notification[];
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('to_user_id', userId)
    .is('read_at', null);

  return count ?? 0;
}


// ─── Mark as Read ──────────────────────────────────────────

export async function markAsRead(notificationId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId);
}

export async function markAllAsRead(userId: string): Promise<void> {
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('to_user_id', userId)
    .is('read_at', null);
}


// ─── Send Notification (used by other services) ────────────

export async function sendNotification(params: {
  toUserId: string;
  fromUserId: string;
  type: NotificationType;
  entityId?: string;
  data?: Record<string, unknown>;
  groupKey?: string;
}): Promise<void> {
  // Check preferences
  const prefs = await getPreferences(params.toUserId);

  // Check per-type toggle
  const typeToggles: Record<string, keyof NotificationPreferences> = {
    support: 'notify_supports',
    comment: 'notify_comments',
    follow: 'notify_follows',
    mention: 'notify_mentions',
    message: 'notify_messages',
    repost: 'notify_reposts',
    friend_request: 'notify_friend_reqs',
  };

  const toggleKey = typeToggles[params.type];
  if (toggleKey && prefs[toggleKey] === false) return; // user disabled this type

  // Insert notification
  await supabase.from('notifications').insert({
    to_user_id: params.toUserId,
    from_user_id: params.fromUserId,
    type: params.type,
    entity_id: params.entityId ?? null,
    data: params.data ?? {},
    group_key: params.groupKey ?? null,
  });
}


// ─── Preferences ───────────────────────────────────────────

export async function getPreferences(userId: string): Promise<NotificationPreferences> {
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (data) return data as NotificationPreferences;

  // Return defaults if no row exists
  return { user_id: userId, ...DEFAULT_PREFERENCES };
}

export async function updatePreferences(
  userId: string,
  updates: Partial<Omit<NotificationPreferences, 'user_id'>>,
): Promise<void> {
  await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
}


// ─── Push Token Registration ───────────────────────────────

export async function registerPushToken(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('[notifications] Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[notifications] Push permission denied');
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Upsert token
    await supabase.from('push_tokens').upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS as 'ios' | 'android',
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' },
    );

    return token;
  } catch (err: any) {
    console.warn('[notifications] token registration error:', err.message);
    return null;
  }
}

export async function deactivatePushToken(userId: string, token: string): Promise<void> {
  await supabase
    .from('push_tokens')
    .update({ active: false })
    .eq('user_id', userId)
    .eq('token', token);
}


// ─── Realtime Subscription ─────────────────────────────────

/**
 * Subscribe to new notifications in real-time.
 * Returns an unsubscribe function.
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: Notification) => void,
): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `to_user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as Notification);
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}


// ─── Configure notification handler (Expo) ─────────────────

export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });

  // Android-specific channel
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4f46e5',
    });
  }
}
