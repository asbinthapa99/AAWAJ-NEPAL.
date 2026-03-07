import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';

const { width: W } = Dimensions.get('window');

function SkeletonBox({ style }: { style?: object }) {
    const { c } = useTheme();
    const pulse = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    return (
        <Animated.View
            style={[{ backgroundColor: c.muted, borderRadius: 6, opacity: pulse }, style]}
        />
    );
}

export default function SkeletonCard() {
    const { c } = useTheme();
    return (
        <View style={[styles.card, { backgroundColor: c.card, borderBottomColor: c.border }]}>
            {/* Header */}
            <View style={styles.header}>
                <SkeletonBox style={styles.avatar} />
                <View style={{ flex: 1, gap: 6 }}>
                    <SkeletonBox style={{ height: 12, width: '45%' }} />
                    <SkeletonBox style={{ height: 10, width: '25%' }} />
                </View>
            </View>
            {/* Caption lines */}
            <View style={styles.captionBlock}>
                <SkeletonBox style={{ height: 13, width: '90%', marginBottom: 7 }} />
                <SkeletonBox style={{ height: 13, width: '70%' }} />
            </View>
            {/* Image placeholder */}
            <SkeletonBox style={styles.image} />
            {/* Action row */}
            <View style={styles.actionRow}>
                <SkeletonBox style={{ height: 12, width: 60 }} />
                <SkeletonBox style={{ height: 12, width: 60 }} />
                <SkeletonBox style={{ height: 12, width: 60 }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { borderBottomWidth: 0.5, marginBottom: 6 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21 },
    captionBlock: { paddingHorizontal: 14, paddingBottom: 12 },
    image: { width: W, height: W * 0.55 },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 14,
    },
});
