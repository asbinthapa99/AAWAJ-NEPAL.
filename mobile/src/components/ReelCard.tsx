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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withDelay, runOnJS } from 'react-native-reanimated';
import { useAuth } from '../providers/AuthProvider';
import AnimatedPressable from './AnimatedPressable';
import { supabase } from '../lib/supabase';
import { toggleSave, recordReelWatch } from '../lib/feedService';
import { Post } from '../lib/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ReelCardProps {
    post: Post;
    isVisible?: boolean;
}

export default function ReelCard({ post, isVisible = false }: ReelCardProps) {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    let tabBarHeight = 85; // fallback
    try {
        tabBarHeight = useBottomTabBarHeight();
    } catch (_) {}

    // The real visible reel height (full screen minus tab bar)
    const REEL_HEIGHT = SCREEN_HEIGHT - tabBarHeight;

    const [loved, setLoved] = useState(false);
    const [loveCount, setLoveCount] = useState(post.supports_count || 0);
    const [saved, setSaved] = useState(false);
    const [following, setFollowing] = useState(false);
    const [muted, setMuted] = useState(false);
    const [showPlayIcon, setShowPlayIcon] = useState(false);

    // Giant Heart Animation state
    const doubleTapScale = useSharedValue(0);

    // Watch-time tracking
    const watchStartRef = useRef<number | null>(null);
    const watchRecordedRef = useRef(false);

    useEffect(() => {
        if (isVisible && post.video_url) {
            watchStartRef.current = Date.now();
            watchRecordedRef.current = false;
        } else if (!isVisible && watchStartRef.current && user && !watchRecordedRef.current) {
            const watchDuration = (Date.now() - watchStartRef.current) / 1000;
            if (watchDuration > 1) {
                const videoDuration = player.duration || 0;
                recordReelWatch({ postId: post.id, userId: user.id, watchDuration, videoDuration });
                watchRecordedRef.current = true;
            }
            watchStartRef.current = null;
        }
    }, [isVisible]); // eslint-disable-line

    useEffect(() => {
        return () => {
            if (watchStartRef.current && user && !watchRecordedRef.current) {
                const watchDuration = (Date.now() - watchStartRef.current) / 1000;
                if (watchDuration > 1) {
                    recordReelWatch({ postId: post.id, userId: user.id, watchDuration, videoDuration: 0 });
                }
            }
        };
    }, []); // eslint-disable-line

    useEffect(() => {
        if (!user) return;
        supabase.from('saves').select('id').eq('post_id', post.id).eq('user_id', user.id)
            .maybeSingle()
            .then(({ data }) => { if (data) setSaved(true); });
    }, [post.id, user]);

    // Create video player — use null when no URL to avoid player errors
    const player = useVideoPlayer(post.video_url ?? null, (p) => {
        p.loop = true;
        p.muted = false;
    });

    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

    // Auto play/pause on visibility change
    useEffect(() => {
        if (!post.video_url) return;
        if (isVisible) {
            try { player.play(); } catch (_) {}
        } else {
            try { player.pause(); } catch (_) {}
        }
    }, [isVisible, post.video_url]); // eslint-disable-line

    // Sync muted state
    useEffect(() => {
        try { player.muted = muted; } catch (_) {}
    }, [muted]); // eslint-disable-line

    const handleLove = async () => {
        if (!user) return;
        if (loved) {
            setLoved(false);
            setLoveCount((p) => Math.max(0, p - 1));
            const { error } = await supabase.from('supports').delete().eq('post_id', post.id).eq('user_id', user.id);
            if (error) { setLoved(true); setLoveCount((p) => p + 1); }
        } else {
            setLoved(true);
            setLoveCount((p) => p + 1);
            const { error } = await supabase.from('supports').insert({ post_id: post.id, user_id: user.id });
            if (error) {
                if (error.code !== '23505') { setLoved(false); setLoveCount((p) => Math.max(0, p - 1)); }
            }
        }
    };

    const handleSave = useCallback(async () => {
        if (!user) return;
        setSaved((p) => !p);
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
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 800);
    };

    const runDoubleTapHeart = useCallback(() => {
        doubleTapScale.value = withSequence(
            withSpring(1, { damping: 12, stiffness: 200 }),
            withDelay(400, withSpring(0, { damping: 15, stiffness: 250 }))
        );
        if (!loved) {
            handleLove();
        }
    }, [loved, handleLove]);

    const singleTap = Gesture.Tap()
        .onEnd(() => {
            runOnJS(handleTap)();
        });

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            runOnJS(runDoubleTapHeart)();
        });

    const taps = Gesture.Exclusive(doubleTap, singleTap);

    const animatedHeartStyle = useAnimatedStyle(() => ({
        transform: [{ scale: Math.max(0, doubleTapScale.value) }]
    }));

    const formatCount = (num: number) => {
        if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
        if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
        return num.toString();
    };

    const BOTTOM_OFFSET = insets.bottom + tabBarHeight + 16;

    return (
        <GestureDetector gesture={taps}>
            <View style={[styles.container, { height: REEL_HEIGHT }]}>
                {/* ── Background ── */}
                {post.video_url ? (
                    <VideoView
                        player={player}
                        style={StyleSheet.absoluteFillObject}
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
                        colors={['#1e293b', '#0f172a']}
                        style={StyleSheet.absoluteFillObject}
                    />
                )}

                {/* ── Bottom gradient for legibility ── */}
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
                    locations={[0.35, 0.7, 1]}
                    style={styles.bottomGradient}
                />

                {/* ── Play/Pause flash icon ── */}
                {showPlayIcon && (
                    <View style={styles.playIconFlash} pointerEvents="none">
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={56}
                            color="rgba(255,255,255,0.9)"
                        />
                    </View>
                )}

                {/* ── Giant Double Tap Heart Overlay ── */}
                <Animated.View style={[styles.giantHeartOverlay, animatedHeartStyle]} pointerEvents="none">
                    <Ionicons name="heart" size={120} color="#f43f5e" />
                </Animated.View>

            {/* ── Right Action Bar ── */}
            <View style={[styles.rightBar, { bottom: BOTTOM_OFFSET }]}>
                {/* Author avatar */}
                <View style={styles.avatarWrap}>
                    {post.author?.avatar_url ? (
                        <Image source={{ uri: post.author.avatar_url }} style={styles.avatarImg} />
                    ) : (
                        <View style={styles.avatarFallback}>
                            <Text style={styles.avatarText}>{post.author?.full_name?.charAt(0) || 'U'}</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.followBadge}
                        onPress={() => setFollowing(!following)}
                    >
                        <Ionicons name={following ? 'checkmark' : 'add'} size={12} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.actionDiv} />

                {/* Love */}
                <View style={styles.actionItem}>
                    <AnimatedPressable onPress={handleLove}>
                        <Ionicons
                            name={loved ? 'heart' : 'heart-outline'}
                            size={32}
                            color={loved ? '#f43f5e' : '#fff'}
                        />
                    </AnimatedPressable>
                    <Text style={styles.actionText}>{formatCount(loveCount)}</Text>
                </View>

                {/* Comment */}
                <View style={styles.actionItem}>
                    <AnimatedPressable>
                        <Ionicons name="chatbubble-outline" size={30} color="#fff" />
                    </AnimatedPressable>
                    <Text style={styles.actionText}>{formatCount(post.comments_count || 0)}</Text>
                </View>

                {/* Share */}
                <View style={styles.actionItem}>
                    <AnimatedPressable>
                        <Ionicons name="paper-plane-outline" size={28} color="#fff" />
                    </AnimatedPressable>
                </View>

                {/* Save */}
                <View style={styles.actionItem}>
                    <AnimatedPressable onPress={handleSave}>
                        <Ionicons
                            name={saved ? 'bookmark' : 'bookmark-outline'}
                            size={28}
                            color={saved ? '#eab308' : '#fff'}
                        />
                    </AnimatedPressable>
                </View>

                {/* Mute — only for videos */}
                {post.video_url && (
                    <View style={styles.actionItem}>
                        <AnimatedPressable onPress={() => setMuted(!muted)}>
                            <Ionicons
                                name={muted ? 'volume-mute' : 'volume-high'}
                                size={24}
                                color="#fff"
                            />
                        </AnimatedPressable>
                    </View>
                )}
            </View>

            {/* ── Bottom Info Bar ── */}
            <View style={[styles.bottomInfo, { bottom: BOTTOM_OFFSET }]}>
                {/* Author name + Follow */}
                <View style={styles.authorRow}>
                    <Text style={styles.authorName} numberOfLines={1}>
                        @{post.author?.full_name?.toLowerCase().replace(/\s+/g, '_') || 'unknown'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.followBtn, following && styles.followingBtn]}
                        onPress={() => setFollowing(!following)}
                    >
                        <Text style={[styles.followBtnText, following && { color: '#fff' }]}>
                            {following ? 'Following' : 'Follow'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Caption */}
                <Text style={styles.caption} numberOfLines={3}>
                    {post.title && post.title !== post.content ? (
                        <Text style={styles.captionBold}>{post.title}{'  '}</Text>
                    ) : null}
                    {post.content}
                </Text>

                {/* Category tag */}
                {post.category && (
                    <View style={styles.categoryTag}>
                        <Text style={styles.categoryText}>#{post.category}</Text>
                    </View>
                )}
            </View>
            </View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        backgroundColor: '#000',
        overflow: 'hidden',
    },
    bottomGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: SCREEN_HEIGHT * 0.55,
    },
    playIconFlash: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 20,
    },
    giantHeartOverlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 25,
        elevation: 10,
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowRadius: 10,
    },
    // Right action bar
    rightBar: {
        position: 'absolute',
        right: 12,
        alignItems: 'center',
        gap: 18,
        zIndex: 10,
    },
    avatarWrap: {
        alignItems: 'center',
        marginBottom: 4,
    },
    avatarImg: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarFallback: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#6366f1',
        borderWidth: 2,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    followBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#f43f5e',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -10,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    actionDiv: {
        width: 32,
        height: 0.5,
        backgroundColor: 'rgba(255,255,255,0.3)',
        marginVertical: 2,
    },
    actionItem: {
        alignItems: 'center',
        gap: 3,
    },
    actionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    // Bottom info bar
    bottomInfo: {
        position: 'absolute',
        left: 14,
        right: 80,
        gap: 6,
        zIndex: 10,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    authorName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        flexShrink: 1,
    },
    followBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 14,
    },
    followingBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    followBtnText: {
        color: '#000',
        fontSize: 12,
        fontWeight: '700',
    },
    caption: {
        color: 'rgba(255,255,255,0.92)',
        fontSize: 14,
        lineHeight: 20,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    captionBold: {
        fontWeight: '700',
        color: '#fff',
    },
    categoryTag: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    categoryText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});
