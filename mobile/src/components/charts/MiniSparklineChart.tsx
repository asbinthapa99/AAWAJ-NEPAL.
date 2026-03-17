// ─── MiniSparklineChart ────────────────────────────────────────
// Renders a simple SVG-style sparkline using react-native Views.
// Used by ChartCard to show price trend at a glance.
// ───────────────────────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet } from 'react-native';

interface MiniSparklineChartProps {
  data: number[];
  width: number;
  height: number;
  isUp: boolean;
  showDot?: boolean;
  showBaseline?: boolean;
}

const MiniSparklineChart = React.memo(({
  data,
  width,
  height,
  isUp,
  showDot = true,
  showBaseline = false,
}: MiniSparklineChartProps) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const color = isUp ? '#10b981' : '#ef4444';

  // Render as a series of small absolute-positioned dots connected visually
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((val - min) / range) * (height * 0.8) - height * 0.1,
  }));

  return (
    <View style={{ width, height, position: 'relative' }}>
      {/* Baseline */}
      {showBaseline && (
        <View
          style={[
            styles.baseline,
            { top: height / 2, width, backgroundColor: 'rgba(148,163,184,0.15)' },
          ]}
        />
      )}

      {/* Line segments */}
      {points.map((point, i) => {
        if (i === 0) return null;
        const prev = points[i - 1];
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: prev.x,
              top: prev.y,
              width: length,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: 'left center',
              opacity: 0.85,
            }}
          />
        );
      })}

      {/* End dot */}
      {showDot && points.length > 0 && (
        <View
          style={{
            position: 'absolute',
            left: points[points.length - 1].x - 3,
            top: points[points.length - 1].y - 3,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color,
          }}
        />
      )}
    </View>
  );
});

MiniSparklineChart.displayName = 'MiniSparklineChart';

const styles = StyleSheet.create({
  baseline: {
    position: 'absolute',
    height: 1,
    left: 0,
  },
});

export default MiniSparklineChart;
