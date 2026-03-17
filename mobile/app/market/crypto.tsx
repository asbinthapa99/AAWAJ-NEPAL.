// ─────────────────────────────────────────────────────────────────────────────
// CryptoScreen — matches StockScreen UI/UX exactly.
//
// • Custom back button + header (same layout as StockScreen)
// • Search toggle + filter chips (All / Starred)
// • Active coin selector badge with icon
// • Price card + SVG line+area chart with 5 timeframe buttons
// • Stats grid (Open / High / Low / Prev Close)
// • Full crypto watchlist with live prices
// • Quick View modal on long-press
// • Live prices via Finnhub REST API (polling every 30s)
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutUp,
} from 'react-native-reanimated';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../../src/providers/ThemeProvider';
import { cryptoWsService } from '../../src/api/cryptoWebSocket';

// ── All Crypto Coins ─────────────────────────────────────────────────────────
// symbol = unique key used in state, coingeckoId = CoinGecko API id

const ALL_CRYPTOS = [
  // ── Majors ──
  { symbol: 'BTC',  coingeckoId: 'bitcoin',          display: 'BTC',  name: 'Bitcoin',       emoji: '₿',  color: '#F7931A' },
  { symbol: 'ETH',  coingeckoId: 'ethereum',         display: 'ETH',  name: 'Ethereum',      emoji: 'Ξ',  color: '#627EEA' },
  { symbol: 'BNB',  coingeckoId: 'binancecoin',      display: 'BNB',  name: 'BNB',           emoji: '🟡', color: '#F3BA2F' },
  { symbol: 'SOL',  coingeckoId: 'solana',           display: 'SOL',  name: 'Solana',        emoji: '◎',  color: '#9945FF' },
  { symbol: 'XRP',  coingeckoId: 'ripple',           display: 'XRP',  name: 'XRP',           emoji: '◈',  color: '#346AA9' },
  { symbol: 'DOGE', coingeckoId: 'dogecoin',         display: 'DOGE', name: 'Dogecoin',      emoji: '🐕', color: '#C2A633' },
  { symbol: 'ADA',  coingeckoId: 'cardano',          display: 'ADA',  name: 'Cardano',       emoji: '⬡',  color: '#0033AD' },
  { symbol: 'TRX',  coingeckoId: 'tron',             display: 'TRX',  name: 'TRON',          emoji: '♦',  color: '#EF0027' },
  { symbol: 'TON',  coingeckoId: 'the-open-network', display: 'TON',  name: 'Toncoin',       emoji: '💎', color: '#0088CC' },
  { symbol: 'AVAX', coingeckoId: 'avalanche-2',      display: 'AVAX', name: 'Avalanche',     emoji: '🔺', color: '#E84142' },
  // ── Layer 2 & Alt L1 ──
  { symbol: 'SHIB', coingeckoId: 'shiba-inu',        display: 'SHIB', name: 'Shiba Inu',     emoji: '🐕', color: '#FFA409' },
  { symbol: 'DOT',  coingeckoId: 'polkadot',         display: 'DOT',  name: 'Polkadot',      emoji: '●',  color: '#E6007A' },
  { symbol: 'LINK', coingeckoId: 'chainlink',        display: 'LINK', name: 'Chainlink',     emoji: '⬡',  color: '#2A5ADA' },
  { symbol: 'NEAR', coingeckoId: 'near',             display: 'NEAR', name: 'NEAR Protocol', emoji: '∞',  color: '#00C08B' },
  { symbol: 'ICP',  coingeckoId: 'internet-computer',display: 'ICP',  name: 'Internet Computer', emoji: '∞', color: '#3B00B9' },
  { symbol: 'APT',  coingeckoId: 'aptos',            display: 'APT',  name: 'Aptos',         emoji: '▲',  color: '#05C3A0' },
  { symbol: 'SUI',  coingeckoId: 'sui',              display: 'SUI',  name: 'Sui',           emoji: '💧', color: '#6fbcf0' },
  { symbol: 'ARB',  coingeckoId: 'arbitrum',         display: 'ARB',  name: 'Arbitrum',      emoji: '🔵', color: '#28A0F0' },
  { symbol: 'OP',   coingeckoId: 'optimism',         display: 'OP',   name: 'Optimism',      emoji: '🔴', color: '#FF0420' },
  { symbol: 'POL',  coingeckoId: 'matic-network',    display: 'POL',  name: 'Polygon',       emoji: '⬟',  color: '#8247E5' },
  // ── DeFi ──
  { symbol: 'UNI',  coingeckoId: 'uniswap',          display: 'UNI',  name: 'Uniswap',       emoji: '🦄', color: '#FF007A' },
  { symbol: 'ATOM', coingeckoId: 'cosmos',           display: 'ATOM', name: 'Cosmos',        emoji: '⚛',  color: '#6F7390' },
  { symbol: 'INJ',  coingeckoId: 'injective-protocol', display: 'INJ', name: 'Injective',   emoji: '🌊', color: '#00B2FF' },
  { symbol: 'GRT',  coingeckoId: 'the-graph',        display: 'GRT',  name: 'The Graph',     emoji: '📊', color: '#6747ED' },
  { symbol: 'LTC',  coingeckoId: 'litecoin',         display: 'LTC',  name: 'Litecoin',      emoji: 'Ł',  color: '#BFBBBB' },
  // ── Gaming & Metaverse ──
  { symbol: 'SAND', coingeckoId: 'the-sandbox',      display: 'SAND', name: 'The Sandbox',   emoji: '🏖',  color: '#00ADEF' },
  { symbol: 'MANA', coingeckoId: 'decentraland',     display: 'MANA', name: 'Decentraland',  emoji: '🌍', color: '#FF2D55' },
  { symbol: 'AXS',  coingeckoId: 'axie-infinity',    display: 'AXS',  name: 'Axie Infinity', emoji: '🐾', color: '#0055D5' },
  // ── Others ──
  { symbol: 'XLM',  coingeckoId: 'stellar',          display: 'XLM',  name: 'Stellar',       emoji: '✦',  color: '#7D7DB8' },
  { symbol: 'ALGO', coingeckoId: 'algorand',         display: 'ALGO', name: 'Algorand',      emoji: '◆',  color: '#00B4D8' },
  { symbol: 'HBAR', coingeckoId: 'hedera-hashgraph', display: 'HBAR', name: 'Hedera',        emoji: '⬡',  color: '#2B2B2B' },
  { symbol: 'VET',  coingeckoId: 'vechain',          display: 'VET',  name: 'VeChain',       emoji: '✓',  color: '#15BDFF' },
  { symbol: 'FIL',  coingeckoId: 'filecoin',         display: 'FIL',  name: 'Filecoin',      emoji: '🗄',  color: '#0090FF' },
  { symbol: 'EOS',  coingeckoId: 'eos',              display: 'EOS',  name: 'EOS',           emoji: '⬤',  color: '#443F54' },
  { symbol: 'FTM',  coingeckoId: 'fantom',           display: 'FTM',  name: 'Fantom',        emoji: '👻', color: '#1969FF' },
];

// ── CoinGecko API — single batch call for all coins ───────────────────────────
// Free, no API key, returns current price, 24h change, high, low
async function fetchAllCoinGecko(): Promise<Record<string, {
  price: number; change: number; changePercent: number;
  high: number; low: number; open: number; prevClose: number;
}>> {
  try {
    const ids = ALL_CRYPTOS.map(c => c.coingeckoId).join(',');
    const url =
      `https://api.coingecko.com/api/v3/coins/markets` +
      `?vs_currency=usd&ids=${ids}&order=market_cap_desc` +
      `&per_page=50&page=1&sparkline=false&price_change_percentage=24h`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return {};
    const data = await res.json() as Array<{
      id: string;
      current_price: number;
      price_change_24h: number;
      price_change_percentage_24h: number;
      high_24h: number;
      low_24h: number;
    }>;
    const result: Record<string, { price: number; change: number; changePercent: number; high: number; low: number; open: number; prevClose: number }> = {};
    for (const item of data) {
      // Find which coin config this matches
      const cfg = ALL_CRYPTOS.find(c => c.coingeckoId === item.id);
      if (!cfg) continue;
      const price   = item.current_price ?? 0;
      const change  = item.price_change_24h ?? 0;
      const changePct = item.price_change_percentage_24h ?? 0;
      const high    = item.high_24h ?? price;
      const low     = item.low_24h  ?? price;
      // Estimate open from change
      const prevClose = price - change;
      result[cfg.symbol] = {
        price, change, changePercent: changePct,
        high, low,
        open: prevClose,    // best estimate available without paid tier
        prevClose,
      };
    }
    return result;
  } catch {
    return {};
  }
}

const RANGES = ['1D', '1W', '1M', '3M', '1Y'] as const;
type Range = (typeof RANGES)[number];

// ── Types ─────────────────────────────────────────────────────────────────────

interface CoinQuote {
  symbol: string;      // e.g. BINANCE:BTCUSDT
  display: string;     // e.g. BTC
  name: string;
  emoji: string;
  color: string;
  price: number;
  change: number;      // $ change
  changePercent: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH  = SCREEN_WIDTH - 80;
const CHART_HEIGHT = 180;

function formatPrice(v?: number | null): string {
  if (v == null || isNaN(v) || v === 0) return '--';
  if (v >= 1000) return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (v >= 1)    return `$${v.toFixed(4)}`;
  return `$${v.toFixed(6)}`;
}

function formatPercent(v?: number | null): string {
  if (v == null || isNaN(v)) return '--';
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(2)}%`;
}


// Synthetic chart generator (same logic as StockScreen — seeded per symbol+range)
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function generateSyntheticChart(price: number, open: number, high: number, low: number, range: Range): number[] {
  if (!price) return [];
  let points: number, volFactor: number, dips: number;
  switch (range) {
    case '1D': points = 48; volFactor = 0.08; dips = 2; break;
    case '1W': points = 35; volFactor = 0.12; dips = 3; break;
    case '1M': points = 30; volFactor = 0.18; dips = 4; break;
    case '3M': points = 60; volFactor = 0.25; dips = 6; break;
    default:   points = 52; volFactor = 0.35; dips = 8; break;
  }
  const dailyRange = Math.max(high - low, price * 0.01);
  const seed = range.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  const rng = seededRandom(seed);
  const cps = Array.from({ length: dips + 1 }, (_, i) => {
    const prog = i / dips;
    const base = open + (price - open) * prog;
    return base + dailyRange * volFactor * (rng() - 0.5) * 2;
  });
  cps[0] = open;
  cps[cps.length - 1] = price;

  const path: number[] = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const seg = t * (cps.length - 1);
    const idx = Math.min(Math.floor(seg), cps.length - 2);
    const p = seg - idx;
    const smooth = cps[idx] + (cps[idx + 1] - cps[idx]) * (3 * p * p - 2 * p * p * p);
    const noise  = dailyRange * 0.02 * (rng() - 0.5);
    const pad    = dailyRange * volFactor * 0.5;
    path.push(Math.max(low - pad, Math.min(high + pad, smooth + noise)));
  }
  path[0] = open;
  path[path.length - 1] = price;
  return path;
}

function buildSvgPath(points: number[], w: number, h: number) {
  if (!points.length) return { linePath: '', areaPath: '' };
  const min  = Math.min(...points);
  const max  = Math.max(...points);
  const diff = Math.max(max - min, 1);
  const coords = points.map((p, i) => ({
    x: (i / Math.max(points.length - 1, 1)) * w,
    y: h - ((p - min) / diff) * h,
  }));
  const linePath = coords.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`).join(' ');
  return { linePath, areaPath: `${linePath} L ${w},${h} L 0,${h} Z` };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CryptoScreen() {
  const { c, mode } = useTheme();
  const router = useRouter();
  const isDark = mode === 'dark';

  // ── Theme colours (same as StockScreen) ──
  const cardBg      = isDark ? '#111827' : '#f8fafc';
  const cardBorder  = isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const surfaceBg   = isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9';
  const chipBg      = isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0';
  const chipActiveBg   = c.foreground;
  const chipActiveText = c.background;

  // ── State ──
  const [selectedSymbol, setSelectedSymbol] = useState(ALL_CRYPTOS[0].symbol);
  const [quoteMap, setQuoteMap]   = useState<Record<string, CoinQuote>>({});
  const [starred,  setStarred]    = useState<Set<string>>(new Set(['BTC', 'ETH', 'SOL']));
  const [range,    setRange]      = useState<Range>('1D');
  const [showSearch,    setShowSearch]    = useState(false);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartPoints, setChartPoints] = useState<number[]>([]);
  const [showPopup,  setShowPopup]  = useState(false);

  const scrollRef  = useRef<ScrollView>(null);
  const mountedRef = useRef(true);
  const chartKey   = useRef('');

  // ── Initial load: CoinGecko REST (once) → then WebSocket takes over ──────
  const loadInitial = useCallback(async () => {
    const marketData = await fetchAllCoinGecko();
    if (!mountedRef.current || Object.keys(marketData).length === 0) return;
    const newMap: Record<string, CoinQuote> = {};
    for (const cfg of ALL_CRYPTOS) {
      const d = marketData[cfg.symbol];
      newMap[cfg.symbol] = {
        ...cfg,
        price:         d?.price         ?? 0,
        change:        d?.change        ?? 0,
        changePercent: d?.changePercent ?? 0,
        high:          d?.high          ?? 0,
        low:           d?.low           ?? 0,
        open:          d?.open          ?? 0,
        prevClose:     d?.prevClose     ?? 0,
      };
    }
    setQuoteMap(newMap);
  }, []);

  // ── WebSocket: apply live ticks on top of REST snapshot ──────────────────
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      await loadInitial();
      if (!mountedRef.current) return;
      setLoading(false);
      // Start WS — ticks update price/change/changePercent only (leaves high/low intact)
      cryptoWsService.connect((ticks) => {
        if (!mountedRef.current) return;
        setQuoteMap(prev => {
          const next = { ...prev };
          for (const tick of ticks) {
            const existing = next[tick.symbol];
            if (!existing) continue;
            next[tick.symbol] = {
              ...existing,
              price:         tick.price,
              change:        tick.change,
              changePercent: tick.changePercent,
              high:          Math.max(existing.high || tick.high, tick.price),
              low:           existing.low ? Math.min(existing.low, tick.price) : tick.low,
            };
          }
          return next;
        });
      });
    })();
    return () => {
      mountedRef.current = false;
      cryptoWsService.disconnect();
    };
  }, [loadInitial]);

  // ── Pull-to-refresh: re-fetch REST snapshot ──────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  }, [loadInitial]);

  // ── Active coin ──
  const activeCoin   = useMemo(() => quoteMap[selectedSymbol] ?? ALL_CRYPTOS.find(c2 => c2.symbol === selectedSymbol), [quoteMap, selectedSymbol]);
  const activeConfig = useMemo(() => ALL_CRYPTOS.find(c2 => c2.symbol === selectedSymbol)!, [selectedSymbol]);
  const activeIsUp   = (activeCoin as CoinQuote | undefined)?.changePercent != null
    ? (activeCoin as CoinQuote).changePercent >= 0
    : true;
  const accentColor  = activeIsUp ? '#10B981' : '#EF4444';

  // ── Chart generation ──
  useEffect(() => {
    const key = `${selectedSymbol}-${range}`;
    if (chartKey.current === key) return;
    const coin = quoteMap[selectedSymbol];
    if (!coin?.price) { setChartPoints([]); return; }
    chartKey.current = key;
    const timer = setTimeout(() => {
      setChartPoints(generateSyntheticChart(coin.price, coin.open || coin.prevClose, coin.high, coin.low, range));
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedSymbol, range, quoteMap]);

  const { linePath, areaPath } = useMemo(() => buildSvgPath(chartPoints, CHART_WIDTH, CHART_HEIGHT), [chartPoints]);

  // ── Filtered list ──
  const filteredList = useMemo(() => {
    let list = ALL_CRYPTOS.map(cfg => ({
      ...cfg,
      ...(quoteMap[cfg.symbol] ?? {}),
    })) as (typeof ALL_CRYPTOS[0] & Partial<CoinQuote>)[];

    if (showStarredOnly) list = list.filter(c2 => starred.has(c2.symbol));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c2 => c2.display.toLowerCase().includes(q) || c2.name.toLowerCase().includes(q));
    }
    return list;
  }, [quoteMap, starred, showStarredOnly, searchQuery]);

  // ── Handlers ──
  const selectCoin = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: c.background }]} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.mutedForeground} />
        }
      >

        {/* ════════ HEADER ════════ */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/markets')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.backBtn, { backgroundColor: surfaceBg, borderColor: cardBorder }]}
          >
            <Ionicons name="chevron-back" size={20} color={c.foreground} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerLabel, { color: c.mutedForeground }]}>Live Prices</Text>
            <Text style={[styles.headerTitle, { color: c.foreground }]}>Crypto</Text>
          </View>

          <View style={styles.headerActions}>
            {/* Live dot */}
            <View style={[styles.livePill, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)' }]}>
              <View style={styles.liveDot} />
              <Text style={[styles.liveText, { color: '#10B981' }]}>Live</Text>
            </View>

            {/* Search toggle */}
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() => setShowSearch(s => !s)}
              style={[styles.iconBtn, {
                backgroundColor: showSearch ? accentColor : surfaceBg,
                borderColor:     showSearch ? accentColor : cardBorder,
              }]}
            >
              <Ionicons name={showSearch ? 'close' : 'search'} size={18} color={showSearch ? '#fff' : c.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ════════ SEARCH BAR ════════ */}
        {showSearch && (
          <Animated.View entering={FadeInDown.duration(200)} style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: surfaceBg, borderColor: cardBorder }]}>
              <Ionicons name="search" size={16} color={c.mutedForeground} />
              <TextInput
                placeholder="Search coins…"
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

        {/* ════════ ACTIVE COIN BADGE ════════ */}
        <View style={[styles.activeBadge, { backgroundColor: surfaceBg, borderColor: cardBorder }]}>
          <View style={[styles.avatarBox, { backgroundColor: `${activeConfig.color}22` }]}>
            <Text style={[styles.avatarText, { color: activeConfig.color }]}>{activeConfig.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.activeName, { color: c.foreground }]}>{activeConfig.name}</Text>
            <Text style={[styles.activeSymbol, { color: c.mutedForeground }]}>{activeConfig.display} · Crypto</Text>
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

        {/* ════════ PRICE CARD ════════ */}
        <View style={[styles.priceCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.priceLabel, { color: c.mutedForeground }]}>Current price</Text>
              <Animated.Text
                entering={FadeInDown.duration(300)}
                key={`${selectedSymbol}-${(activeCoin as CoinQuote | undefined)?.price}`}
                style={[styles.bigPrice, { color: c.foreground }]}
              >
                {formatPrice((activeCoin as CoinQuote | undefined)?.price)}
              </Animated.Text>
              <View style={[styles.changeBadge, { backgroundColor: activeIsUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                <Ionicons name={activeIsUp ? 'trending-up' : 'trending-down'} size={14} color={accentColor} />
                <Text style={[styles.changeText, { color: accentColor }]}>
                  {formatPrice((activeCoin as CoinQuote | undefined)?.change)} ({formatPercent((activeCoin as CoinQuote | undefined)?.changePercent)})
                </Text>
              </View>
            </View>

            <View style={[styles.hlCard, { backgroundColor: surfaceBg, borderColor: cardBorder }]}>
              <Text style={[styles.hlLabel, { color: c.mutedForeground }]}>Today</Text>
              <Text style={[styles.hlValue, { color: '#10B981' }]}>H {formatPrice((activeCoin as CoinQuote | undefined)?.high)}</Text>
              <Text style={[styles.hlSub,   { color: '#EF4444' }]}>L {formatPrice((activeCoin as CoinQuote | undefined)?.low)}</Text>
            </View>
          </View>

          {/* ════════ CHART ════════ */}
          <View style={[styles.chartBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc', borderColor: cardBorder }]}>
            {loading ? (
              <View style={styles.chartPlaceholder}>
                <ActivityIndicator color={c.mutedForeground} size="small" />
                <Text style={{ color: c.mutedForeground, fontSize: 12, marginTop: 8 }}>Loading chart…</Text>
              </View>
            ) : chartPoints.length ? (
              <Svg width={CHART_WIDTH} height={CHART_HEIGHT} style={styles.svg}>
                <Defs>
                  <LinearGradient id="cryptoGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%"   stopColor={accentColor} stopOpacity="0.35" />
                    <Stop offset="100%" stopColor={accentColor} stopOpacity="0"    />
                  </LinearGradient>
                </Defs>
                <Path d={areaPath} fill="url(#cryptoGrad)" />
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
              {RANGES.map((r) => (
                <TouchableOpacity
                  key={r}
                  activeOpacity={0.7}
                  onPress={() => setRange(r)}
                  style={[styles.rangeBtn, { backgroundColor: range === r ? chipActiveBg : chipBg }]}
                >
                  <Text style={[styles.rangeBtnText, { color: range === r ? chipActiveText : c.mutedForeground }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ════════ STATS GRID ════════ */}
          <View style={styles.statsGrid}>
            <StatTile label="Open"       value={formatPrice((activeCoin as CoinQuote | undefined)?.open)}      bg={surfaceBg} border={cardBorder} c={c} />
            <StatTile label="High"       value={formatPrice((activeCoin as CoinQuote | undefined)?.high)}      bg={surfaceBg} border={cardBorder} c={c} />
            <StatTile label="Low"        value={formatPrice((activeCoin as CoinQuote | undefined)?.low)}       bg={surfaceBg} border={cardBorder} c={c} />
            <StatTile label="Prev Close" value={formatPrice((activeCoin as CoinQuote | undefined)?.prevClose)} bg={surfaceBg} border={cardBorder} c={c} />
          </View>
        </View>

        {/* ════════ WATCHLIST ════════ */}
        <View style={styles.watchlistHeader}>
          <SectionHeader title="Watchlist" action={`${ALL_CRYPTOS.length} coins`} c={c} />
          <View style={styles.filterRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowStarredOnly(false)}
              style={[styles.filterChip, { backgroundColor: !showStarredOnly ? chipActiveBg : chipBg }]}
            >
              <Text style={[styles.filterChipText, { color: !showStarredOnly ? chipActiveText : c.mutedForeground }]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowStarredOnly(true)}
              style={[styles.filterChip, { backgroundColor: showStarredOnly ? '#EAB308' : chipBg }]}
            >
              <Ionicons name="star" size={12} color={showStarredOnly ? '#000' : c.mutedForeground} style={{ marginRight: 4 }} />
              <Text style={[styles.filterChipText, { color: showStarredOnly ? '#000' : c.mutedForeground }]}>
                Starred ({starred.size})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.watchlistContainer}>
          {filteredList.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={32} color={c.mutedForeground} />
              <Text style={{ color: c.mutedForeground, marginTop: 10, fontSize: 13 }}>No coins found</Text>
            </View>
          ) : (
            filteredList.map((item) => {
              const itemUp       = (item.changePercent ?? 0) >= 0;
              const isSelected   = selectedSymbol === item.symbol;
              const isStarred    = starred.has(item.symbol);
              return (
                <TouchableOpacity
                  key={item.symbol}
                  activeOpacity={0.7}
                  onPress={() => selectCoin(item.symbol)}
                  onLongPress={() => { setSelectedSymbol(item.symbol); setShowPopup(true); }}
                  style={[
                    styles.watchlistItem,
                    {
                      backgroundColor: isSelected ? 'rgba(16,185,129,0.08)' : surfaceBg,
                      borderColor:     isSelected ? 'rgba(16,185,129,0.3)'  : cardBorder,
                    },
                  ]}
                >
                  {/* Coin icon */}
                  <View style={[styles.coinIcon, { backgroundColor: `${item.color}22` }]}>
                    <Text style={[styles.coinEmoji, { color: item.color }]}>{item.emoji}</Text>
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
                      {formatPrice(item.price)}
                    </Text>
                    <View style={[styles.wlChangeBadge, { backgroundColor: itemUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                      <Ionicons name={itemUp ? 'caret-up' : 'caret-down'} size={10} color={itemUp ? '#10B981' : '#EF4444'} />
                      <Text style={[styles.wlChangeText, { color: itemUp ? '#10B981' : '#EF4444' }]}>
                        {formatPercent(item.changePercent)}
                      </Text>
                    </View>
                  </View>

                  {/* Star toggle */}
                  <TouchableOpacity
                    activeOpacity={0.6}
                    onPress={() => toggleStar(item.symbol)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.inlineStarBtn}
                  >
                    <Ionicons
                      name={isStarred ? 'star' : 'star-outline'}
                      size={16}
                      color={isStarred ? '#EAB308' : cardBorder}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ════════ QUICK VIEW MODAL ════════ */}
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
                <Text style={[styles.modalTitle, { color: c.foreground }]}>{activeConfig.name}</Text>
                <Text style={[styles.modalMeta, { color: c.mutedForeground }]}>{activeConfig.display} · Crypto</Text>
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
              <Text style={[styles.modalBigPrice, { color: c.foreground }]}>
                {formatPrice((activeCoin as CoinQuote | undefined)?.price)}
              </Text>
              <View style={[styles.changeBadge, { backgroundColor: activeIsUp ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }]}>
                <Ionicons name={activeIsUp ? 'trending-up' : 'trending-down'} size={14} color={accentColor} />
                <Text style={[styles.changeText, { color: accentColor }]}>
                  {formatPrice((activeCoin as CoinQuote | undefined)?.change)} ({formatPercent((activeCoin as CoinQuote | undefined)?.changePercent)})
                </Text>
              </View>

              {chartPoints.length ? (
                <Svg width={CHART_WIDTH - 32} height={140} style={{ marginTop: 16, alignSelf: 'center' }}>
                  <Defs>
                    <LinearGradient id="popupGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%"   stopColor={accentColor} stopOpacity="0.35" />
                      <Stop offset="100%" stopColor={accentColor} stopOpacity="0"    />
                    </LinearGradient>
                  </Defs>
                  {(() => {
                    const { linePath: lp, areaPath: ap } = buildSvgPath(chartPoints, CHART_WIDTH - 32, 140);
                    return (
                      <>
                        <Path d={ap} fill="url(#popupGrad)" />
                        <Path d={lp} fill="none" stroke={accentColor} strokeWidth={2.5} strokeLinecap="round" />
                      </>
                    );
                  })()}
                </Svg>
              ) : (
                <Text style={{ color: c.mutedForeground, marginTop: 16, fontSize: 14 }}>No chart data</Text>
              )}
            </View>

            <View style={styles.modalStats}>
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatLabel, { color: c.mutedForeground }]}>High</Text>
                <Text style={[styles.modalStatValue, { color: '#10B981' }]}>{formatPrice((activeCoin as CoinQuote | undefined)?.high)}</Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatLabel, { color: c.mutedForeground }]}>Low</Text>
                <Text style={[styles.modalStatValue, { color: '#EF4444' }]}>{formatPrice((activeCoin as CoinQuote | undefined)?.low)}</Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatLabel, { color: c.mutedForeground }]}>Change</Text>
                <Text style={[styles.modalStatValue, { color: accentColor }]}>{formatPercent((activeCoin as CoinQuote | undefined)?.changePercent)}</Text>
              </View>
              <View style={styles.modalStatItem}>
                <Text style={[styles.modalStatLabel, { color: c.mutedForeground }]}>Prev Close</Text>
                <Text style={[styles.modalStatValue, { color: c.foreground }]}>{formatPrice((activeCoin as CoinQuote | undefined)?.prevClose)}</Text>
              </View>
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

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea:     { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 2 },
  headerTitle: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  backBtn: {
    width: 42, height: 42, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginRight: 12, zIndex: 10,
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  livePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
  liveDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  liveText: { fontSize: 12, fontWeight: '700' },

  // Search
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
    paddingVertical: 10, borderRadius: 16, borderWidth: 1, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

  // Active coin badge
  activeBadge: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, padding: 14, borderRadius: 18, borderWidth: 1, gap: 12,
  },
  avatarBox: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800' },
  activeName: { fontSize: 15, fontWeight: '600' },
  activeSymbol: { fontSize: 12, marginTop: 2 },
  starBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  // Price card
  priceCard: { margin: 20, padding: 18, borderRadius: 26, borderWidth: 1 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  priceLabel: { fontSize: 14 },
  bigPrice: { fontSize: 36, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -1.5, marginTop: 4 },
  changeBadge: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    gap: 5, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginTop: 10,
  },
  changeText: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] },

  // H/L card
  hlCard: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'flex-end' },
  hlLabel: { fontSize: 11, marginBottom: 4 },
  hlValue: { fontSize: 14, fontWeight: '600' },
  hlSub:   { fontSize: 12, marginTop: 2 },

  // Chart
  chartBox: { borderRadius: 22, borderWidth: 1, padding: 16, marginTop: 18, alignItems: 'center' },
  chartPlaceholder: { height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  svg: { alignSelf: 'center' },
  rangeRow: { flexDirection: 'row', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' },
  rangeBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, minWidth: 48, alignItems: 'center' },
  rangeBtnText: { fontSize: 13, fontWeight: '700' },

  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  statTile:  { width: '47%' as any, padding: 14, borderRadius: 16, borderWidth: 1 },
  statLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 4 },

  // Watchlist
  watchlistHeader: { marginBottom: 0 },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle:    { fontSize: 17, fontWeight: '700' },
  sectionAction:   { fontSize: 13, fontWeight: '500' },
  filterRow:       { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  filterChip:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 },
  filterChipText:  { fontSize: 12, fontWeight: '600' },
  watchlistContainer: { paddingHorizontal: 20, gap: 8 },
  watchlistItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 16, borderWidth: 1, gap: 10,
  },
  coinIcon:  { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  coinEmoji: { fontSize: 18, fontWeight: '800' },
  symbolRow: { flexDirection: 'row', alignItems: 'center' },
  wlSymbol:  { fontSize: 15, fontWeight: '700' },
  wlName:    { fontSize: 11, marginTop: 2 },
  wlPrice:   { fontSize: 14, fontWeight: '700', fontVariant: ['tabular-nums'] },
  wlChangeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 3,
  },
  wlChangeText: { fontSize: 11, fontWeight: '600', fontVariant: ['tabular-nums'] },
  inlineStarBtn: { paddingLeft: 6, paddingVertical: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },

  // Modal
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
