// ─────────────────────────────────────────────────────────────────────────────
// WebSocket service for Finnhub real-time stock prices.
//
// Finnhub sends trade events like:
// { "type": "trade", "data": [{ "s": "AAPL", "p": 189.42, "t": 1710200030, "v": 100 }] }
//
// This service:
// 1. Connects to Finnhub's WebSocket endpoint
// 2. Subscribes to the user's watchlist symbols
// 3. Parses incoming trade data into our Stock format
// 4. Batches rapid updates (100ms window) before dispatching
// 5. Reconnects with exponential backoff on disconnect
// 6. Does NOT import the store — uses callback inversion of control
// ─────────────────────────────────────────────────────────────────────────────

import { MarketEvent, Stock } from '../models/types';
import { createUpdateBatcher } from '../utils/throttle';
import {
  FINNHUB_WS_URL,
  RECONNECT_BASE_DELAY_MS,
  RECONNECT_MAX_DELAY_MS,
  RECONNECT_BACKOFF_MULTIPLIER,
  STOCK_BATCH_WINDOW_MS,
  STOCK_NAMES,
} from '../utils/constants';

export type EventCallback = (event: MarketEvent) => void;

class FinnhubWebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private onEvent: EventCallback | null = null;
  private subscribedSymbols: string[] = [];

  // Reconnection
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  // Batcher: collapses rapid trade events into a single store write
  private stockBatcher = createUpdateBatcher<Stock>((batch) => {
    this.onEvent?.({ type: 'BATCH_STOCK_UPDATE', payload: batch });
  }, STOCK_BATCH_WINDOW_MS);

  constructor(url: string = FINNHUB_WS_URL) {
    this.url = url;
  }

  // ───── Public API ─────────────────────────────────────────────────────

  /** Connect and start receiving price updates. */
  connect(onEvent: EventCallback) {
    this.onEvent = onEvent;
    this.intentionalClose = false;
    this.reconnectAttempt = 0;
    this._connect();
  }

  /** Gracefully disconnect. Suppresses auto-reconnect. */
  disconnect() {
    this.intentionalClose = true;
    this.stockBatcher.flush();
    this.stockBatcher.clear();
    this._clearReconnect();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /** Subscribe to price updates for these symbols. */
  subscribe(symbols: string[]) {
    this.subscribedSymbols = [...new Set([...this.subscribedSymbols, ...symbols])];
    if (this.ws?.readyState === WebSocket.OPEN) {
      for (const symbol of symbols) {
        this._send({ type: 'subscribe', symbol });
      }
    }
  }

  /** Unsubscribe from price updates. */
  unsubscribe(symbols: string[]) {
    this.subscribedSymbols = this.subscribedSymbols.filter((s) => !symbols.includes(s));
    if (this.ws?.readyState === WebSocket.OPEN) {
      for (const symbol of symbols) {
        this._send({ type: 'unsubscribe', symbol });
      }
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ───── Internals ──────────────────────────────────────────────────────

  private _connect() {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws = null;
    }

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.onEvent?.({ type: 'CONNECTION_STATUS', payload: 'connected' });

      // Re-subscribe to all symbols on reconnect
      for (const symbol of this.subscribedSymbols) {
        this._send({ type: 'subscribe', symbol });
      }
    };

    this.ws.onmessage = (event: WebSocketMessageEvent) => {
      this._handleMessage(event.data);
    };

    this.ws.onclose = () => {
      this.onEvent?.({ type: 'CONNECTION_STATUS', payload: 'disconnected' });
      if (!this.intentionalClose) {
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      this.onEvent?.({ type: 'CONNECTION_STATUS', payload: 'reconnecting' });
    };
  }

  /**
   * Parse Finnhub trade message format:
   * { "type": "trade", "data": [{ "s": "AAPL", "p": 189.42, "t": 1710200030000, "v": 100 }] }
   */
  private _handleMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);

      if (msg.type === 'trade' && Array.isArray(msg.data)) {
        for (const trade of msg.data) {
          const stock: Stock = {
            symbol: trade.s,
            name: STOCK_NAMES[trade.s] ?? trade.s,
            price: trade.p,
            prevPrice: trade.p, // Will be set correctly by store's _mergeStock
            prevClose: trade.p, // Will be refined over time
            change: 0,
            changePercent: 0,
            high: trade.p,
            low: trade.p,
            volume: trade.v ?? 0,
            sparkline: [],      // Built by the store
            updatedAt: trade.t ?? Date.now(),
          };

          // Route through batcher — collapses rapid ticks into one store write
          this.stockBatcher.add(stock);
        }
      }
      // Finnhub also sends { "type": "ping" } — just ignore it
    } catch (e) {
      console.warn('[FinnhubWS] Failed to parse:', e);
    }
  }

  // ── Reconnection with exponential backoff ──

  private _scheduleReconnect() {
    this._clearReconnect();

    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * Math.pow(RECONNECT_BACKOFF_MULTIPLIER, this.reconnectAttempt),
      RECONNECT_MAX_DELAY_MS,
    );
    this.reconnectAttempt++;
    this.onEvent?.({ type: 'CONNECTION_STATUS', payload: 'reconnecting' });

    console.log(`[FinnhubWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempt})`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this._connect();
    }, delay);
  }

  private _clearReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private _send(data: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
}

export const wsService = new FinnhubWebSocketService();
