// ─────────────────────────────────────────────────────────────────────────────
// ChartCard — premium styled container for mini stock snapshot cards.
//
// Layout:
//  ┌────────────────────────────────┐
//  │  AAPL        $189.42           │
//  │  [sparkline chart]             │
//  │  +1.23%  ▲                    │
//  └────────────────────────────────┘
//
// Features:
// • Price flash animation (green/red) on tick updates
// • AnimatedNumber for smooth price transitions
// • Tappable → navigates to stock detail
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import MiniSparklineChart from './MiniSparklineChart';
import AnimatedNumber from '../AnimatedNumber';
import PriceChangeBadge from '../PriceChangeBadge';

export interface ChartCardProps {
  symbol: string;
  name: string;
  price: number;
  prevPrice: number;
  changePercent: number;
  sparkline: number[];
  width?: number;
  onPress?: (symbol: string) => void;
}

const ChartCard = React.memo(({
  symbol,
  name,
  price,
  prevPrice,
  changePercent,
  sparkline,
  width = 166,
  onPress,
}: ChartCardProps) => {
  const { c, mode } = useTheme();
  const isDark = mode === 'dark';
  const isUp = price >= prevPrice;
  const flashAnim = useRef(new Animated.Value(0)).current;

  // ── Flash on price update ──
  useEffect(() => {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: false }),
      Animated.timing(flashAnim, { toValue: 0, duration: 420, useNativeDriver: false }),
    ]).start();
  }, [price]);

  const flashColor = flashAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [
      isDark ? 'rgba(255,255,255,0.0)' : 'rgba(0,0,0,0.0)',
      isUp ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
    ],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress?.(symbol)}
      style={[
        styles.wrapper,
        {
          width,
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : c.border,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.inner,
          {
            backgroundColor: flashColor,
          },
        ]}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.symbol, { color: c.foreground }]}>{symbol}</Text>
            <Text style={[styles.name, { color: c.mutedForeground }]} numberOfLines={1}>
              {name}
            </Text>
          </View>
          <AnimatedNumber
            value={price}
            prefix="$"
            decimalPlaces={2}
            style={[styles.price, { color: c.foreground }]}
          />
        </View>

        {/* ── Sparkline ── */}
        {sparkline.length >= 2 && (
          <MiniSparklineChart
            data={sparkline}
            width={width - 24}
            height={60}
            isUp={changePercent >= 0}
            showDot={true}
            showBaseline={false}
          />
        )}

        {/* ── Footer ── */}
        <PriceChangeBadge changePercent={changePercent} size="small" />
      </Animated.View>
    </TouchableOpacity>
  );
});

ChartCard.displayName = 'ChartCard';

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
    overflow: 'hidden',
    // Subtle drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  inner: {
    padding: 14,
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    marginRight: 8,
  },
  symbol: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});

export default ChartCard;
