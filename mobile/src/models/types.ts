// ─────────────────────────────────────────────────────────────────────────────
// Simplified types — stock prices & charts only.
//
// No portfolio, no notifications, no account/auth types.
// The Stock type includes a sparkline (rolling window of recent prices)
// for rendering inline mini-charts without a separate time-series query.
// ─────────────────────────────────────────────────────────────────────────────

/** Core stock data — one entry per symbol in the normalized store. */
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  prevPrice: number;         // previous tick — used for flash direction (up/down)
  prevClose: number;         // previous day close — used for daily change %
  change: number;            // absolute change since prevClose
  changePercent: number;     // percentage change since prevClose
  high: number;
  low: number;
  volume: number;
  sparkline: number[];       // last N prices for mini-charts
  updatedAt: number;         // epoch ms
}

/** WebSocket connection state. */
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

/**
 * Events flowing through the pipeline:
 * WebSocket → event parser → batcher → store
 *
 * Discriminated union so the store handler can safely narrow on `type`.
 */
export type MarketEvent =
  | { type: 'STOCK_UPDATE'; payload: Stock }
  | { type: 'BATCH_STOCK_UPDATE'; payload: Stock[] }
  | { type: 'CONNECTION_STATUS'; payload: ConnectionStatus };

/** Full Zustand store shape. */
export interface MarketState {
  stocks: Record<string, Stock>;       // normalized: O(1) lookup/update per symbol
  watchlist: string[];                 // ordered symbol list
  connectionStatus: ConnectionStatus;

  // Actions
  handleMarketEvent: (event: MarketEvent) => void;
  handleBatchStockUpdate: (stocks: Stock[]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setWatchlist: (symbols: string[]) => void;
}
