// ─────────────────────────────────────────────────────────────────────────────
// PriceChangeBadge — shows % change with up/down arrow and color.
//
// Renders a compact pill: "▲ 2.34%" in green, or "▼ 1.20%" in red.
// Uses React.memo — only rerenders when change value actually differs.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PriceChangeBadgeProps {
  changePercent: number;
  size?: 'small' | 'medium';
}

const PriceChangeBadge = React.memo(({ changePercent, size = 'medium' }: PriceChangeBadgeProps) => {
  const isUp = changePercent >= 0;
  const color = isUp ? '#10B981' : '#EF4444';
  const arrow = isUp ? '▲' : '▼';
  const isSmall = size === 'small';

  return (
    <View style={[
      styles.pill,
      isSmall ? styles.pillSmall : styles.pillMedium,
      { backgroundColor: color + '18' },  // 18 hex = ~9% opacity
    ]}>
      <Text style={[
        styles.text,
        isSmall ? styles.textSmall : styles.textMedium,
        { color },
      ]}>
        {arrow} {Math.abs(changePercent).toFixed(2)}%
      </Text>
    </View>
  );
});

PriceChangeBadge.displayName = 'PriceChangeBadge';

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 8,
  },
  pillMedium: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  text: {
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  textMedium: {
    fontSize: 12,
  },
  textSmall: {
    fontSize: 10,
  },
});

export default PriceChangeBadge;
