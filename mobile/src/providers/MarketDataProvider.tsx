// ─────────────────────────────────────────────────────────────────────────────
// MarketDataProvider — manages Finnhub WebSocket lifecycle.
//
// ✅ Uses REAL Finnhub API data when API key is available (even in dev).
// ✅ Falls back to mock data only when USE_MOCK_DATA is true or no API key.
// ✅ Handles app foreground/background transitions.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { wsService } from '../api/websocketService';
import { useMarketStore } from '../state/store';
import { DEFAULT_WATCHLIST, FINNHUB_API_KEY } from '../utils/constants';
import type { MarketEvent, Stock } from '../models/types';

// ── Set this to true to force mock data (for testing without API) ────────────
const USE_MOCK_DATA = !FINNHUB_API_KEY;

// ── Mock price generator (fallback only) ─────────────────────────────────────

const MOCK_BASE_PRICES: Record<string, number> = {
  AAPL: 185.50, GOOG: 141.80, GOOGL: 141.80, MSFT: 378.90, AMZN: 178.25,
  TSLA: 248.50, META: 505.75, NFLX: 628.30, NVDA: 875.40,
  'BRK.B': 412.30, JPM: 198.45, V: 278.60, JNJ: 156.20, WMT: 168.75,
  MA: 458.90, PG: 162.35, DIS: 112.80, AMD: 178.50,
  PYPL: 68.40, INTC: 44.25, CRM: 272.90, BA: 185.60,
  NKE: 97.30, UBER: 78.45, SQ: 82.10, SNAP: 11.25,
  COIN: 225.80, PLTR: 24.60, RIVN: 18.90, SOFI: 9.45, SPY: 512.30,
};

function mockTick(symbol: string, currentPrice?: number): Stock {
  const base = currentPrice ?? MOCK_BASE_PRICES[symbol] ?? 100;
  const delta = (Math.random() - 0.5) * base * 0.005;
  const price = +(base + delta).toFixed(2);
  const prevClose = MOCK_BASE_PRICES[symbol] ?? 100;
  return {
    symbol,
    name: symbol,
    price,
    prevPrice: base,
    change: +(price - prevClose).toFixed(2),
    changePercent: +(((price - prevClose) / prevClose) * 100).toFixed(2),
    high: +(Math.max(price, prevClose) * (1 + Math.random() * 0.02)).toFixed(2),
    low: +(Math.min(price, prevClose) * (1 - Math.random() * 0.02)).toFixed(2),
    prevClose,
    volume: Math.floor(Math.random() * 10_000_000),
    sparkline: [prevClose, price],
    updatedAt: Date.now(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function MarketDataProvider({ children }: { children: React.ReactNode }) {
  const handleMarketEvent = useMarketStore((s) => s.handleMarketEvent);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const appStateRef = useRef<AppStateStatus>('active');

  useEffect(() => {
    const onEvent = (event: MarketEvent) => handleMarketEvent(event);

    if (USE_MOCK_DATA) {
      // ── MOCK MODE (only if no API key) ──────────────────────────────────
      console.log('[MarketData] No API key — using mock simulation');
      onEvent({ type: 'CONNECTION_STATUS', payload: 'connected' });

      const allSymbols = Object.keys(MOCK_BASE_PRICES);
      for (const symbol of allSymbols) {
        onEvent({ type: 'STOCK_UPDATE', payload: mockTick(symbol) });
      }

      const tick = () => {
        const stocks = useMarketStore.getState().stocks;
        const allSyms = Object.keys(MOCK_BASE_PRICES);
        const sym = allSyms[Math.floor(Math.random() * allSyms.length)];
        onEvent({ type: 'STOCK_UPDATE', payload: mockTick(sym, stocks[sym]?.price) });
        const timer = setTimeout(tick, 2000 + Math.random() * 2000);
        timersRef.current.push(timer);
      };
      tick();

    } else {
      // ── REAL: Finnhub WebSocket ─────────────────────────────────────────
      console.log('[MarketData] Connecting to Finnhub WebSocket...');
      wsService.connect(onEvent);
      wsService.subscribe(DEFAULT_WATCHLIST);
    }

    // ── App State (pause WS when backgrounded) ────────────────────────────
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current === 'background' && nextState === 'active') {
        if (!USE_MOCK_DATA) {
          wsService.connect(onEvent);
          wsService.subscribe(DEFAULT_WATCHLIST);
        }
      } else if (nextState === 'background') {
        if (!USE_MOCK_DATA) {
          wsService.disconnect();
        }
      }
      appStateRef.current = nextState;
    });

    return () => {
      sub.remove();
      timersRef.current.forEach(clearTimeout);
      if (!USE_MOCK_DATA) {
        wsService.disconnect();
      }
    };
  }, [handleMarketEvent]);

  return <>{children}</>;
}
