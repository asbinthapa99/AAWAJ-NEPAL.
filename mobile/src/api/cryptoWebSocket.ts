// ─────────────────────────────────────────────────────────────────────────────
// Binance WebSocket service for real-time crypto prices.
//
// Binance sends ticker events like:
// { "stream": "btcusdt@miniTicker", "data": { "s": "BTCUSDT", "c": "65000.00",
//   "h": "66000.00", "l": "64000.00", "p": "1000.00", "P": "1.56" } }
//
// This service:
// 1. Connects to Binance combined stream endpoint (no auth required)
// 2. Subscribes to all coins' miniTicker streams in one connection
// 3. Batches rapid ticks (150ms window) before dispatching
// 4. Reconnects with exponential backoff on disconnect
// 5. Uses the same callback inversion-of-control pattern as FinnhubWebSocketService
// ─────────────────────────────────────────────────────────────────────────────

import { createUpdateBatcher } from '../utils/throttle';

export interface CryptoPriceTick {
  symbol: string;   // e.g. "BTC" (mapped from BTCUSDT)
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
}

export type CryptoTickCallback = (ticks: CryptoPriceTick[]) => void;

// Maps BINANCE pair name → our coin symbol key
const PAIR_TO_SYMBOL: Record<string, string> = {
  BTCUSDT: 'BTC', ETHUSDT: 'ETH', BNBUSDT: 'BNB', SOLUSDT: 'SOL',
  XRPUSDT: 'XRP', DOGEUSDT: 'DOGE', ADAUSDT: 'ADA', TRXUSDT: 'TRX',
  TONUSDT: 'TON', AVAXUSDT: 'AVAX', SHIBUSDT: 'SHIB', DOTUSDT: 'DOT',
  LINKUSDT: 'LINK', NEARUSDT: 'NEAR', ICPUSDT: 'ICP', APTUSDT: 'APT',
  SUIUSDT: 'SUI', ARBUSDT: 'ARB', OPUSDT: 'OP', MATICUSDT: 'POL',
  UNIUSDT: 'UNI', ATOMUSDT: 'ATOM', INJUSDT: 'INJ', GRTUSDT: 'GRT',
  LTCUSDT: 'LTC', SANDUSDT: 'SAND', MANAUSDT: 'MANA', AXSUSDT: 'AXS',
  XLMUSDT: 'XLM', ALGOUSDT: 'ALGO', HBARUSDT: 'HBAR', VETUSDT: 'VET',
  FILUSDT: 'FIL', EOSUSDT: 'EOS', FTMUSDT: 'FTM',
};

const BINANCE_WS_BASE = 'wss://stream.binance.com:9443/stream?streams=';
const RECONNECT_BASE  = 1500;
const RECONNECT_MAX   = 30_000;
const BACKOFF         = 1.8;
const BATCH_WINDOW_MS = 150;

class BinanceWebSocketService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ws: any = null;
  private onTicks: CryptoTickCallback | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private streams: string[] = [];

  // Reuse createUpdateBatcher — same pattern as FinnhubWebSocketService
  private batcher = createUpdateBatcher<CryptoPriceTick>((batch) => {
    this.onTicks?.(batch);
  }, BATCH_WINDOW_MS);

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Start receiving real-time ticks for all mapped symbols. */
  connect(onTicks: CryptoTickCallback) {
    this.onTicks = onTicks;
    this.intentionalClose = false;
    this.reconnectAttempt = 0;
    // Build stream list from every pair we know
    this.streams = Object.keys(PAIR_TO_SYMBOL).map(
      (pair) => `${pair.toLowerCase()}@miniTicker`
    );
    this._connect();
  }

  /** Disconnect and stop reconnecting. */
  disconnect() {
    this.intentionalClose = true;
    this.batcher.flush();
    this.batcher.clear();
    this._clearReconnect();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private _connect() {
    try {
      const url = BINANCE_WS_BASE + this.streams.join('/');
      this.ws = new WebSocket(url);
      if (!this.ws) return;
      this.ws.onopen    = this._onOpen.bind(this);
      this.ws.onmessage = this._onMessage.bind(this);
      this.ws.onerror   = this._onError.bind(this);
      this.ws.onclose   = this._onClose.bind(this);
    } catch (err) {
      console.warn('[CryptoWS] failed to create WebSocket:', err);
      this._scheduleReconnect();
    }
  }

  private _onOpen() {
    this.reconnectAttempt = 0;
  }

  private _onMessage(event: WebSocketMessageEvent) {
    try {
      const msg = JSON.parse(event.data) as {
        stream: string;
        data: {
          s: string;   // pair e.g. "BTCUSDT"
          c: string;   // close/current price
          h: string;   // 24h high
          l: string;   // 24h low
          p: string;   // price change
          P: string;   // price change %
        };
      };

      const pair   = msg?.data?.s;
      const symbol = PAIR_TO_SYMBOL[pair];
      if (!symbol) return;

      const tick: CryptoPriceTick = {
        symbol,
        price:         parseFloat(msg.data.c),
        high:          parseFloat(msg.data.h),
        low:           parseFloat(msg.data.l),
        change:        parseFloat(msg.data.p),
        changePercent: parseFloat(msg.data.P),
      };

      this.batcher.add(tick);
    } catch {
      // Ignore malformed frames
    }
  }

  private _onError() {
    // onClose will fire after error — reconnect logic lives there
  }

  private _onClose(event: WebSocketCloseEvent) {
    this.ws = null;
    if (!this.intentionalClose && event.code !== 1000) {
      this._scheduleReconnect();
    }
  }

  private _scheduleReconnect() {
    this._clearReconnect();
    const delay = Math.min(
      RECONNECT_BASE * Math.pow(BACKOFF, this.reconnectAttempt),
      RECONNECT_MAX
    );
    this.reconnectAttempt++;
    this.reconnectTimer = setTimeout(() => this._connect(), delay);
  }

  private _clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

// ── Singleton export (same pattern as wsService in websocketService.ts) ───────
export const cryptoWsService = new BinanceWebSocketService();
