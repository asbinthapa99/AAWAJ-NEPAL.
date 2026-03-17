// ─────────────────────────────────────────────────────────────────────────────
// Configuration constants for the live stock price screen.
// All timing values are in milliseconds.
// ─────────────────────────────────────────────────────────────────────────────

// ── Finnhub WebSocket ────────────────────────────────────────────────────────
// Keys loaded from .env file (see .env.example)
import { FINNHUB_API_KEY as ENV_FINNHUB_KEY } from '@env';

export const FINNHUB_API_KEY = ENV_FINNHUB_KEY;
export const FINNHUB_WS_URL = `wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`;

// ── Reconnection ─────────────────────────────────────────────────────────────
export const RECONNECT_BASE_DELAY_MS = 1_000;
export const RECONNECT_MAX_DELAY_MS = 30_000;
export const RECONNECT_BACKOFF_MULTIPLIER = 2;

// ── Update Batching ──────────────────────────────────────────────────────────
// Collapses rapid-fire price ticks into a single store write.
// 100ms is a good balance: fast enough to feel real-time, but batches bursts.
export const STOCK_BATCH_WINDOW_MS = 100;

// ── Animations ───────────────────────────────────────────────────────────────
export const PRICE_FLASH_DURATION_MS = 500;
export const NUMBER_TRANSITION_DURATION_MS = 400;

// ── Sparkline ────────────────────────────────────────────────────────────────
export const SPARKLINE_MAX_POINTS = 60; // More history for smooth charts

// ── Virtualization ───────────────────────────────────────────────────────────
export const STOCK_ROW_HEIGHT = 72;

// ── Default Watchlist ────────────────────────────────────────────────────────
export const DEFAULT_WATCHLIST = [
  'AAPL', 'GOOG', 'MSFT', 'AMZN', 'TSLA', 'META', 'NFLX', 'NVDA',
];

export const STOCK_NAMES: Record<string, string> = {
  AAPL: 'Apple Inc.',
  GOOG: 'Alphabet Inc.',
  GOOGL: 'Alphabet Inc.',
  MSFT: 'Microsoft Corp.',
  AMZN: 'Amazon.com Inc.',
  TSLA: 'Tesla Inc.',
  META: 'Meta Platforms',
  NFLX: 'Netflix Inc.',
  NVDA: 'NVIDIA Corp.',
  'BRK.B': 'Berkshire Hathaway',
  JPM: 'JPMorgan Chase',
  V: 'Visa Inc.',
  JNJ: 'Johnson & Johnson',
  WMT: 'Walmart Inc.',
  MA: 'Mastercard Inc.',
  PG: 'Procter & Gamble',
  DIS: 'Walt Disney Co.',
  AMD: 'Advanced Micro Devices',
  PYPL: 'PayPal Holdings',
  INTC: 'Intel Corp.',
  CRM: 'Salesforce Inc.',
  BA: 'Boeing Co.',
  NKE: 'Nike Inc.',
  UBER: 'Uber Technologies',
  SQ: 'Block Inc.',
  SNAP: 'Snap Inc.',
  COIN: 'Coinbase Global',
  PLTR: 'Palantir Technologies',
  RIVN: 'Rivian Automotive',
  SOFI: 'SoFi Technologies',
  SPY: 'S&P 500 ETF',
};
