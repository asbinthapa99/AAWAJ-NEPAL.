// ─────────────────────────────────────────────────────────────────────────────
// MarketStatusBadge — real-time US market hours indicator.
//
// Shows actual NYSE/NASDAQ market status:
// • 🟢 Market Open   (Mon–Fri, 9:30 AM – 4:00 PM ET)
// • 🟡 Pre-Market    (Mon–Fri, 4:00 AM – 9:30 AM ET)
// • 🟠 After Hours   (Mon–Fri, 4:00 PM – 8:00 PM ET)
// • 🔴 Market Closed  (weekends, holidays, outside hours)
//
// Updates every 30 seconds to stay current.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../providers/ThemeProvider';

type MarketPhase = 'open' | 'pre-market' | 'after-hours' | 'closed';

interface MarketStatus {
  phase: MarketPhase;
  color: string;
  label: string;
  pulse: boolean;
}

// ── US Market holidays (2025-2026, approximate) ──────────────────────────────
const US_HOLIDAYS: string[] = [
  // 2025
  '2025-01-01', '2025-01-20', '2025-02-17', '2025-04-18',
  '2025-05-26', '2025-06-19', '2025-07-04', '2025-09-01',
  '2025-11-27', '2025-12-25',
  // 2026
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03',
  '2026-05-25', '2026-06-19', '2026-07-03', '2026-09-07',
  '2026-11-26', '2026-12-25',
];

function getMarketStatus(): MarketStatus {
  const now = new Date();

  // Convert to Eastern Time
  const etString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
  const et = new Date(etString);

  const day = et.getDay(); // 0=Sun, 6=Sat
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Check if it's a weekend
  if (day === 0 || day === 6) {
    return { phase: 'closed', color: '#EF4444', label: 'Closed', pulse: false };
  }

  // Check holidays
  const dateStr = `${et.getFullYear()}-${String(et.getMonth() + 1).padStart(2, '0')}-${String(et.getDate()).padStart(2, '0')}`;
  if (US_HOLIDAYS.includes(dateStr)) {
    return { phase: 'closed', color: '#EF4444', label: 'Holiday', pulse: false };
  }

  // Market hours (in minutes from midnight ET)
  const PRE_MARKET_OPEN = 4 * 60;        // 4:00 AM
  const MARKET_OPEN = 9 * 60 + 30;       // 9:30 AM
  const MARKET_CLOSE = 16 * 60;          // 4:00 PM
  const AFTER_HOURS_CLOSE = 20 * 60;     // 8:00 PM

  if (timeInMinutes >= MARKET_OPEN && timeInMinutes < MARKET_CLOSE) {
    return { phase: 'open', color: '#10B981', label: 'Market Open', pulse: true };
  }
  if (timeInMinutes >= PRE_MARKET_OPEN && timeInMinutes < MARKET_OPEN) {
    return { phase: 'pre-market', color: '#F59E0B', label: 'Pre-Market', pulse: true };
  }
  if (timeInMinutes >= MARKET_CLOSE && timeInMinutes < AFTER_HOURS_CLOSE) {
    return { phase: 'after-hours', color: '#F97316', label: 'After Hours', pulse: false };
  }

  return { phase: 'closed', color: '#EF4444', label: 'Closed', pulse: false };
}

const MarketStatusBadge = React.memo(() => {
  const { c } = useTheme();
  const [status, setStatus] = useState<MarketStatus>(getMarketStatus);

  // Update every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(getMarketStatus());
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Pulse animation for open/pre-market
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    if (status.pulse) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.8, { duration: 1000, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 1000, easing: Easing.in(Easing.quad) }),
        ),
        -1,
      );
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.2, { duration: 1000 }),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = 1;
      pulseOpacity.value = 1;
    }
  }, [status.pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.dotContainer}>
        {status.pulse && (
          <Animated.View
            style={[
              styles.pulseRing,
              { borderColor: status.color },
              pulseStyle,
            ]}
          />
        )}
        <View style={[styles.dot, { backgroundColor: status.color }]} />
      </View>
      <Text style={[styles.label, { color: c.mutedForeground }]}>
        {status.label}
      </Text>
    </View>
  );
});

MarketStatusBadge.displayName = 'MarketStatusBadge';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotContainer: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
  },
  pulseRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    position: 'absolute',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default MarketStatusBadge;
