'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';

interface FollowButtonProps {
    targetUserId: string;
    initialFollowing: boolean;
    onToggle?: (isFollowing: boolean) => void;
    size?: 'sm' | 'md';
}

export default function FollowButton({
    targetUserId,
    initialFollowing,
    onToggle,
    size = 'md',
}: FollowButtonProps) {
    const { user } = useAuth();
    const [following, setFollowing] = useState(initialFollowing);
    const [loading, setLoading] = useState(false);

    if (!user || user.id === targetUserId) return null;

    const handleToggle = async () => {
        setLoading(true);
        const supabase = createClient();

        if (following) {
            const { error } = await supabase
                .from('follows')
                .delete()
                .eq('follower_id', user.id)
                .eq('following_id', targetUserId);

            if (!error) {
                setFollowing(false);
                onToggle?.(false);
            }
        } else {
            const { error } = await supabase.from('follows').insert({
                follower_id: user.id,
                following_id: targetUserId,
            });

            if (!error) {
                setFollowing(true);
                onToggle?.(true);

                // Create notification (fire-and-forget)
                supabase
                    .from('notifications')
                    .insert({
                        to_user_id: targetUserId,
                        from_user_id: user.id,
                        type: 'follow',
                        entity_id: user.id,
                    })
                    .then(() => { });
            }
        }

        setLoading(false);
    };

    const sizeClasses =
        size === 'sm'
            ? 'px-3 py-1.5 text-xs gap-1'
            : 'px-4 py-2 text-sm gap-1.5';

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`inline-flex items-center font-semibold rounded-lg transition-all disabled:opacity-50 ${sizeClasses} ${following
                    ? 'bg-[#e4e6eb] dark:bg-[#3a3b3c] text-gray-800 dark:text-[#e4e6eb] hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400'
                    : 'bg-[#1877F2] text-white hover:bg-[#166FE5]'
                }`}
            aria-label={following ? 'Unfollow' : 'Follow'}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : following ? (
                <>
                    <UserMinus className="w-4 h-4" />
                    <span>Following</span>
                </>
            ) : (
                <>
                    <UserPlus className="w-4 h-4" />
                    <span>Follow</span>
                </>
            )}
        </button>
    );
}
