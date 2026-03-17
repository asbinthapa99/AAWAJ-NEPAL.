// ─────────────────────────────────────────────────────────────────────────────
// Zustand store — stock prices only.
//
// NORMALIZED MAP: stocks stored as Record<symbol, Stock> for O(1) updates.
// When AAPL updates, only the AAPL entry changes. GOOG's entry stays
// referentially stable → GOOG's StockRow skips rerender.
//
// BATCH HANDLER: The critical performance path. The WebSocket batcher
// collects rapid ticks over 100ms, then calls handleBatchStockUpdate()
// once → 1 store write → 1 React reconciliation pass (not 50).
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { Stock, ConnectionStatus, MarketEvent, MarketState } from '../models/types';
import { SPARKLINE_MAX_POINTS, DEFAULT_WATCHLIST } from '../utils/constants';

export const useMarketStore = create<MarketState>((set, get) => ({
  stocks: {},
  watchlist: DEFAULT_WATCHLIST,
  connectionStatus: 'disconnected',

  handleMarketEvent: (event: MarketEvent) => {
    switch (event.type) {
      case 'STOCK_UPDATE': {
        const stock = event.payload;
        set((state) => ({
          stocks: {
            ...state.stocks,
            [stock.symbol]: mergeStock(state.stocks[stock.symbol], stock),
          },
        }));
        break;
      }
      case 'BATCH_STOCK_UPDATE':
        get().handleBatchStockUpdate(event.payload);
        break;
      case 'CONNECTION_STATUS':
        set({ connectionStatus: event.payload });
        break;
    }
  },

  /**
   * Merge N stock updates in ONE set() call.
   * This is why 50 rapid ticks don't cause 50 rerenders.
   */
  handleBatchStockUpdate: (incoming: Stock[]) => {
    set((state) => {
      const next = { ...state.stocks };
      for (const stock of incoming) {
        next[stock.symbol] = mergeStock(next[stock.symbol], stock);
      }
      return { stocks: next };
    });
  },

  setConnectionStatus: (status: ConnectionStatus) => set({ connectionStatus: status }),

  setWatchlist: (symbols: string[]) => set({ watchlist: symbols }),
}));

/**
 * Merge incoming tick with existing stock data.
 * • Preserves prevPrice (for flash direction detection)
 * • Maintains rolling sparkline for mini-charts
 */
function mergeStock(existing: Stock | undefined, incoming: Stock): Stock {
  if (!existing) {
    return { ...incoming, prevPrice: incoming.price, sparkline: [incoming.price] };
  }

  const sparkline = [...(existing.sparkline || []), incoming.price].slice(-SPARKLINE_MAX_POINTS);

  return {
    ...incoming,
    prevPrice: existing.price,                       // Flash: compare prevPrice vs price
    prevClose: existing.prevClose || incoming.price,  // Keep first-seen as prevClose
    change: +(incoming.price - (existing.prevClose || incoming.price)).toFixed(2),
    changePercent: existing.prevClose
      ? +(((incoming.price - existing.prevClose) / existing.prevClose) * 100).toFixed(2)
      : 0,
    high: Math.max(existing.high, incoming.price),
    low: Math.min(existing.low, incoming.price),
    sparkline,
  };
}

// Backward compat
export const store = useMarketStore;
