'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';
import { ShieldOff, ShieldCheck, Loader2 } from 'lucide-react';

interface BlockButtonProps {
    targetUserId: string;
    initialBlocked: boolean;
    onToggle?: (isBlocked: boolean) => void;
}

export default function BlockButton({
    targetUserId,
    initialBlocked,
    onToggle,
}: BlockButtonProps) {
    const { user } = useAuth();
    const [blocked, setBlocked] = useState(initialBlocked);
    const [loading, setLoading] = useState(false);

    if (!user || user.id === targetUserId) return null;

    const handleToggle = async () => {
        if (!confirm(blocked ? 'Unblock this user?' : 'Block this user? They won\'t be able to see your content or interact with you.')) {
            return;
        }

        setLoading(true);
        const supabase = createClient();

        if (blocked) {
            const { error } = await supabase
                .from('blocks')
                .delete()
                .eq('blocker_id', user.id)
                .eq('blocked_id', targetUserId);

            if (!error) {
                setBlocked(false);
                onToggle?.(false);
            }
        } else {
            const { error } = await supabase.from('blocks').insert({
                blocker_id: user.id,
                blocked_id: targetUserId,
            });

            if (!error) {
                setBlocked(true);
                onToggle?.(true);
            }
        }

        setLoading(false);
    };

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`flex items-center gap-2 w-full px-4 py-2.5 text-sm transition-colors ${blocked
                    ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                    : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
            aria-label={blocked ? 'Unblock user' : 'Block user'}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : blocked ? (
                <ShieldCheck className="w-4 h-4" />
            ) : (
                <ShieldOff className="w-4 h-4" />
            )}
            {blocked ? 'Unblock user' : 'Block user'}
        </button>
    );
}
