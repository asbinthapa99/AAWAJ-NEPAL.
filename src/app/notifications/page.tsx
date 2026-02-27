'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Notification } from '@/lib/types';
import Link from 'next/link';
import {
    Bell,
    Heart,
    MessageCircle,
    UserPlus,
    Repeat2,
    Loader2,
    CheckCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

function timeAgo(date: string): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

const ICON_MAP = {
    support: { icon: Heart, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' },
    comment: { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    follow: { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
    repost: { icon: Repeat2, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
};

const MESSAGE_MAP = {
    support: 'supported your post',
    comment: 'commented on your post',
    follow: 'started following you',
    repost: 'reposted your voice',
};

export default function NotificationsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [markingAll, setMarkingAll] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        const supabase = createClient();

        const { data } = await supabase
            .from('notifications')
            .select('*, from_user:profiles!notifications_from_user_id_fkey(*)')
            .eq('to_user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        const normalized = (data || []).map((n: Record<string, unknown>) => ({
            ...n,
            from_user: Array.isArray(n.from_user) ? n.from_user[0] : n.from_user,
        })) as Notification[];

        setNotifications(normalized);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/auth/login?next=/notifications');
            return;
        }
        if (user) fetchNotifications();
    }, [user, authLoading, router, fetchNotifications]);

    const markAsRead = async (id: string) => {
        const supabase = createClient();
        await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id', id);

        setNotifications((prev) =>
            prev.map((n) =>
                n.id === id ? { ...n, read_at: new Date().toISOString() } : n
            )
        );
    };

    const markAllRead = async () => {
        if (!user) return;
        setMarkingAll(true);
        const supabase = createClient();

        const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
        if (unreadIds.length > 0) {
            await supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .in('id', unreadIds);

            setNotifications((prev) =>
                prev.map((n) =>
                    !n.read_at ? { ...n, read_at: new Date().toISOString() } : n
                )
            );
        }
        setMarkingAll(false);
    };

    const getLink = (n: Notification): string => {
        if (n.type === 'follow') return `/profile/${n.from_user_id}`;
        if (n.entity_id) return `/post/${n.entity_id}`;
        return '#';
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1877F2]" />
            </div>
        );
    }

    if (!user) return null;

    const unreadCount = notifications.filter((n) => !n.read_at).length;

    return (
        <div className="min-h-[100dvh] bg-[#f0f2f5] dark:bg-[#18191a]">
            <div className="max-w-[680px] mx-auto px-4 py-6">
                <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-gray-100 dark:border-[#393a3b] p-4 mb-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-[#e4e6eb]">
                                Notifications
                            </h1>
                            {unreadCount > 0 && (
                                <p className="text-sm text-gray-500 dark:text-[#b0b3b8]">
                                    {unreadCount} unread
                                </p>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                disabled={markingAll}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1877F2] bg-[#e7f3ff] dark:bg-[#263951] rounded-lg hover:bg-[#d4ebff] dark:hover:bg-[#1e3a5f] transition-colors disabled:opacity-50"
                            >
                                {markingAll ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <CheckCheck className="w-3.5 h-3.5" />
                                )}
                                Mark all read
                            </button>
                        )}
                    </div>
                </div>

                {notifications.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-gray-100 dark:border-[#393a3b]">
                        <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-[#e4e6eb] mb-2">
                            No notifications yet
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-[#b0b3b8]">
                            When someone interacts with your posts, you&apos;ll see it here.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#242526] rounded-xl shadow-sm border border-gray-100 dark:border-[#393a3b] overflow-hidden divide-y divide-gray-100 dark:divide-[#393a3b]">
                        {notifications.map((n) => {
                            const config = ICON_MAP[n.type];
                            const Icon = config.icon;

                            return (
                                <Link
                                    key={n.id}
                                    href={getLink(n)}
                                    onClick={() => !n.read_at && markAsRead(n.id)}
                                    className={`flex items-start gap-3 px-4 py-3 hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors ${!n.read_at ? 'bg-[#e7f3ff]/50 dark:bg-[#263951]/30' : ''
                                        }`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 bg-gradient-to-br from-[#1877F2] to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                            {n.from_user?.full_name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div
                                            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${config.bg} flex items-center justify-center`}
                                        >
                                            <Icon className={`w-3 h-3 ${config.color}`} />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-900 dark:text-[#e4e6eb]">
                                            <span className="font-semibold">
                                                {n.from_user?.full_name || 'Someone'}
                                            </span>{' '}
                                            {MESSAGE_MAP[n.type]}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-[#b0b3b8] mt-0.5">
                                            {timeAgo(n.created_at)}
                                        </p>
                                    </div>

                                    {!n.read_at && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#1877F2] flex-shrink-0 mt-2" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
