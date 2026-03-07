import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../lib/supabase';
import { toggleSave, recordReelWatch } from '../lib/feedService';
import { Post } from '../lib/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReelCardProps {
    post: Post;
    isVisible?: boolean; // passed by FlatList via onViewableItemsChanged
}

export default function ReelCard({ post, isVisible = false }: ReelCardProps) {
    const { user } = useAuth();

    const [loved, setLoved] = useState(false);
    const [loveCount, setLoveCount] = useState(post.supports_count || 0);
    const [saved, setSaved] = useState(false);
    const [following, setFollowing] = useState(false);
    const [muted, setMuted] = useState(false);

    // ─── Watch-time tracking ────────────────────────────
    const watchStartRef = useRef<number | null>(null);
    const watchRecordedRef = useRef(false);

    // Start/stop watch timer based on visibility
    useEffect(() => {
        if (isVisible && post.video_url) {
            watchStartRef.current = Date.now();
            watchRecordedRef.current = false;
        } else if (!isVisible && watchStartRef.current && user && !watchRecordedRef.current) {
            // Reel scrolled away — record the watch
            const watchDuration = (Date.now() - watchStartRef.current) / 1000;
            if (watchDuration > 1) {
                // Estimate video duration from player (or 0 if unknown)
                const videoDuration = player.duration || 0;
                recordReelWatch({
                    postId: post.id,
                    userId: user.id,
                    watchDuration,
                    videoDuration,
                });
                watchRecordedRef.current = true;
            }
            watchStartRef.current = null;
        }
    }, [isVisible]); // eslint-disable-line react-hooks/exhaustive-deps

    // Record watch on unmount if still visible
    useEffect(() => {
        return () => {
            if (watchStartRef.current && user && !watchRecordedRef.current) {
                const watchDuration = (Date.now() - watchStartRef.current) / 1000;
                if (watchDuration > 1) {
                    recordReelWatch({
                        postId: post.id,
                        userId: user.id,
                        watchDuration,
                        videoDuration: 0,
                    });
                }
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Check if post is saved on mount
    useEffect(() => {
        if (!user) return;
        supabase
            .from('saves')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .maybeSingle()
            .then(({ data }) => {
                if (data) setSaved(true);
            });
    }, [post.id, user]);

    // Fallback gradient colors if no image and no video
    const fallbackColors = ['#1e293b', '#0f172a'] as const;

    // Create a video player instance using the new expo-video API.
    // Pass null (not empty string) when there is no video — an empty string
    // source puts the player in an error state that can prevent it from
    // working even when a real URL is later provided.
    const player = useVideoPlayer(post.video_url ?? null, (p) => {
        p.loop = true;
        p.muted = false;
    });

    // Track playing state via expo events
    const { isPlaying } = useEvent(player, 'playingChange', {
        isPlaying: player.playing,
    });

    // Play when visible, pause when scrolled away.
    // We intentionally omit `player` from the dep array — it is a stable
    // object reference returned by useVideoPlayer and does not change.
    useEffect(() => {
        if (!post.video_url) return;
        if (isVisible) {
            player.play();
        } else {
            player.pause();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible, post.video_url]);

    // Sync muted state
    useEffect(() => {
        player.muted = muted;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [muted]);

    const handleLove = async () => {
        if (!user) return;
        if (loved) {
            setLoved(false);
            setLoveCount((prev) => Math.max(0, prev - 1));
            const { error } = await supabase.from('supports').delete().eq('post_id', post.id).eq('user_id', user.id);
            if (error) {
                console.log('[ReelLove] delete error:', error.message);
                setLoved(true);
                setLoveCount((prev) => prev + 1);
            }
        } else {
            setLoved(true);
            setLoveCount((prev) => prev + 1);
            const { error } = await supabase.from('supports').insert({ post_id: post.id, user_id: user.id });
            if (error) {
                if (error.code === '23505') return; // already liked
                console.log('[ReelLove] insert error:', error.message);
                setLoved(false);
                setLoveCount((prev) => Math.max(0, prev - 1));
            }
        }
    };

    const toggleMuteAudio = () => {
        setMuted(!muted);
    };

    const handleSave = useCallback(async () => {
        if (!user) return;
        // Optimistic update
        setSaved((prev) => !prev);
        const result = await toggleSave(post.id, user.id);
        setSaved(result.saved);
    }, [user, post.id]);

    const handleTap = () => {
        if (!post.video_url) return;
        if (isPlaying) {
            player.pause();
        } else {
            player.play();
        }
    };

    const formatCount = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    return (
        <TouchableOpacity activeOpacity={1} onPress={handleTap} style={styles.container}>
            {/* Background: video > image > gradient */}
            {post.video_url ? (
                <VideoView
                    player={player}
                    style={[StyleSheet.absoluteFillObject, { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }]}
                    contentFit="cover"
                    nativeControls={false}
                    allowsFullscreen={false}
                />
            ) : post.image_url ? (
                <Image
                    source={{ uri: post.image_url }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                />
            ) : (
                <LinearGradient
                    colors={fallbackColors}
                    style={StyleSheet.absoluteFillObject}
                />
            )}

            {/* Dark Overlay at the bottom for text readability */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                style={styles.bottomOverlay}
            />

            {/* Right Side Action Bar */}
            <View style={styles.rightActionBar}>
                <View style={styles.actionItem}>
                    <TouchableOpacity onPress={handleLove} activeOpacity={0.7} style={styles.actionIcon}>
                        <Ionicons
                            name={loved ? 'heart' : 'heart-outline'}
                            size={32}
                            color={loved ? '#f43f5e' : '#ffffff'}
                        />
                    </TouchableOpacity>
                    <Text style={styles.actionText}>{formatCount(loveCount)}</Text>
                </View>

                <View style={styles.actionItem}>
                    <TouchableOpacity activeOpacity={0.7} style={styles.actionIcon}>
                        <Ionicons name="chatbubble-outline" size={30} color="#ffffff" />
                    </TouchableOpacity>
                    <Text style={styles.actionText}>{formatCount(post.comments_count || 0)}</Text>
                </View>

                <View style={styles.actionItem}>
                    <TouchableOpacity activeOpacity={0.7} style={styles.actionIcon}>
                        <Ionicons name="paper-plane-outline" size={30} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.actionItem}>
                    <TouchableOpacity onPress={handleSave} activeOpacity={0.7} style={styles.actionIcon}>
                        <Ionicons
                            name={saved ? 'bookmark' : 'bookmark-outline'}
                            size={28}
                            color={saved ? '#eab308' : '#ffffff'}
                        />
                    </TouchableOpacity>
                </View>

                {/* Mute/unmute toggle — only for video posts */}
                {post.video_url && (
                    <TouchableOpacity onPress={toggleMuteAudio} activeOpacity={0.7} style={styles.actionIcon}>
                        <Ionicons
                            name={muted ? 'volume-mute' : 'volume-high'}
                            size={24}
                            color="#ffffff"
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Bottom Left Info Bar */}
            <View style={styles.bottomInfoBar}>

                {/* User Info Row */}
                <View style={styles.userInfoRow}>
                    <View style={styles.avatarContainer}>
                        {post.author?.avatar_url ? (
                            <Image source={{ uri: post.author?.avatar_url }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarFallback}>
                                <Text style={styles.avatarFallbackText}>
                                    {post.author?.full_name?.charAt(0) || 'U'}
                                </Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.authorName} numberOfLines={1}>
                        {post.author?.full_name || 'Unknown'}
                    </Text>

                    <TouchableOpacity
                        style={[styles.followButton, following && styles.followingButton]}
                        onPress={() => setFollowing(!following)}
                    >
                        <Text style={[styles.followButtonText, following && styles.followingButtonText]}>
                            {following ? 'Following' : 'Follow'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Caption */}
                <View style={styles.captionContainer}>
                    <Text style={styles.captionText} numberOfLines={2}>
                        {post.title !== post.content ? `${post.title} — ` : ''}
                        {post.content}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT, // Fills entire screen height for snapping
        backgroundColor: '#000',
        position: 'relative',
    },
    bottomOverlay: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: SCREEN_HEIGHT * 0.45,
    },
    rightActionBar: {
        position: 'absolute',
        right: 12,
        bottom: 110, // Avoid bottom tab bar
        alignItems: 'center',
        gap: 16,
        zIndex: 10,
    },
    actionItem: {
        alignItems: 'center',
        gap: 4,
    },
    actionIcon: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    actionText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    bottomInfoBar: {
        position: 'absolute',
        left: 16,
        bottom: 110, // Avoid bottom tab bar
        right: 70, // Avoid right action bar
        zIndex: 10,
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarContainer: {
        marginRight: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    avatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: '#ffffff',
    },
    avatarFallback: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#3b82f6',
        borderWidth: 1.5,
        borderColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarFallbackText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
    },
    authorName: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 12,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        maxWidth: 120,
    },
    followButton: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    followingButton: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    followButtonText: {
        color: '#000000',
        fontSize: 13,
        fontWeight: '700',
    },
    followingButtonText: {
        color: '#ffffff',
    },
    captionContainer: {
        marginBottom: 8,
    },
    captionText: {
        color: '#ffffff',
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '400',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    tagsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    tagText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
});
