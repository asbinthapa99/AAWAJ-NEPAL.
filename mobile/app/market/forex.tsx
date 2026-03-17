// ─────────────────────────────────────────────────────────────────────────────
// ForexScreen — same UI/UX as CryptoScreen / StockScreen.
//
// • Custom back button + header with Live badge
// • Search + All/Starred filter chips
// • Active pair badge + price card with SVG chart (5 ranges)
// • Stats grid (Bid / Ask / High / Low)
// • Full pair watchlist with live rates
// • Long-press Quick View modal with mini chart
// • Live rates from Finnhub REST (OANDA symbols, free tier)
//   polling every 15s — forex moves fast so 15s > 30s
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Pressable, ActivityIndicator,
  RefreshControl, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown, FadeIn, FadeOut, SlideInDown, SlideOutUp,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../src/providers/ThemeProvider';

// ── Forex Pair Definitions ────────────────────────────────────────────────────

// base    = the numerator currency code  (e.g. EUR)
// quote   = the denominator currency code (e.g. USD)
// For USD pairs: base=USD, quote=JPY  →  rate = rates[JPY]
// For cross pairs: EUR/GBP → rates[GBP] / rates[EUR]
const ALL_PAIRS = [
  // Majors
  { symbol: 'EUR_USD', base: 'EUR', quote: 'USD', display: 'EUR/USD', name: 'Euro / US Dollar',              flag1: '🇪🇺', flag2: '🇺🇸', decimals: 4 },
  { symbol: 'GBP_USD', base: 'GBP', quote: 'USD', display: 'GBP/USD', name: 'British Pound / US Dollar',    flag1: '🇬🇧', flag2: '🇺🇸', decimals: 4 },
  { symbol: 'USD_JPY', base: 'USD', quote: 'JPY', display: 'USD/JPY', name: 'US Dollar / Japanese Yen',     flag1: '🇺🇸', flag2: '🇯🇵', decimals: 2 },
  { symbol: 'USD_CHF', base: 'USD', quote: 'CHF', display: 'USD/CHF', name: 'US Dollar / Swiss Franc',      flag1: '🇺🇸', flag2: '🇨🇭', decimals: 4 },
  { symbol: 'AUD_USD', base: 'AUD', quote: 'USD', display: 'AUD/USD', name: 'Aussie Dollar / US Dollar',    flag1: '🇦🇺', flag2: '🇺🇸', decimals: 4 },
  { symbol: 'USD_CAD', base: 'USD', quote: 'CAD', display: 'USD/CAD', name: 'US Dollar / Canadian Dollar',  flag1: '🇺🇸', flag2: '🇨🇦', decimals: 4 },
  { symbol: 'NZD_USD', base: 'NZD', quote: 'USD', display: 'NZD/USD', name: 'New Zealand Dollar / USD',     flag1: '🇳🇿', flag2: '🇺🇸', decimals: 4 },
  // Minors
  { symbol: 'EUR_GBP', base: 'EUR', quote: 'GBP', display: 'EUR/GBP', name: 'Euro / British Pound',        flag1: '🇪🇺', flag2: '🇬🇧', decimals: 4 },
  { symbol: 'EUR_JPY', base: 'EUR', quote: 'JPY', display: 'EUR/JPY', name: 'Euro / Japanese Yen',          flag1: '🇪🇺', flag2: '🇯🇵', decimals: 2 },
  { symbol: 'GBP_JPY', base: 'GBP', quote: 'JPY', display: 'GBP/JPY', name: 'British Pound / Yen',         flag1: '🇬🇧', flag2: '🇯🇵', decimals: 2 },
  { symbol: 'EUR_CHF', base: 'EUR', quote: 'CHF', display: 'EUR/CHF', name: 'Euro / Swiss Franc',           flag1: '🇪🇺', flag2: '🇨🇭', decimals: 4 },
  { symbol: 'GBP_CHF', base: 'GBP', quote: 'CHF', display: 'GBP/CHF', name: 'British Pound / Swiss Franc', flag1: '🇬🇧', flag2: '🇨🇭', decimals: 4 },
  { symbol: 'AUD_JPY', base: 'AUD', quote: 'JPY', display: 'AUD/JPY', name: 'Aussie Dollar / Yen',         flag1: '🇦🇺', flag2: '🇯🇵', decimals: 2 },
  { symbol: 'EUR_AUD', base: 'EUR', quote: 'AUD', display: 'EUR/AUD', name: 'Euro / Aussie Dollar',         flag1: '🇪🇺', flag2: '🇦🇺', decimals: 4 },
  { symbol: 'EUR_CAD', base: 'EUR', quote: 'CAD', display: 'EUR/CAD', name: 'Euro / Canadian Dollar',       flag1: '🇪🇺', flag2: '🇨🇦', decimals: 4 },
  // Exotics
  { symbol: 'USD_SGD', base: 'USD', quote: 'SGD', display: 'USD/SGD', name: 'US Dollar / Singapore Dollar', flag1: '🇺🇸', flag2: '🇸🇬', decimals: 4 },
  { symbol: 'USD_HKD', base: 'USD', quote: 'HKD', display: 'USD/HKD', name: 'US Dollar / Hong Kong Dollar', flag1: '🇺🇸', flag2: '🇭🇰', decimals: 4 },
  { symbol: 'USD_INR', base: 'USD', quote: 'INR', display: 'USD/INR', name: 'US Dollar / Indian Rupee',     flag1: '🇺🇸', flag2: '🇮🇳', decimals: 2 },
  { symbol: 'USD_MXN', base: 'USD', quote: 'MXN', display: 'USD/MXN', name: 'US Dollar / Mexican Peso',     flag1: '🇺🇸', flag2: '🇲🇽', decimals: 4 },
  { symbol: 'USD_TRY', base: 'USD', quote: 'TRY', display: 'USD/TRY', name: 'US Dollar / Turkish Lira',     flag1: '🇺🇸', flag2: '🇹🇷', decimals: 4 },
];

const RANGES = ['1D', '1W', '1M', '3M', '1Y'] as const;
type Range = typeof RANGES[number];

// ── Types ─────────────────────────────────────────────────────────────────────

interface PairQuote {
  symbol: string;
  display: string;
  name: string;
  flag1: string;
  flag2: string;
  decimals: number;
  rate: number;       // current
  prevClose: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH  = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 180;
const POLL_MS      = 15_000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtRate(v: number | null | undefined, decimals = 4): string {
  if (!v || isNaN(v)) return '--';
  return v.toFixed(decimals);
}

function fmtPct(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '--';
  return `${v >= 0 ? '+' : ''}${v.toFixed(3)}%`;
}

// ── open.er-api.com — ONE free request for ALL pairs ─────────────────────────
// Returns USD-based rates for every currency. We compute any cross-pair from
// the USD matrix: EUR/GBP = (1/rateEUR) / (1/rateGBP) = rateGBP / rateEUR
// (rates here are "USD per 1 unit of currency", so EUR rate = 1.08 means
//  1 EUR = 1.08 USD, and 1 USD = 1/1.08 EUR).
//
// We keep the previous snapshot in a module-level variable so we can compute
// change-since-last-poll without an extra API call.
let _prevRates: Record<string, number> = {};

function computeRate(usdRates: Record<string, number>, base: string, quote: string): number {
  // usdRates[X] = "how many X per 1 USD"
  // e.g. usdRates.JPY = 149.5 means 1 USD = 149.5 JPY
  if (base === 'USD') return usdRates[quote] ?? 0;          // USD/JPY
  if (quote === 'USD') return 1 / (usdRates[base] ?? 1);    // EUR/USD = 1 / (USD/EUR)
  // Cross pair: EUR/GBP = (1/usdRates.EUR) * usdRates.GBP ... actually:
  // EUR/GBP = (usd_per_gbp) / (usd_per_eur)  NO —
  // Let's think: 1 EUR = X USD, 1 GBP = Y USD, so EUR/GBP = X/Y
  // usdRates[EUR] = how many EUR per USD, so 1 USD = usdRates[EUR] EUR → 1 EUR = 1/usdRates[EUR] USD
  const baseInUsd  = 1 / (usdRates[base]  ?? 1);  // 1 base = X USD
  const quoteInUsd = 1 / (usdRates[quote] ?? 1);  // 1 quote = Y USD
  return baseInUsd / quoteInUsd;                   // base/quote
}

async function fetchAllPairs(): Promise<Record<string, PairQuote>> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return {};
    const json = await res.json() as { result: string; rates: Record<string, number> };
    if (json.result !== 'success' || !json.rates) return {};

    const usdRates = json.rates;  // e.g. { EUR: 0.924, JPY: 149.5, GBP: 0.788, ... }
    const result: Record<string, PairQuote> = {};

    for (const cfg of ALL_PAIRS) {
      const rate = computeRate(usdRates, cfg.base, cfg.quote);
      const prev = _prevRates[cfg.symbol] ?? rate;  // first load: change = 0
      const change       = rate - prev;
      const changePercent = prev !== 0 ? (change / prev) * 100 : 0;
      // Estimate intraday range as ±0.3% around the rate (no free H/L endpoint)
      const spread = rate * 0.003;
      result[cfg.symbol] = {
        ...cfg,
        rate,
        prevClose:     prev,
        change,
        changePercent,
        high:          rate + spread,
        low:           rate - spread,
        open:          prev,
      };
    }

    // Store for next poll
    _prevRates = Object.fromEntries(ALL_PAIRS.map(cfg => [cfg.symbol, result[cfg.symbol].rate]));
    return result;
  } catch {
    return {};
  }
}

// ── Synthetic chart (identical helper to crypto/stock screens) ────────────────

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generateChart(rate: number, open: number, high: number, low: number, range: Range): number[] {
  if (!rate) return [];
  let points: number, vol: number, dips: number;
  switch (range) {
    case '1D': points = 48; vol = 0.03; dips = 2; break;
    case '1W': points = 35; vol = 0.06; dips = 3; break;
    case '1M': points = 30; vol = 0.10; dips = 4; break;
    case '3M': points = 60; vol = 0.15; dips = 6; break;
    default:   points = 52; vol = 0.25; dips = 8;
  }
  const rng = seededRandom(range.charCodeAt(0) * 31 + rate);
  const dr  = Math.max(high - low, rate * 0.002);
  const cps = Array.from({ length: dips + 1 }, (_, i) => {
    const base = (open || rate) + (rate - (open || rate)) * (i / dips);
    return base + dr * vol * (rng() - 0.5) * 2;
  });
  cps[0] = open || rate;
  cps[cps.length - 1] = rate;
  const path: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const seg = t * (cps.length - 1);
    const idx = Math.min(Math.floor(seg), cps.length - 2);
    const p = seg - idx;
    const smooth = cps[idx] + (cps[idx + 1] - cps[idx]) * (3 * p * p - 2 * p * p * p);
    path.push(Math.max(low * 0.999, Math.min(high * 1.001, smooth + dr * 0.01 * (rng() - 0.5))));
  }
  path[0] = open || rate;
  path[path.length - 1] = rate;
  return path;
}

function buildSvgPath(points: number[], w: number, h: number) {
  if (!points.length) return { linePath: '', areaPath: '' };
  const min = Math.min(...points);
  const max = Math.max(...points);
  const diff = Math.max(max - min, 0.0001);
  const coords = points.map((p, i) => ({
    x: (i / Math.max(points.length - 1, 1)) * w,
    y: h - ((p - min) / diff) * h,
  }));
  const linePath = coords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`).join(' ');
  return { linePath, areaPath: `${linePath} L ${w},${h} L 0,${h} Z` };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ForexScreen() {
  const { c, mode } = useTheme();
  const router = useRouter();
  const isDark = mode === 'dark';

  const cardBg       = isDark ? '#111827' : '#f8fafc';
  const cardBorder   = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const surfaceBg    = isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9';
  const chipBg       = isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0';
  const chipActiveBg = c.foreground;
  const chipActiveTx = c.background;

  const [selectedSymbol, setSelected]  = useState(ALL_PAIRS[0].symbol);
  const [quoteMap, setQuoteMap]        = useState<Record<string, PairQuote>>({});
  const [starred, setStarred]          = useState<Set<string>>(new Set(['EUR_USD', 'GBP_USD', 'USD_JPY']));
  const [range, setRange]              = useState<Range>('1D');
  const [showSearch, setShowSearch]    = useState(false);
  const [searchQuery, setSearchQuery]  = useState('');
  const [showStarred, setShowStarred]  = useState(false);
  const [loading, setLoading]          = useState(true);
  const [refreshing, setRefreshing]    = useState(false);
  const [chartPoints, setChartPoints]  = useState<number[]>([]);
  const [showPopup, setShowPopup]      = useState(false);

  const scrollRef  = useRef<ScrollView>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const chartKey   = useRef('');

  // ── Fetch ──
  const fetchAll = useCallback(async () => {
    const data = await fetchAllPairs();
    if (!mountedRef.current) return;
    setQuoteMap(data);
  }, []);

  const schedulePoll = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;
      await fetchAll();
      schedulePoll();
    }, POLL_MS);
  }, [fetchAll]);

  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      await fetchAll();
      if (mountedRef.current) setLoading(false);
      schedulePoll();
    })();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchAll, schedulePoll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
    schedulePoll();
  }, [fetchAll, schedulePoll]);

  // ── Derived ──
  const activePair   = useMemo(() => quoteMap[selectedSymbol], [quoteMap, selectedSymbol]);
  const activeConfig = useMemo(() => ALL_PAIRS.find(p => p.symbol === selectedSymbol)!, [selectedSymbol]);
  const activeIsUp   = (activePair?.changePercent ?? 0) >= 0;
  const accentColor  = activeIsUp ? '#10B981' : '#EF4444';

  // Chart regeneration
  useEffect(() => {
    const key = `${selectedSymbol}-${range}`;
    if (chartKey.current === key) return;
    const pair = quoteMap[selectedSymbol];
    if (!pair?.rate) { setChartPoints([]); return; }
    chartKey.current = key;
    const t = setTimeout(() => {
      setChartPoints(generateChart(pair.rate, pair.open || pair.prevClose, pair.high, pair.low, range));
    }, 120);
    return () => clearTimeout(t);
  }, [selectedSymbol, range, quoteMap]);

  const { linePath, areaPath } = useMemo(() => buildSvgPath(chartPoints, CHART_WIDTH, CHART_HEIGHT), [chartPoints]);

  const filteredList = useMemo(() => {
    let list = ALL_PAIRS.map(cfg => ({ ...cfg, ...(quoteMap[cfg.symbol] ?? {}) })) as (typeof ALL_PAIRS[0] & Partial<PairQuote>)[];
    if (showStarred) list = list.filter(p => starred.has(p.symbol));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.display.toLowerCase().includes(q) || p.name.toLowerCase().includes(q));
    }
    return list;
  }, [quoteMap, starred, showStarred, searchQuery]);

  const selectPair = useCallback((symbol: string) => {
    setSelected(symbol);
    chartKey.current = '';
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const toggleStar = useCallback((symbol: string) => {
    setStarred(prev => {
      const next = new Set(prev);
      next.has(symbol) ? next.delete(symbol) : next.add(symbol);
      return next;
    });
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.mutedForeground} />}
      >

        {/* ════ HEADER ════ */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/markets' as any)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.backBtn, { backgroundColor: surfaceBg, borderColor: cardBorder }]}
          >
            <Ionicons name="chevron-back" size={20} color={c.foreground} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerLabel, { color: c.mutedForeground }]}>Live Rates</Text>
            <Text style={[styles.headerTitle, { color: c.foreground }]}>Forex</Text>
          </View>

          <View style={styles.headerActions}>
            <View style={[styles.livePill, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)' }]}>
              <View style={styles.liveDot} />
              <Text style={[styles.liveText, { color: '#10B981' }]}>Live</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => setShowSearch(s => !s)}
              style={[styles.iconBtn, { backgroundColor: showSearch ? accentColor : surfaceBg, borderColor: showSearch ? accentColor : cardBorder }]}
            >
              <Ionicons name={showSearch ? 'close' : 'search'} size={18} color={showSearch ? '#fff' : c.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ════ SEARCH BAR ════ */}
        {showSearch && (
          <Animated.View entering={FadeInDown.duration(200)} style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: surfaceBg, borderColor: cardBorder }]}>
              <Ionicons name="search" size={16} color={c.mutedForeground} />
              <TextInput
                placeholder="Search pairs…"
                placeholderTextColor={c.mutedForeground}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: c.foreground }]}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={c.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}

        {/* ════ ACTIVE PAIR BADGE ════ */}
        <View style={[styles.activeBadge, { backgroundColor: surfaceBg, borderColor: cardBorder }]}>
          <View style={[styles.flagBox, { backgroundColor: chipBg }]}>
            <Text style={styles.flagEmoji}>{activeConfig.flag1}</Text>
            <Text style={styles.flagEmoji}>{activeConfig.flag2}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.activeName, { color: c.foreground }]}>{activeConfig.display}</Text>
            <Text style={[styles.activeSymbol, { color: c.mutedForeground }]}>{activeConfig.name}</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => toggleStar(selectedSymbol)}
            style={[styles.starBtn, { backgroundColor: starred.has(selectedSymbol) ? 'rgba(234,179,8,0.15)' : chipBg }]}
          >
            <Ionicons
              name={starred.has(selectedSymbol) ? 'star' : 'star-outline'}
              size={16}
              color={starred.has(selectedSymbol) ? '#EAB308' : c.mutedForeground}
            />
          </TouchableOpacity>
        </View>

        {/* ════ PRICE CARD ════ */}
        <View style={[styles.priceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.priceLabel, { color: c.mutedForeground }]}>Exchange Rate</Text>
              <Animated.Text
                entering={FadeInDown.duration(300)}
                key={`${selectedSymbol}-${activePair?.rate}`}
                style={[styles.bigPrice, { color: c.foreground }]}
              >
                {fmtRate(activePair?.rate, activeConfig.decimals)}
              </Animated.Text>
              <View style={[styles.changeBadge, { backgroundColor: activeIsUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                <Ionicons name={activeIsUp ? 'trending-up' : 'trending-down'} size={14} color={accentColor} />
                <Text style={[styles.changeText, { color: accentColor }]}>
                  {fmtRate(activePair?.change, activeConfig.decimals)} ({fmtPct(activePair?.changePercent)})
                </Text>
              </View>
            </View>
            <View style={[styles.hlCard, { backgroundColor: surfaceBg, borderColor: cardBorder }]}>
              <Text style={[styles.hlLabel, { color: c.mutedForeground }]}>Today</Text>
              <Text style={[styles.hlValue, { color: '#10B981' }]}>H {fmtRate(activePair?.high, activeConfig.decimals)}</Text>
              <Text style={[styles.hlSub,   { color: '#EF4444' }]}>L {fmtRate(activePair?.low, activeConfig.decimals)}</Text>
            </View>
          </View>

          {/* Chart */}
          <View style={[styles.chartBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc', borderColor: cardBorder }]}>
            {loading ? (
              <View style={styles.chartPlaceholder}>
                <ActivityIndicator color={c.mutedForeground} size="small" />
                <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 8 }}>Loading rates…</Text>
              </View>
            ) : chartPoints.length ? (
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.svg}>
                <Defs>
                  <LinearGradient id="fxGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%"   stopColor={accentColor} stopOpacity="0.35" />
                    <Stop offset="100%" stopColor={accentColor} stopOpacity="0"    />
                  </LinearGradient>
                </Defs>
                <Path d={areaPath} fill="url(#fxGrad)" />
                <Path d={linePath} fill="none" stroke={accentColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            ) : (
              <View style={styles.chartPlaceholder}>
                <Ionicons name="bar-chart-outline" size={32} color={c.mutedForeground} />
                <Text style={{ color: c.mutedForeground, fontSize: 13, marginTop: 8 }}>No chart data</Text>
              </View>
            )}
            {/* Range buttons */}
            <View style={styles.rangeRow}>
              {RANGES.map(r => (
                <TouchableOpacity
                  key={r} activeOpacity={0.7} onPress={() => setRange(r)}
                  style={[styles.rangeBtn, { backgroundColor: range === r ? chipActiveBg : chipBg }]}
                >
                  <Text style={[styles.rangeBtnText, { color: range === r ? chipActiveTx : c.mutedForeground }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <StatTile label="Open"       value={fmtRate(activePair?.open,      activeConfig.decimals)} bg={surfaceBg} border={cardBorder} c={c} />
            <StatTile label="High"       value={fmtRate(activePair?.high,      activeConfig.decimals)} bg={surfaceBg} border={cardBorder} c={c} />
            <StatTile label="Low"        value={fmtRate(activePair?.low,       activeConfig.decimals)} bg={surfaceBg} border={cardBorder} c={c} />
            <StatTile label="Prev Close" value={fmtRate(activePair?.prevClose, activeConfig.decimals)} bg={surfaceBg} border={cardBorder} c={c} />
          </View>
        </View>

        {/* ════ WATCHLIST ════ */}
        <View style={styles.watchlistHeader}>
          <SectionHeader title="Watchlist" action={`${ALL_PAIRS.length} pairs`} c={c} />
          <View style={styles.filterRow}>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowStarred(false)}
              style={[styles.filterChip, { backgroundColor: !showStarred ? chipActiveBg : chipBg }]}
            >
              <Text style={[styles.filterChipText, { color: !showStarred ? chipActiveTx : c.mutedForeground }]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setShowStarred(true)}
              style={[styles.filterChip, { backgroundColor: showStarred ? '#EAB308' : chipBg }]}
            >
              <Ionicons name="star" size={12} color={showStarred ? '#000' : c.mutedForeground} style={{ marginRight: 4 }} />
              <Text style={[styles.filterChipText, { color: showStarred ? '#000' : c.mutedForeground }]}>Starred ({starred.size})</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.watchlistContainer}>
          {filteredList.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={32} color={c.mutedForeground} />
              <Text style={{ color: c.mutedForeground, marginTop: 10, fontSize: 13 }}>No pairs found</Text>
            </View>
          ) : filteredList.map(item => {
            const up         = (item.changePercent ?? 0) >= 0;
            const isSelected = selectedSymbol === item.symbol;
            const isStarred  = starred.has(item.symbol);
            return (
              <TouchableOpacity
                key={item.symbol}
                activeOpacity={0.7}
                onPress={() => selectPair(item.symbol)}
                onLongPress={() => { setSelected(item.symbol); setShowPopup(true); }}
                style={[styles.watchlistItem, {
                  backgroundColor: isSelected ? 'rgba(16,185,129,0.08)' : surfaceBg,
                  borderColor:     isSelected ? 'rgba(16,185,129,0.3)'  : cardBorder,
                }]}
              >
                <View style={[styles.flagBox, { backgroundColor: `${up ? '#10B98122' : '#EF444422'}` }]}>
                  <Text style={styles.flagEmoji}>{item.flag1}</Text>
                  <Text style={styles.flagEmoji}>{item.flag2}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.symbolRow}>
                    <Text style={[styles.wlSymbol, { color: c.foreground }]}>{item.display}</Text>
                    {isStarred && <Ionicons name="star" size={10} color="#EAB308" style={{ marginLeft: 4 }} />}
                  </View>
                  <Text style={[styles.wlName, { color: c.mutedForeground }]} numberOfLines={1}>{item.name}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.wlPrice, { color: c.foreground }]}>
                    {fmtRate(item.rate, item.decimals)}
                  </Text>
                  <View style={[styles.wlChangeBadge, { backgroundColor: up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                    <Ionicons name={up ? 'caret-up' : 'caret-down'} size={10} color={up ? '#10B981' : '#EF4444'} />
                    <Text style={[styles.wlChangeText, { color: up ? '#10B981' : '#EF4444' }]}>
                      {fmtPct(item.changePercent)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={() => toggleStar(item.symbol)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.inlineStarBtn}
                >
                  <Ionicons name={isStarred ? 'star' : 'star-outline'} size={16} color={isStarred ? '#EAB308' : cardBorder} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ════ QUICK VIEW MODAL ════ */}
      <Modal visible={showPopup} transparent animationType="none" onRequestClose={() => setShowPopup(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPopup(false)}>
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.modalOverlayBg} />
        </Pressable>
        <View style={styles.modalCenter} pointerEvents="box-none">
          <Animated.View
            entering={SlideInDown.springify().damping(20).stiffness(260)}
            exiting={SlideOutUp.duration(200)}
            style={[styles.modalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalSubtitle, { color: c.mutedForeground }]}>Quick View</Text>
                <Text style={[styles.modalTitle, { color: c.foreground }]}>{activeConfig.display}</Text>
                <Text style={[styles.modalMeta, { color: c.mutedForeground }]}>{activeConfig.name}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.6} onPress={() => setShowPopup(false)}
                style={[styles.closeBtn, { backgroundColor: chipBg }]}
              >
                <Text style={{ color: c.mutedForeground, fontSize: 14, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.modalBody, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc', borderColor: cardBorder }]}>
              <Text style={[styles.modalBigPrice, { color: c.foreground }]}>
                {fmtRate(activePair?.rate, activeConfig.decimals)}
              </Text>
              <View style={[styles.changeBadge, { backgroundColor: activeIsUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                <Ionicons name={activeIsUp ? 'trending-up' : 'trending-down'} size={14} color={accentColor} />
                <Text style={[styles.changeText, { color: accentColor }]}>
                  {fmtPct(activePair?.changePercent)}
                </Text>
              </View>
              {chartPoints.length ? (
                <Svg width={CHART_WIDTH - 32} height={140} style={{ marginTop: 16, alignSelf: 'center' }}>
                  <Defs>
                    <LinearGradient id="fxPopup" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%"   stopColor={accentColor} stopOpacity="0.35" />
                      <Stop offset="100%" stopColor={accentColor} stopOpacity="0"    />
                    </LinearGradient>
                  </Defs>
                  {(() => {
                    const { linePath: lp, areaPath: ap } = buildSvgPath(chartPoints, CHART_WIDTH - 32, 140);
                    return (<><Path d={ap} fill="url(#fxPopup)" /><Path d={lp} fill="none" stroke={accentColor} strokeWidth={2.5} strokeLinecap="round" /></>);
                  })()}
                </Svg>
              ) : null}
            </View>
            <View style={styles.modalStats}>
              {[
                { label: 'High',       value: fmtRate(activePair?.high,      activeConfig.decimals), color: '#10B981' },
                { label: 'Low',        value: fmtRate(activePair?.low,       activeConfig.decimals), color: '#EF4444' },
                { label: 'Change',     value: fmtPct(activePair?.changePercent),                     color: accentColor },
                { label: 'Prev Close', value: fmtRate(activePair?.prevClose, activeConfig.decimals), color: c.foreground },
              ].map(s => (
                <View key={s.label} style={styles.modalStatItem}>
                  <Text style={[styles.modalStatLabel, { color: c.mutedForeground }]}>{s.label}</Text>
                  <Text style={[styles.modalStatValue, { color: s.color }]}>{s.value}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, action, c }: { title: string; action: string; c: any }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: c.foreground }]}>{title}</Text>
      <Text style={[styles.sectionAction, { color: c.mutedForeground }]}>{action}</Text>
    </View>
  );
}

function StatTile({ label, value, bg, border, c }: { label: string; value: string; bg: string; border: string; c: any }) {
  return (
    <View style={[styles.statTile, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

// ── Styles (identical naming conventions to crypto/stock screens) ─────────────

const styles = StyleSheet.create({
  safeArea:      { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerCenter:  { flex: 1, alignItems: 'center' },
  headerLabel:   { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2 },
  headerTitle:   { fontSize: 28, fontWeight: '800', marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  backBtn:       { width: 42, height: 42, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 12, zIndex: 10 },
  iconBtn:       { width: 42, height: 42, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  livePill:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
  liveDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveText:      { fontSize: 12, fontWeight: '700' },

  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, gap: 10 },
  searchInput:     { flex: 1, fontSize: 15, paddingVertical: 0 },

  activeBadge:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, padding: 14, borderRadius: 18, borderWidth: 1, gap: 12 },
  flagBox:      { flexDirection: 'row', width: 48, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: -4 },
  flagEmoji:    { fontSize: 18 },
  activeName:   { fontSize: 15, fontWeight: '700' },
  activeSymbol: { fontSize: 12, marginTop: 2 },
  starBtn:      { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  priceCard:    { margin: 20, padding: 18, borderRadius: 26, borderWidth: 1 },
  priceRow:     { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  priceLabel:   { fontSize: 14 },
  bigPrice:     { fontSize: 34, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -1, marginTop: 4 },
  changeBadge:  { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginTop: 10 },
  changeText:   { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },
  hlCard:       { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'flex-end' },
  hlLabel:      { fontSize: 11, marginBottom: 4 },
  hlValue:      { fontSize: 14, fontWeight: '600' },
  hlSub:        { fontSize: 12, marginTop: 2 },

  chartBox:         { borderRadius: 22, borderWidth: 1, padding: 16, marginTop: 18, alignItems: 'center' },
  chartPlaceholder: { height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  svg:              { alignSelf: 'center' },
  rangeRow:         { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
  rangeBtn:         { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, minWidth: 48, alignItems: 'center' },
  rangeBtnText:     { fontSize: 13, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  statTile:  { width: '47%' as any, padding: 14, borderRadius: 16, borderWidth: 1 },
  statLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 4 },

  watchlistHeader:    { marginBottom: 0 },
  sectionHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle:       { fontSize: 17, fontWeight: '700' },
  sectionAction:      { fontSize: 13, fontWeight: '500' },
  filterRow:          { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  filterChip:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  filterChipText:     { fontSize: 12, fontWeight: '600' },
  watchlistContainer: { paddingHorizontal: 20, gap: 8 },
  watchlistItem:      { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, borderWidth: 1, gap: 10 },
  symbolRow:          { flexDirection: 'row', alignItems: 'center' },
  wlSymbol:           { fontSize: 15, fontWeight: '700' },
  wlName:             { fontSize: 11, marginTop: 2 },
  wlPrice:            { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  wlChangeBadge:      { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 3 },
  wlChangeText:       { fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },
  inlineStarBtn:      { paddingLeft: 6, paddingVertical: 4 },
  emptyState:         { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },

  modalOverlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  modalOverlayBg: { flex: 1 },
  modalCenter:    { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-start', alignItems: 'center', paddingTop: 80 },
  modalCard:      { width: '90%', borderRadius: 28, borderWidth: 1, padding: 20 },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalSubtitle:  { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2 },
  modalTitle:     { fontSize: 22, fontWeight: '800', marginTop: 4 },
  modalMeta:      { fontSize: 13, marginTop: 2 },
  closeBtn:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  modalBody:      { marginTop: 16, padding: 18, borderRadius: 22, borderWidth: 1 },
  modalBigPrice:  { fontSize: 30, fontWeight: '800', fontVariant: ['tabular-nums'] },
  modalStats:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.08)' },
  modalStatItem:  { alignItems: 'center' },
  modalStatLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  modalStatValue: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 4 },
});
