// ─────────────────────────────────────────────────────────────────────────────
// StockChartScreen — detailed live chart page for a single stock.
//
// Navigated to from WatchlistScreen or MiniChartCard via:
//   router.push('/market/chart?symbol=AAPL')
//
// Features:
// • Large animated price display
// • Price change badge
// • Full-width interactive StockChart with timeframe selector + tooltip
// • High / Low / Volume / Prev Close stats
// • All values update live without page refresh
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStock } from '../state/selectors';
import AnimatedNumber from '../components/AnimatedNumber';
import PriceChangeBadge from '../components/PriceChangeBadge';
import MarketStatusBadge from '../components/MarketStatusBadge';
import StockChart from '../components/charts/StockChart';
import { useTheme } from '../providers/ThemeProvider';

export default function StockChartScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const stock = useStock(symbol ?? '');
  const { c, mode } = useTheme();
  const isDark = mode === 'dark';
  const router = useRouter();

  if (!stock) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
          No data for {symbol}
        </Text>
      </SafeAreaView>
    );
  }

  const isUp = stock.change >= 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Navigation Bar ── */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={[
            styles.backBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }
          ]}>
            <Ionicons name="chevron-back" size={22} color={c.foreground} />
          </TouchableOpacity>
          <MarketStatusBadge />
        </View>

        {/* ── Stock Header ── */}
        <View style={styles.stockHeader}>
          <Text style={[styles.symbol, { color: c.foreground }]}>{stock.symbol}</Text>
          <Text style={[styles.name, { color: c.mutedForeground }]}>{stock.name}</Text>
        </View>

        {/* ── Price Display ── */}
        <View style={styles.priceSection}>
          <AnimatedNumber
            value={stock.price}
            prefix="$"
            decimalPlaces={2}
            style={[styles.bigPrice, { color: c.foreground }]}
          />
          <View style={styles.changeRow}>
            <PriceChangeBadge changePercent={stock.changePercent} />
            <Text style={[styles.changeAbsolute, { color: isUp ? '#10B981' : '#EF4444' }]}>
              {isUp ? '+' : ''}{stock.change.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* ── Interactive Chart ── */}
        <View style={[
          styles.chartContainer,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.025)' : c.card,
            borderColor: isDark ? 'rgba(255,255,255,0.07)' : c.border,
          },
        ]}>
          <StockChart
            sparkline={stock.sparkline}
            updatedAt={stock.updatedAt}
            isUp={isUp}
            height={230}
          />
        </View>

        {/* ── Stats Grid ── */}
        <View style={styles.statsGrid}>
          <StatBox
            label="High"
            value={`$${stock.high.toFixed(2)}`}
            c={c}
            isDark={isDark}
            accent="#10B981"
          />
          <StatBox
            label="Low"
            value={`$${stock.low.toFixed(2)}`}
            c={c}
            isDark={isDark}
            accent="#EF4444"
          />
          <StatBox
            label="Volume"
            value={formatVolume(stock.volume)}
            c={c}
            isDark={isDark}
            accent={c.foreground}
          />
          <StatBox
            label="Prev Close"
            value={`$${stock.prevClose.toFixed(2)}`}
            c={c}
            isDark={isDark}
            accent={c.foreground}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Helper: stat box ──────────────────────────────────────────────────────────

function StatBox({
  label,
  value,
  c,
  isDark,
  accent,
}: {
  label: string;
  value: string;
  c: any;
  isDark: boolean;
  accent: string;
}) {
  return (
    <View style={[
      statStyles.box,
      {
        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : c.card,
        borderColor: isDark ? 'rgba(255,255,255,0.07)' : c.border,
      },
    ]}>
      <Text style={[statStyles.label, { color: c.mutedForeground }]}>{label}</Text>
      <Text style={[statStyles.value, { color: accent }]}>{value}</Text>
    </View>
  );
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return `${vol}`;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const statStyles = StyleSheet.create({
  box: {
    width: '47%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  label: { fontSize: 12, fontWeight: '500', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 100 },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockHeader: { marginBottom: 6 },
  symbol: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  name: { fontSize: 15, marginTop: 2 },
  priceSection: { marginBottom: 22 },
  bigPrice: {
    fontSize: 42,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  changeAbsolute: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  chartContainer: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyText: { fontSize: 16, padding: 24, textAlign: 'center' },
});
