require('dotenv').config();
const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

// ── Environment ──────────────────────────────────────────────────────────────
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!FINNHUB_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables. Check .env file.');
  process.exit(1);
}

// ── Supabase Client ──────────────────────────────────────────────────────────
// Using the Service Role key to bypass RLS and allow inserts/updates
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Constants ────────────────────────────────────────────────────────────────
// The list of stocks we want to track (matching the mobile app)
const SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'JPM', 'V',
  'JNJ', 'WMT', 'MA', 'PG', 'DIS', 'NFLX', 'AMD', 'PYPL', 'INTC', 'CRM',
  'BA', 'NKE', 'UBER', 'SQ', 'SNAP', 'COIN', 'PLTR', 'RIVN', 'SOFI', 'SPY'
];

const BATCH_INTERVAL_MS = 3000; // Flush to DB every 3 seconds
const REST_SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 60 seconds

// ── State ────────────────────────────────────────────────────────────────────
let ws = null;
let reconnectAttempts = 0;
let isShuttingDown = false;

// In-Memory Aggregation: Collects the latest trades
// Key: Symbol -> Value: { price, volume, timestamp }
let memoryCache = new Map();

// Change Detection: Keeps the last written state to prevent redundant DB writes
// Key: Symbol -> Value: { price, open, high, low, previousClose }
let lastWrittenState = new Map();

// Store company names to prefill DB rows during REST sync if needed
const companyNames = {
  AAPL: 'Apple Inc.', MSFT: 'Microsoft Corp.', GOOGL: 'Alphabet Inc.', 
  AMZN: 'Amazon.com Inc.', NVDA: 'NVIDIA Corp.', META: 'Meta Platforms', 
  TSLA: 'Tesla Inc.' // (Abbreviated for example; can expand)
};

// ── Core Worker Logic ────────────────────────────────────────────────────────

function connectFinnhub() {
  if (isShuttingDown) return;

  console.log(`[WebSocket] Connecting to Finnhub... (Attempt ${reconnectAttempts})`);
  ws = new WebSocket(`wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`);

  ws.on('open', () => {
    console.log('[WebSocket] Connected securely. Subscribing to symbols...');
    reconnectAttempts = 0;
    
    // Subscribe to all tracked symbols
    for (const symbol of SYMBOLS) {
      ws.send(JSON.stringify({ type: 'subscribe', symbol }));
    }
  });

  ws.on('message', (data) => {
    try {
      const response = JSON.parse(data.toString());
      if (response.type === 'trade' && response.data) {
        // Finnhub trade array: { s: symbol, p: price, t: timestamp, v: volume }
        for (const trade of response.data) {
          // Keep only the LATEST trade in memory for this batch
          memoryCache.set(trade.s, {
            price: trade.p,
            volume: trade.v,
            time: new Date(trade.t) // unix ms
          });
        }
      }
    } catch (err) {
      console.error('[WebSocket] Error parsing message:', err.message);
    }
  });

  ws.on('close', (code, reason) => {
    console.warn(`[WebSocket] Connection closed. Code: ${code}. Reason: ${reason}`);
    handleReconnect();
  });

  ws.on('error', (err) => {
    console.error(`[WebSocket] Connection error:`, err.message);
    ws.close();
  });
}

function handleReconnect() {
  if (isShuttingDown) return;
  
  // Exponential backoff: 2s, 4s, 8s, 16s... max 60s
  const backoff = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000);
  console.log(`[WebSocket] Reconnecting in ${backoff}ms...`);
  
  setTimeout(() => {
    reconnectAttempts++;
    connectFinnhub();
  }, backoff);
}

// ── Batch Processing ─────────────────────────────────────────────────────────

async function flushCacheToDatabase() {
  if (memoryCache.size === 0) return;

  const updates = [];
  const now = new Date().toISOString();

  // Iterate over memory cache and check for actual changes
  for (const [symbol, trade] of memoryCache.entries()) {
    const lastState = lastWrittenState.get(symbol) || {};
    
    // Only update if the price actually changed
    if (trade.price !== lastState.price) {
      updates.push({
        symbol: symbol,
        price: trade.price,
        volume: trade.volume,
        last_trade_time: trade.time.toISOString(),
        updated_at: now
      });

      // Update local change tracker
      lastState.price = trade.price;
      lastWrittenState.set(symbol, lastState);
    }
  }

  // Clear memory cache immediately so new trades accumulate while DB saves
  memoryCache.clear();

  if (updates.length > 0) {
    console.log(`[Batch] Flushing ${updates.length} price updates to Supabase...`);
    try {
      const { error } = await supabase
        .from('live_stocks')
        .upsert(updates, { onConflict: 'symbol' });

      if (error) throw error;
    } catch (err) {
      console.error('[Batch] Failed to save to Supabase:', err.message);
      // We do NOT rollback lastWrittenState here because next trade will overwrite anyway,
      // and we want to avoid getting stuck retrying old trades.
    }
  }
}

// ── REST Sync (OHLC + Prev Close) ────────────────────────────────────────────

async function fetchQuoteREST(symbol) {
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error(`[REST] Failed to fetch ${symbol}:`, err.message);
    return null;
  }
}

async function syncRestData() {
  console.log('[REST] Starting 15-minute REST sync for OHLC data...');
  const now = new Date().toISOString();
  let syncCount = 0;

  // Finnhub free tier limit is ~30 req/min. We have 30 symbols.
  // We'll fetch them sequentially with a small delay to avoid rate limits.
  for (const symbol of SYMBOLS) {
    const q = await fetchQuoteREST(symbol);
    if (!q) continue;

    const lastState = lastWrittenState.get(symbol) || {};

    // Check if REST metadata changed (Open, High, Low, PC)
    const hasChanged = 
      q.o !== lastState.open || 
      q.h !== lastState.high || 
      q.l !== lastState.low || 
      q.pc !== lastState.previousClose ||
      q.c !== lastState.price; // Also check if price happens to be different

    if (hasChanged) {
      try {
        const changeValue = q.c && q.pc ? q.c - q.pc : 0;
        const changePercent = q.c && q.pc ? ((q.c - q.pc) / q.pc) * 100 : 0;

        await supabase.from('live_stocks').upsert({
          symbol: symbol,
          name: companyNames[symbol] || symbol,
          price: q.c,
          changeValue: changeValue,
          changePercent: changePercent,
          high: q.h,
          low: q.l,
          open: q.o,
          previousClose: q.pc,
          updated_at: now
        }, { onConflict: 'symbol' });

        // Update change detector
        lastState.open = q.o;
        lastState.high = q.h;
        lastState.low = q.l;
        lastState.previousClose = q.pc;
        lastState.price = q.c;
        lastWrittenState.set(symbol, lastState);
        
        syncCount++;
      } catch (err) {
        console.error(`[REST] Supabase update failed for ${symbol}:`, err.message);
      }
    }

    // 1-second delay to respect Finnhub API rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`[REST] Sync complete. Updated ${syncCount}/${SYMBOLS.length} symbols.`);
}

// ── Lifecycle & Heartbeat ────────────────────────────────────────────────────

setInterval(() => {
  console.log(`[Heartbeat] Worker alive. Caches: ${lastWrittenState.size} tracked symbols.`);
}, HEARTBEAT_INTERVAL_MS);

// Start Batch Processor
setInterval(flushCacheToDatabase, BATCH_INTERVAL_MS);

// Start REST Sync Schedule
setInterval(syncRestData, REST_SYNC_INTERVAL_MS);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[System] Graceful shutdown initiated...');
  isShuttingDown = true;
  if (ws) ws.close();
  // Attempt final flush
  flushCacheToDatabase().then(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
  console.error('[System] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[System] Unhandled Rejection at:', promise, 'reason:', reason);
});

// ── Init ─────────────────────────────────────────────────────────────────────

console.log('=================================');
console.log('🚀 Stock Worker Service Starting');
console.log('=================================');
connectFinnhub();
syncRestData(); // Run initial REST sync immediately on boot
