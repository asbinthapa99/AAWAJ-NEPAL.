// ─────────────────────────────────────────────────────────────────────────────
// Memoized selectors — stock prices & charts only.
//
// Each selector returns the MINIMAL slice of state a component needs.
// Zustand re-runs selectors on every store update; the returned reference
// only changes when the selected data actually changes → no wasted rerenders.
//
// useStock('AAPL') → AAPL StockRow rerenders
// useStock('GOOG') → stays stable when AAPL changes
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback } from 'react';
import { useMarketStore } from './store';
import { Stock, ConnectionStatus } from '../models/types';

/** Subscribe to a single stock. Only rerenders when THIS stock changes. */
export function useStock(symbol: string): Stock | undefined {
  return useMarketStore(
    useCallback((state) => state.stocks[symbol], [symbol])
  );
}

/** The ordered list of watchlist symbols. */
export function useWatchlist(): string[] {
  return useMarketStore((state) => state.watchlist);
}

/** All stocks as an object (for the chart detail screen). */
export function useStocks(): Record<string, Stock> {
  return useMarketStore((state) => state.stocks);
}

/** WebSocket connection status. */
export function useConnectionStatus(): ConnectionStatus {
  return useMarketStore((state) => state.connectionStatus);
}
