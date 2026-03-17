// ─────────────────────────────────────────────────────────────────────────────
// StockRow — self-contained live-updating stock row.
//
// RERENDER ISOLATION:
// Subscribes to useStock(symbol) — a selector bound to ONE symbol.
// When GOOG updates, this AAPL row does NOT rerender.
//
// ANIMATIONS (all on Reanimated UI thread → 60fps, no JS bridge):
// • Background flash: green on price up, red on price down, fades over 500ms
// • AnimatedNumber: smooth spring interpolation from old → new price
// • Inline sparkline: lightweight bar chart of last 12 prices
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { useStock } from '../state/selectors';
import AnimatedNumber from './AnimatedNumber';
import PriceChangeBadge from './PriceChangeBadge';
import { PRICE_FLASH_DURATION_MS, STOCK_ROW_HEIGHT } from '../utils/constants';
import { useTheme } from '../providers/ThemeProvider';

interface StockRowProps {
  symbol: string;
  onPress?: (symbol: string) => void;
}

const StockRow = React.memo(({ symbol, onPress }: StockRowProps) => {
  const stock = useStock(symbol);
  const { c } = useTheme();

  // ── Flash animation shared values ──
  const flashProgress = useSharedValue(0);
  const isPositive = useSharedValue(true);
  const prevPriceRef = React.useRef(stock?.price);

  useEffect(() => {
    if (!stock) return;
    if (prevPriceRef.current !== undefined && stock.price !== prevPriceRef.current) {
      isPositive.value = stock.price > prevPriceRef.current;
      flashProgress.value = withSequence(
        withTiming(1, { duration: 80, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: PRICE_FLASH_DURATION_MS, easing: Easing.in(Easing.quad) }),
      );
    }
    prevPriceRef.current = stock.price;
  }, [stock?.price]);

  const animatedRowStyle = useAnimatedStyle(() => {
    const green = 'rgba(16, 185, 129, 0.15)';
    const red = 'rgba(239, 68, 68, 0.15)';
    const clear = 'rgba(0, 0, 0, 0)';
    const target = isPositive.value ? green : red;

    return {
      backgroundColor: flashProgress.value > 0
        ? interpolateColor(flashProgress.value, [0, 1], [clear, target])
        : clear,
    };
  });

  if (!stock) return null;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={() => onPress?.(symbol)}>
      <Animated.View style={[styles.row, animatedRowStyle, { borderColor: c.border }]}>
        {/* Left: symbol + name */}
        <View style={styles.info}>
          <Text style={[styles.symbol, { color: c.foreground }]}>{stock.symbol}</Text>
          <Text style={[styles.name, { color: c.mutedForeground }]} numberOfLines={1}>{stock.name}</Text>
        </View>

        {/* Center: mini sparkline */}
        <View style={styles.sparkArea}>
          {stock.sparkline.length > 1 && (
            <MiniSparkline data={stock.sparkline} isUp={stock.change >= 0} />
          )}
        </View>

        {/* Right: price + change badge */}
        <View style={styles.priceArea}>
          <AnimatedNumber
            value={stock.price}
            prefix="$"
            decimalPlaces={2}
            style={[styles.price, { color: c.foreground }]}
          />
          <PriceChangeBadge changePercent={stock.changePercent} size="small" />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
});

StockRow.displayName = 'StockRow';

// ── Inline sparkline (lightweight, no SVG dependency) ──
const MiniSparkline = React.memo(({ data, isUp }: { data: number[]; isUp: boolean }) => {
  const recent = data.slice(-12);
  const min = Math.min(...recent);
  const max = Math.max(...recent);
  const range = max - min || 1;
  const color = isUp ? '#10B981' : '#EF4444';

  return (
    <View style={sparkStyles.container}>
      {recent.map((val, i) => (
        <View
          key={i}
          style={[sparkStyles.bar, {
            height: Math.max(2, ((val - min) / range) * 24),
            backgroundColor: color,
            opacity: 0.3 + (i / 12) * 0.7,
          }]}
        />
      ))}
    </View>
  );
});

const sparkStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', height: 28, gap: 1.5 },
  bar: { width: 3, borderRadius: 1.5 },
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: STOCK_ROW_HEIGHT,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  info: { flex: 1.2, justifyContent: 'center' },
  symbol: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  name: { fontSize: 12, marginTop: 2 },
  sparkArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  priceArea: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  price: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
});

export default StockRow;
