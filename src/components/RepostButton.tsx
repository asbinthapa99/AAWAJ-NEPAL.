'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from './AuthProvider';
import { Repeat2, Loader2, X } from 'lucide-react';

interface RepostButtonProps {
    postId: string;
    postAuthorId: string;
    initialReposted?: boolean;
}

export default function RepostButton({
    postId,
    postAuthorId,
    initialReposted = false,
}: RepostButtonProps) {
    const { user } = useAuth();
    const [reposted, setReposted] = useState(initialReposted);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [caption, setCaption] = useState('');

    if (!user) return null;

    const handleRepost = async () => {
        setLoading(true);
        const supabase = createClient();

        const { error } = await supabase.from('reposts').insert({
            user_id: user.id,
            post_id: postId,
            caption: caption.trim() || null,
        });

        if (!error) {
            setReposted(true);
            setShowModal(false);
            setCaption('');

            // Notify post author (fire-and-forget)
            if (postAuthorId !== user.id) {
                supabase
                    .from('notifications')
                    .insert({
                        to_user_id: postAuthorId,
                        from_user_id: user.id,
                        type: 'repost',
                        entity_id: postId,
                    })
                    .then(() => { });
            }
        }

        setLoading(false);
    };

    const handleUnrepost = async () => {
        setLoading(true);
        const supabase = createClient();

        const { error } = await supabase
            .from('reposts')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', postId);

        if (!error) {
            setReposted(false);
        }
        setLoading(false);
    };

    return (
        <>
            <button
                onClick={() => (reposted ? handleUnrepost() : setShowModal(true))}
                disabled={loading}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg text-sm font-semibold transition-all group ${reposted
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-[#b0b3b8] hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c]'
                    }`}
                aria-label={reposted ? 'Remove repost' : 'Repost'}
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Repeat2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                )}
                <span className="hidden sm:inline">{reposted ? 'Reposted' : 'Repost'}</span>
            </button>

            {/* Repost Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[#242526] rounded-xl p-5 max-w-md w-full shadow-2xl border border-gray-200 dark:border-[#393a3b]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-[#e4e6eb]">
                                Repost to your feed
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1 rounded-lg hover:bg-[#f0f2f5] dark:hover:bg-[#3a3b3c] transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value.slice(0, 200))}
                            placeholder="Add a caption (optional)..."
                            rows={3}
                            className="w-full px-4 py-2.5 bg-[#f0f2f5] dark:bg-[#3a3b3c] rounded-lg text-sm outline-none text-gray-900 dark:text-[#e4e6eb] placeholder-gray-500 resize-none focus:ring-2 focus:ring-[#1877F2]/30"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{caption.length}/200</p>

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2.5 bg-[#e4e6eb] dark:bg-[#3a3b3c] text-gray-800 dark:text-[#e4e6eb] rounded-lg text-sm font-semibold hover:bg-[#d8dadf] dark:hover:bg-[#4e4f50] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRepost}
                                disabled={loading}
                                className="flex-1 px-4 py-2.5 bg-[#1877F2] text-white rounded-lg text-sm font-semibold hover:bg-[#166FE5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Repost
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
