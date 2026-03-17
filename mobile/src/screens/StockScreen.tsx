// ─────────────────────────────────────────────────────────────────────────────
// StockScreen — premium stock dashboard with Finnhub REST API.
//
// Features:
// • Header with functional search & notifications
// • Active stock badge + star toggle
// • Price card with animated entry
// • SVG line+area chart with 5 responsive timeframe selectors
// • Stats grid (Open / High / Low / Prev Close)
// • Full watchlist of 20 popular stocks with live data
// • Market News section
// • Quick View modal on stock tap
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { FINNHUB_API_KEY } from '../utils/constants';
import { useTheme } from '../providers/ThemeProvider';
import MarketStatusBadge from '../components/MarketStatusBadge';
import { useStocks, useConnectionStatus } from '../state/selectors';
import { wsService } from '../api/websocketService';

// ── All Popular Stocks ───────────────────────────────────────────────────────

const ALL_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', domain: 'apple.com' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', exchange: 'NASDAQ', domain: 'microsoft.com' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', domain: 'google.com' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', domain: 'amazon.com' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', exchange: 'NASDAQ', domain: 'nvidia.com' },
  { symbol: 'META', name: 'Meta Platforms', exchange: 'NASDAQ', domain: 'meta.com' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', domain: 'tesla.com' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway', exchange: 'NYSE', domain: 'berkshirehathaway.com' },
  { symbol: 'JPM', name: 'JPMorgan Chase', exchange: 'NYSE', domain: 'jpmorganchase.com' },
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', domain: 'visa.com' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', domain: 'jnj.com' },
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', domain: 'walmart.com' },
  { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'NYSE', domain: 'mastercard.com' },
  { symbol: 'PG', name: 'Procter & Gamble', exchange: 'NYSE', domain: 'pg.com' },
  { symbol: 'DIS', name: 'Walt Disney Co.', exchange: 'NYSE', domain: 'thewaltdisneycompany.com' },
  { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', domain: 'netflix.com' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ', domain: 'amd.com' },
  { symbol: 'PYPL', name: 'PayPal Holdings', exchange: 'NASDAQ', domain: 'paypal.com' },
  { symbol: 'INTC', name: 'Intel Corp.', exchange: 'NASDAQ', domain: 'intel.com' },
  { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE', domain: 'salesforce.com' },
  { symbol: 'BA', name: 'Boeing Co.', exchange: 'NYSE', domain: 'boeing.com' },
  { symbol: 'NKE', name: 'Nike Inc.', exchange: 'NYSE', domain: 'nike.com' },
  { symbol: 'UBER', name: 'Uber Technologies', exchange: 'NYSE', domain: 'uber.com' },
  { symbol: 'SQ', name: 'Block Inc.', exchange: 'NYSE', domain: 'block.xyz' },
  { symbol: 'SNAP', name: 'Snap Inc.', exchange: 'NYSE', domain: 'snap.com' },
  { symbol: 'COIN', name: 'Coinbase Global', exchange: 'NASDAQ', domain: 'coinbase.com' },
  { symbol: 'PLTR', name: 'Palantir Technologies', exchange: 'NYSE', domain: 'palantir.com' },
  { symbol: 'RIVN', name: 'Rivian Automotive', exchange: 'NASDAQ', domain: 'rivian.com' },
  { symbol: 'SOFI', name: 'SoFi Technologies', exchange: 'NASDAQ', domain: 'sofi.com' },
  { symbol: 'SPY', name: 'S&P 500 ETF', exchange: 'NYSE', domain: 'spglobal.com' },
];

const NEWS_ITEMS = [
  { headline: 'Apple supplier outlook lifts tech sentiment', source: 'Reuters', time: '2h ago' },
  { headline: 'AI stocks continue strong momentum this week', source: 'Bloomberg', time: '3h ago' },
  { headline: 'Analysts raise targets on major chip makers', source: 'CNBC', time: '4h ago' },
  { headline: 'Fed signals potential rate adjustments ahead', source: 'WSJ', time: '5h ago' },
  { headline: 'Tesla delivers record quarterly numbers', source: 'MarketWatch', time: '6h ago' },
];

const RANGES = ['1D', '1W', '1M', '3M', '1Y'] as const;

// ── Types ────────────────────────────────────────────────────────────────────

interface FinnhubQuoteResponse {
  c: number; d: number; dp: number; h: number; l: number; o: number; pc: number;
}

interface FinnhubCandleResponse {
  c?: number[]; h?: number[]; l?: number[]; o?: number[]; s?: string; t?: number[]; v?: number[];
}

interface StockQuote {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  changeValue: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  up: boolean;
  logoUrl: string;
  domain: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(value?: number | null): string {
  if (value == null || Number.isNaN(value) || value === 0) return '--';
  return `$${Number(value).toFixed(2)}`;
}

function formatPercent(value?: number | null): string {
  if (value == null || Number.isNaN(value) || value === 0) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${Number(value).toFixed(2)}%`;
}

function getUnixRange(range: string) {
  const now = Math.floor(Date.now() / 1000);
  const day = 24 * 60 * 60;
  switch (range) {
    case '1D': return { from: now - day, to: now, resolution: '15' };
    case '1W': return { from: now - 7 * day, to: now, resolution: '60' };
    case '1M': return { from: now - 30 * day, to: now, resolution: 'D' };
    case '3M': return { from: now - 90 * day, to: now, resolution: 'D' };
    case '1Y': return { from: now - 365 * day, to: now, resolution: 'W' };
    default:   return { from: now - 30 * day, to: now, resolution: 'D' };
  }
}

function buildSvgPath(points: number[], width: number, height: number) {
  if (!points.length) return { linePath: '', areaPath: '' };
  const min = Math.min(...points);
  const max = Math.max(...points);
  const diff = Math.max(max - min, 1);

  const coords = points.map((p, i) => {
    const x = (i / Math.max(points.length - 1, 1)) * width;
    const y = height - ((p - min) / diff) * height;
    return { x, y };
  });

  const linePath = coords
    .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`)
    .join(' ');

  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;

  return { linePath, areaPath };
}

async function fetchQuote(symbol: string): Promise<FinnhubQuoteResponse> {
  const res = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
  );
  if (!res.ok) return { c: 0, d: 0, dp: 0, h: 0, l: 0, o: 0, pc: 0 };
  return res.json() as Promise<FinnhubQuoteResponse>;
}

// ── Synthetic Chart Generator (Free Tier Fallback) ───────────────────────────
// Generates distinct chart shapes per timeframe.
// Uses a seeded pseudo-random so each stock gets a consistent-looking pattern.
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateSyntheticChart(
  quote: StockQuote | null,
  range: string,
): number[] {
  if (!quote || !quote.price) return [];
  const { open, high, low, price } = quote;
  const dailyRange = Math.max(high - low, price * 0.01);

  // Config per timeframe
  let points: number;
  let volatilityFactor: number;
  let trendStrength: number;
  let dips: number; // number of trend reversals to simulate

  switch (range) {
    case '1D':
      points = 48;     // intraday 5-min candles
      volatilityFactor = 0.08;
      trendStrength = 0.15;
      dips = 2;
      break;
    case '1W':
      points = 35;     // hourly over a week
      volatilityFactor = 0.12;
      trendStrength = 0.10;
      dips = 3;
      break;
    case '1M':
      points = 30;     // daily over a month
      volatilityFactor = 0.18;
      trendStrength = 0.08;
      dips = 4;
      break;
    case '3M':
      points = 60;     // daily over 3 months
      volatilityFactor = 0.25;
      trendStrength = 0.05;
      dips = 6;
      break;
    case '1Y':
    default:
      points = 52;     // weekly over a year
      volatilityFactor = 0.35;
      trendStrength = 0.04;
      dips = 8;
      break;
  }

  // Seed from symbol charCodes so each stock gets a unique but stable chart
  const seed = quote.symbol.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
  // Add range to seed so each timeframe looks different
  const rangeSeed = range.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), seed);
  const rng = seededRandom(rangeSeed);

  // Generate distinct control points (dips/peaks) first
  const controlPoints: number[] = [];
  for (let i = 0; i <= dips; i++) {
    const progress = i / dips;
    const baseValue = open + (price - open) * progress;
    const swing = dailyRange * volatilityFactor * (rng() - 0.5) * 2;
    controlPoints.push(baseValue + swing);
  }
  controlPoints[0] = open;
  controlPoints[controlPoints.length - 1] = price;

  // Interpolate between control points with noise
  const path: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    // Find which segment we're in
    const segment = t * (controlPoints.length - 1);
    const segIndex = Math.min(Math.floor(segment), controlPoints.length - 2);
    const segProgress = segment - segIndex;

    // Smooth interpolation between control points
    const from = controlPoints[segIndex];
    const to = controlPoints[segIndex + 1];
    const smooth = from + (to - from) * (3 * segProgress * segProgress - 2 * segProgress * segProgress * segProgress);

    // Add micro-noise
    const noise = dailyRange * 0.02 * (rng() - 0.5);
    const value = smooth + noise;

    // Bound within reasonable range (wider for longer timeframes)
    const rangePadding = dailyRange * volatilityFactor * 0.5;
    path.push(Math.max(low - rangePadding, Math.min(high + rangePadding, value)));
  }

  // Ensure exact start and end
  path[0] = open;
  path[path.length - 1] = price;

  return path;
}

// ── Chart dimensions ─────────────────────────────────────────────────────────

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 180;

// ── Batch fetch helper (avoids Finnhub rate limit by staggering) ─────────────

async function fetchAllQuotes(
  stocks: typeof ALL_STOCKS,
  onBatchLoaded?: (quotes: StockQuote[]) => void,
): Promise<StockQuote[]> {
  const results: StockQuote[] = [];
  // Finnhub free-tier: ~30 req/min practical limit → batch of 2 with 2s gap
  const batchSize = 2;
  for (let i = 0; i < stocks.length; i += batchSize) {
    const batch = stocks.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        const logoUrl = `https://icon.horse/icon/${item.domain}`;

        try {
          const q = await fetchQuote(item.symbol);
          return {
            ...item,
            price: q.c,
            changeValue: q.d,
            changePercent: q.dp,
            high: q.h,
            low: q.l,
            open: q.o,
            previousClose: q.pc,
            up: Number(q.d) >= 0,
            logoUrl,
          } as StockQuote;
        } catch {
          return {
            ...item,
            price: 0,
            changeValue: 0,
            changePercent: 0,
            high: 0,
            low: 0,
            open: 0,
            previousClose: 0,
            up: true,
            logoUrl,
          } as StockQuote;
        }
      })
    );
    results.push(...batchResults);
    // Notify caller so UI updates progressively as data arrives
    onBatchLoaded?.(results);
    // 2-second delay between batches to stay well under Finnhub rate limit
    if (i + batchSize < stocks.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  return results;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function StockScreen() {
  const router = useRouter();
  const { c, mode } = useTheme();
  const isDark = mode === 'dark';

  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [showPopup, setShowPopup] = useState(false);
  const [range, setRange] = useState('1M');
  const [loading, setLoading] = useState(false); // don't block chart mount
  const [refreshing, setRefreshing] = useState(false);
  const [quoteMap, setQuoteMap] = useState<Record<string, StockQuote>>({});
  const [chartPoints, setChartPoints] = useState<number[]>([]);
  const [starred, setStarred] = useState<Set<string>>(new Set(['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL']));
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // ── Live WebSocket Data ──
  const liveStocks = useStocks();
  const connectionStatus = useConnectionStatus();

  // ── Merged Data ──
  // Merge REST API metadata (like logos) with LIVE WebSocket prices.
  const mergedWatchlist = useMemo(() => {
    return ALL_STOCKS.map((stockBase) => {
      const live = liveStocks[stockBase.symbol];
      const rest = quoteMap[stockBase.symbol];
      
      const price = live?.price ?? rest?.price ?? 0;
      const changeValue = live?.change ?? rest?.changeValue ?? 0;
      const changePercent = live?.changePercent ?? rest?.changePercent ?? 0;
      const high = live?.high ?? rest?.high ?? 0;
      const low = live?.low ?? rest?.low ?? 0;
      // In dev mode, REST data is not available, so derive open from prevClose or price
      const open = rest?.open || live?.prevClose || (price * (1 - (changePercent / 100))) || price;
      const previousClose = live?.prevClose ?? rest?.previousClose ?? 0;
      const up = changeValue >= 0;
      
      return {
        ...stockBase,
        price,
        changeValue,
        changePercent,
        high,
        low,
        open,
        previousClose,
        up,
        logoUrl: rest?.logoUrl ?? `https://icon.horse/icon/${stockBase.domain}`,
      };
    });
  }, [liveStocks, quoteMap]);

  const activeStock = useMemo(
    () => mergedWatchlist.find((s) => s.symbol === selectedStock) ?? mergedWatchlist[0] ?? null,
    [mergedWatchlist, selectedStock]
  );

  const { linePath, areaPath } = useMemo(
    () => buildSvgPath(chartPoints, CHART_WIDTH, CHART_HEIGHT),
    [chartPoints]
  );

  const activeQuote = quoteMap[selectedStock] ?? activeStock;
  const activeIsUp = Number(activeQuote?.changeValue ?? 0) >= 0;
  const accentColor = activeIsUp ? '#10B981' : '#EF4444';

  const filteredWatchlist = useMemo(() => {
    let list = mergedWatchlist;
    if (showStarredOnly) {
      list = list.filter((s) => starred.has(s.symbol));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [mergedWatchlist, searchQuery, showStarredOnly, starred]);

  // ── Load all stock quotes (Background Metadata Sync) ──────────────────────────────────────────────────

  const loadQuotes = useCallback(async () => {
    try {
      // Progressively load quotes — update UI after each batch of 2
      await fetchAllQuotes(ALL_STOCKS, (progressiveResults) => {
        setQuoteMap(
          progressiveResults.reduce(
            (acc, s) => ({ ...acc, [s.symbol]: s }),
            {} as Record<string, StockQuote>
          )
        );
      });
    } catch (e) {
      console.error('Failed to load watchlist quotes', e);
    }
  }, []);

  useEffect(() => {
    // 1. Subscribe to WS Live Data for all stocks
    if (connectionStatus === 'connected') {
      wsService.subscribe(ALL_STOCKS.map(s => s.symbol));
    }

    // 2. Load REST API metadata (logos, open/high/low) in the background
    loadQuotes();
  }, [loadQuotes, connectionStatus]);

  // ── Pull-to-refresh ────────────────────────────────────────────────────────

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadQuotes();
    setRefreshing(false);
  }, [loadQuotes]);

  // Track whether chart has been generated for the current stock+range
  const chartGenerated = useRef<string>('');

  useEffect(() => {
    if (!selectedStock) return;

    // Don't generate chart if we have no price data yet
    if (!activeStock?.price) {
      setChartPoints([]);
      return;
    }

    // Always regenerate when stock or range changes
    const key = `${selectedStock}-${range}`;
    if (chartGenerated.current === key) return;

    setLoading(true);
    chartGenerated.current = key;

    const timer = setTimeout(() => {
      setChartPoints(generateSyntheticChart(activeStock, range));
      setLoading(false);
    }, 120);

    return () => clearTimeout(timer);
  }, [selectedStock, range, activeStock?.price]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openStockPopup = useCallback((symbol: string) => {
    setSelectedStock(symbol);
    setShowPopup(true);
  }, []);

  const selectStock = useCallback((symbol: string) => {
    setSelectedStock(symbol);
    // Scroll to top to show selected stock info
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const toggleStar = useCallback((symbol: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  }, []);

  const handleNotifications = useCallback(() => {
    Alert.alert('Notifications', 'Price alerts and market notifications will appear here.');
  }, []);

  const handleBack = useCallback(() => {
    console.log('Back button pressed');
    try {
      // Navigate back to the markets tab
      router.replace('/(tabs)/markets');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback to home
      router.replace('/(tabs)/home');
    }
  }, []);

  // ── Palette helpers ────────────────────────────────────────────────────────

  const cardBg      = isDark ? '#1a1f2e' : '#ffffff';
  const pageBg      = isDark ? '#111827' : '#F7F7F2';
  const cardBorder  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const surfaceBg   = isDark ? 'rgba(255,255,255,0.04)' : '#F0F0EA';
  const chipBg      = isDark ? 'rgba(255,255,255,0.08)' : '#EBEBEB';
  const chipActiveBg   = isDark ? '#fff' : '#fff';
  const chipActiveText = isDark ? '#000' : '#000';

  // ── Touch chart state (PanResponder — no extra library needed) ────────────
  const touchX      = useRef<number | null>(null);
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);

  const panResponder = useRef(
    require('react-native').PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (evt: any) => {
        touchX.current = evt.nativeEvent.locationX;
        const idx = Math.round((evt.nativeEvent.locationX / CHART_WIDTH) * Math.max(chartPoints.length - 1, 1));
        setTooltipIdx(Math.max(0, Math.min(idx, chartPoints.length - 1)));
      },
      onPanResponderMove: (evt: any) => {
        touchX.current = evt.nativeEvent.locationX;
        const idx = Math.round((evt.nativeEvent.locationX / CHART_WIDTH) * Math.max(chartPoints.length - 1, 1));
        setTooltipIdx(Math.max(0, Math.min(idx, chartPoints.length - 1)));
      },
      onPanResponderRelease: () => {
        setTooltipIdx(null);
        touchX.current = null;
      },
      onPanResponderTerminate: () => {
        setTooltipIdx(null);
        touchX.current = null;
      },
    })
  ).current;

  // ── Chart tooltip data ──
  const tooltipData = useMemo(() => {
    if (tooltipIdx === null || !chartPoints.length) return null;
    const price = chartPoints[tooltipIdx];
    const open  = activeQuote?.open || activeQuote?.previousClose || price;
    const chg   = price - open;
    const chgPct = open ? (chg / open) * 100 : 0;
    const x = (tooltipIdx / Math.max(chartPoints.length - 1, 1)) * CHART_WIDTH;
    const { coords: _c } = (() => {
      const min  = Math.min(...chartPoints);
      const max  = Math.max(...chartPoints);
      const diff = Math.max(max - min, 1);
      return { coords: { y: CHART_HEIGHT - ((price - min) / diff) * CHART_HEIGHT } };
    })();
    return { price, chg, chgPct, x, y: _c.y };
  }, [tooltipIdx, chartPoints, activeQuote]);

  // ── X-axis labels per range ──
  const xLabels = useMemo(() => {
    switch (range) {
      case '1D': return ['9 AM', '11 AM', '1 PM', '3 PM', '4 PM'];
      case '1W': return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      case '1M': return ['Wk1', 'Wk2', 'Wk3', 'Wk4'];
      case '3M': return ['Jan', 'Feb', 'Mar'];
      case '1Y': return ['Q1', 'Q2', 'Q3', 'Q4'];
      default:   return [];
    }
  }, [range]);


  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: pageBg }]} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={tooltipIdx === null}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.mutedForeground} />
        }
      >

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.circleBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <Ionicons name="chevron-back" size={20} color={c.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Stock Details</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleNotifications}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.circleBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={c.foreground} />
          </TouchableOpacity>
        </View>

        {/* MAIN CARD */}
        <View style={[styles.mainCard, { backgroundColor: cardBg, shadowColor: isDark ? '#000' : '#aaa' }]}>
          {/* Stock badge row */}
          <View style={styles.stockBadgeRow}>
            <View style={[styles.logoWrap, { backgroundColor: isDark ? '#1e2538' : '#f5f0e8' }]}>
              <Image
                source={{ uri: activeQuote?.logoUrl ?? `https://icon.horse/icon/${activeStock?.domain ?? 'apple.com'}` }}
                style={styles.logoImg}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.tickerLabel, { color: c.foreground }]}>{selectedStock}</Text>
              <Text style={[styles.companyLabel, { color: c.mutedForeground }]}>{activeStock?.name ?? '—'}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setRange(range)}
              style={[styles.rangePill, { backgroundColor: surfaceBg, borderColor: cardBorder }]}
            >
              <Text style={[styles.rangePillText, { color: c.foreground }]}>{range}</Text>
              <Ionicons name="chevron-down" size={13} color={c.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Big price */}
          <Animated.Text
            entering={FadeInDown.duration(300)}
            key={`${selectedStock}-${activeQuote?.price}`}
            style={[styles.bigPrice, { color: c.foreground }]}
          >
            {formatPrice(activeQuote?.price)}
          </Animated.Text>

          {/* % pill */}
          <View style={[styles.pctPill, { backgroundColor: activeIsUp ? '#E6F9F1' : '#FEE9E9' }]}>
            <Text style={[styles.pctText, { color: activeIsUp ? '#15803d' : '#b91c1c' }]}>
              {activeIsUp ? '↑' : '↓'} {Math.abs(activeQuote?.changePercent ?? 0).toFixed(2)}%
            </Text>
          </View>

          {/* Interactive Touch Chart */}
          <View style={styles.chartWrap} {...panResponder.panHandlers}>
            {loading ? (
              <View style={styles.chartPlaceholder}>
                <ActivityIndicator color={c.mutedForeground} size="small" />
              </View>
            ) : chartPoints.length ? (
              <>
                {tooltipData && (
                  <View style={[
                    styles.tooltipPill,
                    {
                      left: Math.min(Math.max(tooltipData.x - 56, 0), CHART_WIDTH - 112),
                      top: Math.max(tooltipData.y - 54, 0),
                    },
                  ]}>
                    <Text style={styles.tooltipPrice}>{formatPrice(tooltipData.price)}</Text>
                    <Text style={[styles.tooltipChg, { color: tooltipData.chg >= 0 ? '#10B981' : '#EF4444' }]}>
                      {tooltipData.chg >= 0 ? '↑' : '↓'} {Math.abs(tooltipData.chgPct).toFixed(2)}%
                    </Text>
                  </View>
                )}
                <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.svg}>
                  <Defs>
                    <LinearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={accentColor} stopOpacity="0.22" />
                      <Stop offset="100%" stopColor={accentColor} stopOpacity="0" />
                    </LinearGradient>
                  </Defs>
                  <Path d={areaPath} fill="url(#stockGrad)" />
                  <Path d={linePath} fill="none" stroke={accentColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  {tooltipData && (
                    <>
                      <Path
                        d={`M ${tooltipData.x},0 L ${tooltipData.x},${CHART_HEIGHT}`}
                        stroke={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)'}
                        strokeWidth={1}
                        strokeDasharray="4,4"
                      />
                      <Path
                        d={`M ${tooltipData.x},${tooltipData.y} m -9,0 a 9,9 0 1,0 18,0 a 9,9 0 1,0 -18,0`}
                        fill={accentColor}
                        fillOpacity={0.2}
                      />
                      <Path
                        d={`M ${tooltipData.x},${tooltipData.y} m -4,0 a 4,4 0 1,0 8,0 a 4,4 0 1,0 -8,0`}
                        fill="#fff"
                        stroke={accentColor}
                        strokeWidth={2}
                      />
                    </>
                  )}
                </Svg>
                <View style={styles.xAxisRow}>
                  {xLabels.map((lbl) => (
                    <Text key={lbl} style={[styles.xLabel, { color: c.mutedForeground }]}>{lbl}</Text>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.chartPlaceholder}>
                <Ionicons name="bar-chart-outline" size={32} color={c.mutedForeground} />
              </View>
            )}
          </View>

          {/* Range pill tabs */}
          <View style={[styles.rangeTabRow, { backgroundColor: surfaceBg }]}>
            {(['1D', '1W', '1M', '3M', '1Y'] as const).map((r) => (
              <TouchableOpacity
                key={r}
                activeOpacity={0.7}
                onPress={() => setRange(r)}
                style={[styles.rangeTabBtn, range === r && styles.rangeTabActive]}
              >
                <Text style={[styles.rangeTabText, { color: range === r ? '#000' : c.mutedForeground }, range === r && { fontWeight: '700' }]}>
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* STATS GRID */}
        <View style={[styles.statsCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {[
            { label: 'Open',       value: formatPrice(activeQuote?.open) },
            { label: 'High',       value: formatPrice(activeQuote?.high) },
            { label: 'Low',        value: formatPrice(activeQuote?.low) },
            { label: 'Prev Close', value: formatPrice(activeQuote?.previousClose) },
          ].map((s, i) => (
            <View key={s.label} style={[styles.statItem, i % 2 === 0 && { borderRightWidth: 1, borderRightColor: cardBorder }]}>
              <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{s.label}</Text>
              <Text style={[styles.statValue, { color: c.foreground }]}>{s.value}</Text>
            </View>
          ))}
        </View>

        {/* SEARCH */}
        {showSearch && (
          <Animated.View entering={FadeInDown.duration(200)} style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Ionicons name="search" size={16} color={c.mutedForeground} />
              <TextInput
                placeholder="Search stocks..."
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

        {/* WATCHLIST HEADER */}
        <View style={styles.watchlistHeader}>
          <Text style={[styles.watchlistTitle, { color: c.foreground }]}>My Portfolio</Text>
          <View style={styles.watchlistActions}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowSearch((s) => !s)}
              style={[styles.smallBtn, { backgroundColor: showSearch ? accentColor : surfaceBg }]}
            >
              <Ionicons name={showSearch ? 'close' : 'search'} size={15} color={showSearch ? '#fff' : c.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowStarredOnly((p) => !p)}
              style={[styles.smallBtn, { backgroundColor: showStarredOnly ? '#EAB308' : surfaceBg }]}
            >
              <Ionicons name="star" size={14} color={showStarredOnly ? '#000' : c.mutedForeground} />
            </TouchableOpacity>
            <Text style={[styles.seeAllText, { color: c.mutedForeground }]}>See all</Text>
          </View>
        </View>

        {/* WATCHLIST ITEMS */}
        <View style={styles.watchlistContainer}>
          {filteredWatchlist.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
              <Ionicons name="search-outline" size={28} color={c.mutedForeground} />
              <Text style={{ color: c.mutedForeground, marginTop: 8, fontSize: 13 }}>No stocks found</Text>
            </View>
          ) : (
            filteredWatchlist.map((item) => {
              const itemUp     = Number(item.changeValue ?? 0) >= 0;
              const isSelected = selectedStock === item.symbol;
              const isStarred  = starred.has(item.symbol);
              const sparkPts   = generateSyntheticChart(item as any, '1D').filter((_, i) => i % 4 === 0);
              const { linePath: sLine } = buildSvgPath(sparkPts, 48, 24);
              return (
                <TouchableOpacity
                  key={item.symbol}
                  activeOpacity={0.7}
                  onPress={() => selectStock(item.symbol)}
                  onLongPress={() => openStockPopup(item.symbol)}
                  style={[
                    styles.wlItem,
                    {
                      backgroundColor: isSelected ? (isDark ? 'rgba(16,185,129,0.10)' : '#F0FDF8') : cardBg,
                      borderColor: isSelected ? 'rgba(16,185,129,0.3)' : cardBorder,
                    },
                  ]}
                >
                  <Image source={{ uri: item.logoUrl }} style={[styles.wlLogo, { backgroundColor: surfaceBg }]} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={[styles.wlSymbol, { color: c.foreground }]}>{item.symbol}</Text>
                      {isStarred && <Ionicons name="star" size={9} color="#EAB308" />}
                    </View>
                    <Text style={[styles.wlName, { color: c.mutedForeground }]} numberOfLines={1}>{item.name}</Text>
                  </View>
                  {sparkPts.length > 1 && (
                    <Svg width={48} height={24} style={{ marginHorizontal: 8 }}>
                      <Path d={sLine} fill="none" stroke={itemUp ? '#10B981' : '#EF4444'} strokeWidth={1.5} strokeLinecap="round" />
                    </Svg>
                  )}
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.wlPrice, { color: c.foreground }]}>{formatPrice(item.price)}</Text>
                    <View style={[styles.wlBadge, { backgroundColor: itemUp ? '#E6F9F1' : '#FEE9E9' }]}>
                      <Text style={[styles.wlBadgeText, { color: itemUp ? '#15803d' : '#b91c1c' }]}>
                        {itemUp ? '↑' : '↓'} {Math.abs(item.changePercent ?? 0).toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => toggleStar(item.symbol)}
                    hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                    style={{ paddingLeft: 6 }}
                  >
                    <Ionicons name={isStarred ? 'star' : 'star-outline'} size={15} color={isStarred ? '#EAB308' : cardBorder} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* MARKET NEWS */}
        <View style={styles.watchlistHeader}>
          <Text style={[styles.watchlistTitle, { color: c.foreground }]}>Market News</Text>
          <Text style={[styles.seeAllText, { color: c.mutedForeground }]}>More</Text>
        </View>
        <View style={styles.watchlistContainer}>
          {NEWS_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.headline}
              activeOpacity={0.7}
              style={[styles.newsItem, { backgroundColor: cardBg, borderColor: cardBorder }]}
            >
              <View style={[styles.newsNum, { backgroundColor: surfaceBg }]}>
                <Text style={[styles.newsNumText, { color: c.mutedForeground }]}>0{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.newsHeadline, { color: c.foreground }]} numberOfLines={2}>{item.headline}</Text>
                <Text style={[styles.newsMeta, { color: c.mutedForeground }]}>{item.time} · {item.source}</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={c.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* QUICK VIEW MODAL */}
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
                <Text style={[styles.modalTitle, { color: c.foreground }]}>{activeStock?.name}</Text>
                <Text style={[styles.modalMeta, { color: c.mutedForeground }]}>{selectedStock} · {activeStock?.exchange ?? 'NASDAQ'}</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.6}
                onPress={() => setShowPopup(false)}
                style={[styles.closeBtn, { backgroundColor: chipBg }]}
              >
                <Text style={{ color: c.mutedForeground, fontSize: 14, fontWeight: '600' }}>Close</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.modalBody, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc', borderColor: cardBorder }]}>
              <Text style={[styles.modalBigPrice, { color: c.foreground }]}>{formatPrice(activeQuote?.price)}</Text>
              <View style={[styles.pctPill, { backgroundColor: activeIsUp ? '#E6F9F1' : '#FEE9E9', marginTop: 8 }]}>
                <Text style={[styles.pctText, { color: activeIsUp ? '#15803d' : '#b91c1c' }]}>
                  {activeIsUp ? '↑' : '↓'} {Math.abs(activeQuote?.changePercent ?? 0).toFixed(2)}%
                </Text>
              </View>
              {chartPoints.length ? (
                <Svg width={CHART_WIDTH - 16} height={140} style={{ marginTop: 16, alignSelf: 'center' }}>
                  <Defs>
                    <LinearGradient id="popupGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
                      <Stop offset="100%" stopColor={accentColor} stopOpacity="0" />
                    </LinearGradient>
                  </Defs>
                  {(() => {
                    const { linePath: lp, areaPath: ap } = buildSvgPath(chartPoints, CHART_WIDTH - 16, 140);
                    return (<><Path d={ap} fill="url(#popupGrad)" /><Path d={lp} fill="none" stroke={accentColor} strokeWidth={2} strokeLinecap="round" /></>);
                  })()}
                </Svg>
              ) : null}
            </View>
            <View style={styles.modalStats}>
              {[
                { label: 'Open',       value: formatPrice(activeQuote?.open) },
                { label: 'High',       value: formatPrice(activeQuote?.high), color: '#10B981' },
                { label: 'Low',        value: formatPrice(activeQuote?.low),  color: '#EF4444' },
                { label: 'Prev Close', value: formatPrice(activeQuote?.previousClose) },
              ].map((s) => (
                <View key={s.label} style={styles.modalStatItem}>
                  <Text style={[styles.modalStatLabel, { color: c.mutedForeground }]}>{s.label}</Text>
                  <Text style={[styles.modalStatValue, { color: (s as any).color ?? c.foreground }]}>{s.value}</Text>
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

function SectionHeader({ title, action, c, style }: { title: string; action: string; c: any; style?: any }) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={[styles.watchlistTitle, { color: c.foreground }]}>{title}</Text>
      <Text style={[styles.seeAllText, { color: c.mutedForeground }]}>{action}</Text>
    </View>
  );
}

function StatTile({ label, value, bg, border, c }: { label: string; value: string; bg: string; border: string; c: any }) {
  return (
    <View style={[styles.statItem, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.statLabel, { color: c.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:      { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  circleBtn:   { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  mainCard: {
    marginHorizontal: 16, marginTop: 8, borderRadius: 28, padding: 20,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },

  stockBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  logoWrap:      { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImg:       { width: 36, height: 36, borderRadius: 10 },
  tickerLabel:   { fontSize: 16, fontWeight: '800' },
  companyLabel:  { fontSize: 12, marginTop: 2 },
  rangePill:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  rangePillText: { fontSize: 13, fontWeight: '600' },

  bigPrice: { fontSize: 40, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -1.5 },
  pctPill:  { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 10 },
  pctText:  { fontSize: 13, fontWeight: '700' },

  chartWrap:        { marginTop: 20, height: CHART_HEIGHT + 30, position: 'relative' },
  chartPlaceholder: { height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  svg:              { position: 'absolute', top: 0, left: 0 },
  xAxisRow:         { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  xLabel:           { fontSize: 11, fontWeight: '500' },

  tooltipPill:   { position: 'absolute', zIndex: 10, backgroundColor: '#111', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', minWidth: 112 },
  tooltipPrice:  { color: '#fff', fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tooltipChg:    { fontSize: 12, fontWeight: '600', marginTop: 2 },

  rangeTabRow:    { flexDirection: 'row', borderRadius: 16, padding: 4, marginTop: 20 },
  rangeTabBtn:    { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 13 },
  rangeTabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  rangeTabText:   { fontSize: 13 },

  statsCard: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, marginTop: 12, borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  statItem:  { width: '50%', padding: 16 },
  statLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 4 },

  searchContainer: { paddingHorizontal: 16, marginTop: 12 },
  searchBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, gap: 10 },
  searchInput:     { flex: 1, fontSize: 15, paddingVertical: 0 },

  watchlistHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 },
  watchlistTitle:   { fontSize: 18, fontWeight: '700' },
  watchlistActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seeAllText:       { fontSize: 13, fontWeight: '500' },
  smallBtn:         { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  watchlistContainer: { paddingHorizontal: 16, gap: 8 },
  wlItem:   { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 18, borderWidth: 1, gap: 10 },
  wlLogo:   { width: 40, height: 40, borderRadius: 13 },
  wlSymbol: { fontSize: 15, fontWeight: '700' },
  wlName:   { fontSize: 11, marginTop: 2 },
  wlPrice:  { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  wlBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 3 },
  wlBadgeText: { fontSize: 11, fontWeight: '600' },

  newsItem:     { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 18, borderWidth: 1, gap: 12 },
  newsNum:      { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  newsNumText:  { fontSize: 12, fontWeight: '700' },
  newsHeadline: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  newsMeta:     { fontSize: 11, marginTop: 4 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },

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
  modalStats:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(128,128,128,0.2)' },
  modalStatItem:  { alignItems: 'center' },
  modalStatLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  modalStatValue: { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 4 },

  iconBtn: { width: 42, height: 42, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
