// ─────────────────────────────────────────────────────────────────────────────
// WatchlistScreen — the main screen showing all watched stocks live.
//
// ARCHITECTURE:
// • Wrapped in MarketDataProvider → WebSocket connects on mount
// • FlatList with getItemLayout → O(1) scroll for 100+ stocks
// • Each StockRow subscribes to its own symbol → isolated rerenders
// • MiniChartCards in a horizontal scroll at the top
// • MarketStatusBadge shows connection state
//
// This screen itself holds NO market state — it's a pure layout shell.
// All data flows: WebSocket → batcher → store → selectors → components.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../providers/ThemeProvider';
import { MarketDataProvider } from '../providers/MarketDataProvider';
import { useWatchlist } from '../state/selectors';
import { STOCK_ROW_HEIGHT } from '../utils/constants';

import StockRow from '../components/StockRow';
import MiniChartCard from '../components/MiniChartCard';
import MarketStatusBadge from '../components/MarketStatusBadge';

// ── Inner content (must be inside MarketDataProvider) ──

const WatchlistContent = React.memo(() => {
  const { c, mode } = useTheme();
  const watchlist = useWatchlist();
  const router = useRouter();

  const handleStockPress = useCallback((symbol: string) => {
    router.push(`/market/chart?symbol=${symbol}` as any);
  }, [router]);

  // ── Render callbacks (stable refs via useCallback) ──

  const renderStockRow = useCallback(
    ({ item }: { item: string }) => (
      <StockRow symbol={item} onPress={handleStockPress} />
    ),
    [handleStockPress]
  );

  const renderMiniChart = useCallback(
    ({ item }: { item: string }) => (
      <MiniChartCard symbol={item} onPress={handleStockPress} />
    ),
    [handleStockPress]
  );

  // getItemLayout → tells FlatList exact row offsets without measuring.
  // This is critical for smooth scrolling on large watchlists.
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: STOCK_ROW_HEIGHT,
      offset: STOCK_ROW_HEIGHT * index,
      index,
    }),
    []
  );

  const keyExtractor = useCallback((item: string) => item, []);

  // ── List header: charts section + section title ──
  const ListHeader = useCallback(() => (
    <View>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: c.foreground }]}>Watchlist</Text>
          <MarketStatusBadge />
        </View>
      </View>

      {/* ── Mini Charts (horizontal) ── */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>Charts</Text>
        <FlatList
          data={watchlist.slice(0, 6)}
          renderItem={renderMiniChart}
          keyExtractor={keyExtractor}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        />
      </View>

      {/* ── Stocks section label ── */}
      <Text style={[styles.sectionLabel, { color: c.mutedForeground, marginTop: 8 }]}>
        All Stocks
      </Text>
    </View>
  ), [c, watchlist, renderMiniChart, keyExtractor]);

  return (
    <FlatList
      data={watchlist}
      renderItem={renderStockRow}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      ListHeaderComponent={ListHeader}
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      // Performance: only render visible rows + buffer
      windowSize={7}
      maxToRenderPerBatch={10}
      removeClippedSubviews={true}
    />
  );
});

WatchlistContent.displayName = 'WatchlistContent';

// ── Exported Screen ──

export default function WatchlistScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <MarketDataProvider>
        <WatchlistContent />
      </MarketDataProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginLeft: 16,
    marginBottom: 10,
  },
  horizontalList: { paddingHorizontal: 16 },
});
