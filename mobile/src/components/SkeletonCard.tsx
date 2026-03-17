import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';
import { GlassSkeleton, GlassCard, GlassCardHeader, GlassCardContent } from './GlassSkeleton';

const { width: W } = Dimensions.get('window');

export default function SkeletonCard() {
    const { c } = useTheme();
    return (
        <View style={{ padding: 16 }}>
            <GlassCard>
                <GlassCardHeader style={styles.headerRow}>
                    <GlassSkeleton style={styles.avatar} borderRadius={21} />
                    <View style={{ flex: 1, gap: 6 }}>
                        <GlassSkeleton style={{ height: 12, width: '45%' }} />
                        <GlassSkeleton style={{ height: 10, width: '25%' }} />
                    </View>
                </GlassCardHeader>
                <GlassCardContent>
                    <GlassSkeleton style={{ height: 13, width: '90%', marginBottom: 4 }} />
                    <GlassSkeleton style={{ height: 13, width: '70%', marginBottom: 16 }} />
                    <GlassSkeleton style={styles.image} borderRadius={12} />
                    <View style={styles.actionRow}>
                        <GlassSkeleton style={{ height: 12, width: 60 }} />
                        <GlassSkeleton style={{ height: 12, width: 60 }} />
                        <GlassSkeleton style={{ height: 12, width: 60 }} />
                    </View>
                </GlassCardContent>
            </GlassCard>
        </View>
    );
}

const styles = StyleSheet.create({
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21 },
    captionBlock: { paddingHorizontal: 14, paddingBottom: 12 },
    image: { width: '100%', height: W * 0.5 },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 14,
    },
});
