import React, { Suspense, lazy, useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/providers/ThemeProvider';
import { FINNHUB_API_KEY } from '../../src/utils/constants';
import { GlassSkeleton } from '../../src/components/GlassSkeleton';

const LineChart = lazy(() =>
  import('react-native-chart-kit').then((m) => ({ default: m.LineChart }))
);

const { width } = Dimensions.get('window');

// ── Finnhub symbols for metals ────────────────────────────────────────────────
const METAL_CONFIG = [
  {
    id: 'gold',
    symbol: 'OANDA:XAU_USD',
    name: 'Gold (XAU/USD)',
    sub: 'Per Troy Ounce',
    emoji: '🥇',
    color: '#EAB308',
    glow: 'rgba(234, 179, 8, ',
    decimalPlaces: 2,
  },
  {
    id: 'silver',
    symbol: 'OANDA:XAG_USD',
    name: 'Silver (XAG/USD)',
    sub: 'Per Troy Ounce',
    emoji: '🥈',
    color: '#94A3B8',
    glow: 'rgba(148, 163, 184, ',
    decimalPlaces: 2,
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
interface MetalData {
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  sparkline: number[];
  lastUpdated: number;
}

type MetalState = Record<string, MetalData | null>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(v: number | null | undefined, decimals = 2): string {
  if (v == null || isNaN(v) || v === 0) return '--';
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function fmtChange(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '--';
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}

// Fetch a Finnhub quote for a symbol
async function fetchMetal(symbol: string): Promise<{ c: number; d: number; dp: number; h: number; l: number; pc: number } | null> {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
    );
    if (!res.ok) return null;
    const json = await res.json() as { c: number; d: number; dp: number; h: number; l: number; pc: number };
    // c = current, d = change, dp = change%, h = high, l = low, pc = prev close
    if (!json.c) return null;
    return json;
  } catch {
    return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function GoldSilverScreen() {
  const { c, mode } = useTheme();
  const router = useRouter();
  const isDark = mode === 'dark';

  const [metals, setMetals] = useState<MetalState>({ gold: null, silver: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // ── Fetch all metals ────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const results = await Promise.all(
      METAL_CONFIG.map(async (m) => {
        const q = await fetchMetal(m.symbol);
        if (!q) return { id: m.id, data: null };
        return {
          id: m.id,
          data: {
            price: q.c,
            prevClose: q.pc,
            change: q.d,
            changePercent: q.dp,
            high: q.h,
            low: q.l,
            // rolling sparkline: append current price
            sparkline: [q.pc, (q.pc + q.c) / 2, q.c], // seed with 3 points
            lastUpdated: Date.now(),
          } as MetalData,
        };
      })
    );

    if (!mountedRef.current) return;

    setMetals((prev) => {
      const next = { ...prev };
      for (const r of results) {
        if (r.data) {
          const existing = prev[r.id];
          // Append to sparkline, keep last 20 points for the chart
          const prevSparkline = existing?.sparkline ?? [];
          const newSparkline = [...prevSparkline, r.data.price].slice(-20);
          next[r.id] = { ...r.data, sparkline: newSparkline };
        }
      }
      return next;
    });
    setLastRefresh(new Date());
  }, []);

  // ── Poll every 30 seconds ───────────────────────────────────────────────────
  const schedulePoll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await fetchAll();
      schedulePoll();
    }, 30_000);
  }, [fetchAll]);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      await fetchAll();
      setLoading(false);
      schedulePoll();
    })();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchAll, schedulePoll]);

  // ── Pull-to-refresh ─────────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
    schedulePoll(); // reset timer
  }, [fetchAll, schedulePoll]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const cardBg = isDark ? '#111827' : '#f8fafc';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const surfaceBg = isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]} edges={['top']}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: cardBorder }]}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.canGoBack() ? router.back() : router.replace('/(tabs)/markets');
            } else {
              router.replace('/(tabs)/markets' as any);
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.backBtn, { backgroundColor: surfaceBg, borderColor: cardBorder }]}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color={c.foreground} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[styles.headerLabel, { color: c.mutedForeground }]}>Precious Metals</Text>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Gold & Silver</Text>
        </View>

        {/* Live indicator */}
        <View style={[styles.livePill, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)' }]}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: c.background }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.mutedForeground}
          />
        }
      >
        {/* ── Loading state ── */}
        {loading && (
          <View style={{ gap: 16 }}>
            {[1, 2].map((i) => (
              <View key={`skel-${i}`} style={[styles.mainCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.cardHeader, { marginBottom: 16 }]}>
                  <GlassSkeleton width={48} height={48} borderRadius={24} />
                  <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
                    <GlassSkeleton width={120} height={16} borderRadius={8} />
                    <GlassSkeleton width={80} height={12} borderRadius={6} />
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <GlassSkeleton width={100} height={24} borderRadius={8} />
                    <GlassSkeleton width={60} height={20} borderRadius={10} />
                  </View>
                </View>
                <GlassSkeleton width="100%" height={160} borderRadius={16} />
              </View>
            ))}
          </View>
        )}

        {/* ── Metal Cards ── */}
        {!loading && METAL_CONFIG.map((config) => {
          const data = metals[config.id];
          const isUp = (data?.changePercent ?? 0) >= 0;
          const accentColor = isUp ? '#10B981' : '#EF4444';
          // Sparkline must have at least 2 points
          const chartData = data && data.sparkline.length >= 2 ? data.sparkline : [0, 0];

          return (
            <View key={config.id} style={[styles.mainCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.metalEmoji}>{config.emoji}</Text>
                  <View>
                    <Text style={[styles.mainTitle, { color: c.foreground }]}>{config.name}</Text>
                    <Text style={[styles.mainSubtitle, { color: c.mutedForeground }]}>{config.sub}</Text>
                  </View>
                </View>
                <View style={styles.alignRight}>
                  <Text style={[styles.mainPrice, { color: c.foreground }]}>
                    {data ? fmt(data.price, config.decimalPlaces) : '--'}
                  </Text>
                  <View style={[styles.changeBadge, { backgroundColor: isUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                    <Ionicons
                      name={isUp ? 'trending-up' : 'trending-down'}
                      size={12}
                      color={accentColor}
                    />
                    <Text style={[styles.changeText, { color: accentColor }]}>
                      {data ? fmtChange(data.changePercent) : '--'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Chart */}
              <Suspense
                fallback={
                  <View style={styles.chartPlaceholder}>
                    <GlassSkeleton width="100%" height={160} borderRadius={16} />
                  </View>
                }
              >
                <LineChart
                  data={{
                    labels: chartData.map((_, i) => (i === 0 ? 'Open' : i === chartData.length - 1 ? 'Now' : '')),
                    datasets: [{ data: chartData }],
                  }}
                  width={width - 64}
                  height={160}
                  withDots={false}
                  withInnerLines={false}
                  withOuterLines={false}
                  withVerticalLines={false}
                  withHorizontalLines={false}
                  withVerticalLabels={false}
                  yAxisInterval={1}
                  chartConfig={{
                    backgroundColor: cardBg,
                    backgroundGradientFrom: cardBg,
                    backgroundGradientTo: cardBg,
                    decimalPlaces: config.decimalPlaces,
                    color: (opacity = 1) => `${config.glow}${opacity})`,
                    labelColor: () => c.mutedForeground,
                    propsForBackgroundLines: { strokeWidth: 0 },
                  }}
                  bezier
                  style={{ marginVertical: 8, borderRadius: 16, marginLeft: -20 }}
                />
              </Suspense>

              {/* Stats row */}
              <View style={[styles.statsRow, { backgroundColor: surfaceBg, borderRadius: 12, marginTop: 4 }]}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: c.mutedForeground }]}>High</Text>
                  <Text style={[styles.statValue, { color: '#10B981' }]}>{data ? fmt(data.high, 2) : '--'}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: cardBorder }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Low</Text>
                  <Text style={[styles.statValue, { color: '#EF4444' }]}>{data ? fmt(data.low, 2) : '--'}</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: cardBorder }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: c.mutedForeground }]}>Prev Close</Text>
                  <Text style={[styles.statValue, { color: c.foreground }]}>{data ? fmt(data.prevClose, 2) : '--'}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* ── All Metals List ── */}
        {!loading && (
          <>
            <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>All Precious Metals</Text>
            <View style={styles.list}>
              {METAL_CONFIG.map((config, i) => {
                const data = metals[config.id];
                const isUp = (data?.changePercent ?? 0) >= 0;
                const accentColor = isUp ? '#10B981' : '#EF4444';
                return (
                  <View key={`list-${i}`} style={[styles.listItem, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <Text style={styles.metalEmojiSm}>{config.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.symbol, { color: c.foreground }]}>{config.name.split(' ')[0]}</Text>
                      <Text style={[styles.companyName, { color: c.mutedForeground }]}>
                        {config.id === 'gold' ? 'XAU • per oz' : 'XAG • per oz'}
                      </Text>
                    </View>
                    <View style={styles.alignRight}>
                      <Text style={[styles.price, { color: c.foreground }]}>
                        {data ? fmt(data.price, 2) : '--'}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: isUp ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                        <Text style={[styles.badgeText, { color: accentColor }]}>
                          {isUp ? '↗ ' : '↘ '}{data ? fmtChange(data.changePercent) : '--'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Last updated */}
        {lastRefresh && (
          <Text style={[styles.updatedText, { color: c.mutedForeground }]}>
            Updated {lastRefresh.toLocaleTimeString()} · refreshes every 30s
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerCenter: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  // ── Content ──
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // ── Main Card ──
  mainCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  metalEmoji: {
    fontSize: 32,
  },
  metalEmojiSm: {
    fontSize: 24,
    marginRight: 12,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  mainSubtitle: {
    fontSize: 13,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  mainPrice: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chartPlaceholder: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  // ── Section ──
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  list: {
    gap: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  symbol: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  companyName: {
    fontSize: 12,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // ── Footer ──
  updatedText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
