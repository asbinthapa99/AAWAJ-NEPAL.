// ─────────────────────────────────────────────────────────────────────────────
// Route: /market/stocks — renders the StockScreen
// ─────────────────────────────────────────────────────────────────────────────

import StockScreen from '../../src/screens/StockScreen';
import { MarketDataProvider } from '../../src/providers/MarketDataProvider';

export default function StocksRoute() {
  return (
    <MarketDataProvider>
      <StockScreen />
    </MarketDataProvider>
  );
}
