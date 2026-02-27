'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';
import { Bell } from 'lucide-react';
import Link from 'next/link';

export default function NotificationBadge() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnread = useCallback(async () => {
        if (!user) return;
        const supabase = createClient();
        const { count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('to_user_id', user.id)
            .is('read_at', null);
        setUnreadCount(count || 0);
    }, [user]);

    useEffect(() => {
        fetchUnread();
        // Poll every 30s for new notifications
        const interval = setInterval(fetchUnread, 30000);
        return () => clearInterval(interval);
    }, [fetchUnread]);

    if (!user) return null;

    return (
        <Link
            href="/notifications"
            className="relative w-10 h-10 rounded-full bg-[#e4e6eb] dark:bg-[#3a3b3c] flex items-center justify-center hover:bg-[#d8dadf] dark:hover:bg-[#4e4f50] transition-colors"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
            <Bell className="w-5 h-5 text-gray-800 dark:text-[#e4e6eb]" />
            {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                </span>
            )}
        </Link>
    );
}
