import React, { useRef, useState, useCallback } from 'react';
import {
    View,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    ViewToken,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useAuth } from '../../src/providers/AuthProvider';
import { useFeed } from '../../src/lib/useFeed';
import ReelCard from '../../src/components/ReelCard';



export default function ReelsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const [visibleIndex, setVisibleIndex] = useState(0);
    const { height: screenHeight } = useWindowDimensions();

    let tabBarHeight = 85;
    try {
        tabBarHeight = useBottomTabBarHeight();
    } catch (_) {}

    // The snapping height must match exactly what ReelCard renders
    const REEL_HEIGHT = screenHeight - tabBarHeight;

    const feed = useFeed({
        feedType: 'reels',
        userId: user?.id,
        pageSize: 10,
    });

    useFocusEffect(
        useCallback(() => {
            feed.refresh();
        }, []) // eslint-disable-line
    );

    const onViewableItemsChanged = useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index != null) {
                setVisibleIndex(viewableItems[0].index);
                const item = viewableItems[0].item;
                if (item?.id) feed.trackView(item.id, 'reels');
            }
        }
    ).current;

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Floating header overlay */}
            <View style={[styles.floatingHeader, { paddingTop: Math.max(insets.top, 20) }]}>
                <Text style={styles.headerTitle}>Reels</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/create' as any)} activeOpacity={0.7}>
                    <Ionicons name="camera-outline" size={26} color="#ffffff" style={styles.headerIcon} />
                </TouchableOpacity>
            </View>

            {feed.loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#ffffff" />
                    <Text style={styles.loadingText}>Loading reels...</Text>
                </View>
            ) : (
                <FlatList
                    data={feed.posts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <ReelCard post={item} isVisible={index === visibleIndex} />
                    )}
                    pagingEnabled
                    showsVerticalScrollIndicator={false}
                    snapToInterval={REEL_HEIGHT}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    bounces={false}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    onEndReached={feed.loadMore}
                    onEndReachedThreshold={0.3}
                    refreshControl={
                        <RefreshControl
                            refreshing={feed.refreshing}
                            onRefresh={feed.refresh}
                            tintColor="#ffffff"
                            progressViewOffset={insets.top + 60}
                        />
                    }
                    ListEmptyComponent={
                        <View style={[styles.center, { height: REEL_HEIGHT }]}>
                            <Ionicons name="videocam-outline" size={64} color="rgba(255,255,255,0.5)" />
                            <Text style={styles.emptyTitle}>No reels yet</Text>
                            <Text style={styles.emptyText}>Be the first to post a video reel!</Text>
                            <TouchableOpacity
                                style={styles.postVideoBtn}
                                onPress={() => router.push('/(tabs)/create' as any)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="add-circle" size={20} color="#fff" />
                                <Text style={styles.postVideoBtnText}>Post a Video</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    floatingHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        zIndex: 100,
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 22,
        fontWeight: '800',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    headerIcon: {
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 8,
    },
    postVideoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ef4444',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 20,
        gap: 8,
    },
    postVideoBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});
