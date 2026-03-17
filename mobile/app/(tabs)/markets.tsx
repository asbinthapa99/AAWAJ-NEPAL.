import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/providers/ThemeProvider';
import MarketCard from '../../src/components/MarketCard';

const MARKET_CATEGORIES = [
  { id: 'stocks', title: 'Stocks', desc: 'Track company shares', icon: 'trending-up', route: '/(tabs)/../market/stocks', color: '#1B6BFF', iconType: 'ionicon' },
  { id: 'global', title: 'Global Markets', desc: 'Worldwide indices', icon: 'earth', route: '/(tabs)/../market/global', color: '#00A86B', iconType: 'ionicon' },
  { id: 'nepse', title: 'NEPSE Market', desc: 'Nepal Stock Exchange', icon: 'domain', route: '/(tabs)/../market/nepse', color: '#F59E0B', iconType: 'material' },
  { id: 'gold', title: 'Gold & Silver', desc: 'Metal prices', icon: 'diamond', route: '/(tabs)/../market/gold', color: '#EAB308', iconType: 'ionicon' },
  { id: 'forex', title: 'Forex', desc: 'Currency rates', icon: 'cash-outline', route: '/(tabs)/../market/forex', color: '#6366F1', iconType: 'ionicon' },
  { id: 'crypto', title: 'Crypto', desc: 'Digital assets', icon: 'logo-bitcoin', route: '/(tabs)/../market/crypto', color: '#F97316', iconType: 'ionicon' },
  { id: 'news', title: 'News', desc: 'Market updates', icon: 'newspaper-outline', route: '/(tabs)/../market/news', color: '#3B82F6', iconType: 'ionicon' },
 
];

export default function MarketHubScreen() {
  const { c, mode } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const ITEM_WIDTH = (width - 48) / 2; // 2 columns, 16px padding on sides + 16px between

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.foreground }]}>Market Hub</Text>
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>Explore and track financial assets in real-time</Text>
        </View>

        <View style={styles.grid}>
          {MARKET_CATEGORIES.map((cat) => (
            <MarketCard
              key={cat.id}
              title={cat.title}
              desc={cat.desc}
              icon={cat.icon}
              iconType={cat.iconType}
              color={cat.color}
              cardWidth={ITEM_WIDTH}
              cardBg={mode === 'dark' ? 'rgba(255,255,255,0.03)' : c.card}
              borderColor={mode === 'dark' ? 'rgba(255,255,255,0.05)' : c.border}
              foreground={c.foreground}
              mutedForeground={c.mutedForeground}
              onPress={() => router.push(cat.route as any)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // accommodate bottom tab bar
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
});
