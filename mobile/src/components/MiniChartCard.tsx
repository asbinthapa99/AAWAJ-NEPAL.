// ─────────────────────────────────────────────────────────────────────────────
// MiniChartCard — watchlist card using the new chart system.
//
// • Delegates chart rendering to ChartCard (which uses MiniSparklineChart)
// • Subscribes only to its own symbol via useStock (no wasted re-renders)
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { useStock } from '../state/selectors';
import ChartCard from './charts/ChartCard';

interface MiniChartCardProps {
  symbol: string;
  onPress?: (symbol: string) => void;
}

const MiniChartCard = React.memo(({ symbol, onPress }: MiniChartCardProps) => {
  const stock = useStock(symbol);

  if (!stock || stock.sparkline.length < 2) return null;

  return (
    <ChartCard
      symbol={stock.symbol}
      name={stock.name}
      price={stock.price}
      prevPrice={stock.prevPrice}
      changePercent={stock.changePercent}
      sparkline={stock.sparkline}
      onPress={onPress}
    />
  );
});

MiniChartCard.displayName = 'MiniChartCard';

export default MiniChartCard;
