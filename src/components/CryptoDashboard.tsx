'use client';

import { useEffect, useRef, useState } from 'react';

const WIDGETS = [
  { id: 'tv-btc', symbol: 'BINANCE:BTCUSDT', label: 'Bitcoin', ticker: 'BTC', color: '#F7931A', category: 'Crypto' },
  { id: 'tv-eth', symbol: 'BINANCE:ETHUSDT', label: 'Ethereum', ticker: 'ETH', color: '#627EEA', category: 'Crypto' },
  { id: 'tv-sol', symbol: 'BINANCE:SOLUSDT', label: 'Solana', ticker: 'SOL', color: '#9945FF', category: 'Crypto' },
  { id: 'tv-xau', symbol: 'OANDA:XAUUSD', label: 'Gold', ticker: 'XAU', color: '#FFD700', category: 'Commodity' },
  { id: 'tv-nvda', symbol: 'NASDAQ:NVDA', label: 'NVIDIA', ticker: 'NVDA', color: '#76B900', category: 'Tech Stock' },
  { id: 'tv-googl', symbol: 'NASDAQ:GOOGL', label: 'Google', ticker: 'GOOGL', color: '#4285F4', category: 'Tech Stock' },
  { id: 'tv-tsla', symbol: 'NASDAQ:TSLA', label: 'Tesla', ticker: 'TSLA', color: '#E82127', category: 'Tech Stock' },
  { id: 'tv-aapl', symbol: 'NASDAQ:AAPL', label: 'Apple', ticker: 'AAPL', color: '#555555', category: 'Tech Stock' },
];

function TradingViewWidget({ id, symbol }: { id: string; symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width: '100%',
      height: '220',
      locale: 'en',
      dateRange: '1M',
      colorTheme: 'dark',
      isTransparent: true,
      autosize: false,
      chartOnly: false,
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [id, symbol]);

  return (
    <div ref={containerRef} className="tradingview-widget-container overflow-hidden rounded-xl">
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}

function CryptoCard({
  widget,
  index,
}: {
  widget: (typeof WIDGETS)[number];
  index: number;
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="group relative h-full overflow-hidden rounded-2xl transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        transitionDelay: `${index * 50}ms`,
      }}
    >
      {/* Premium gradient background */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
        style={{
          background: `linear-gradient(135deg, ${widget.color}44 0%, ${widget.color}22 100%)`,
        }}
      />

      {/* Main card */}
      <div className="relative h-full backdrop-blur-2xl border border-white/10 rounded-2xl p-5 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10 transition-all duration-300 shadow-2xl hover:shadow-xl hover:-translate-y-1">
        {/* Glowing border */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at top right, ${widget.color}20 0%, transparent 60%)`,
            border: `1px solid ${widget.color}30`,
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Header with badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ring-1"
                style={{
                  background: `${widget.color}22`,
                  color: widget.color,
                  borderColor: `${widget.color}40`,
                }}
              >
                {widget.ticker[0]}
              </div>
              <div>
                <p className="font-bold text-white text-sm">{widget.label}</p>
                <p className="text-xs text-white/60">{widget.ticker}</p>
              </div>
            </div>
            <div
              className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ring-1"
              style={{
                background: `${widget.color}22`,
                color: widget.color,
                borderColor: `${widget.color}40`,
              }}
            >
              {widget.category}
            </div>
          </div>

          {/* Chart */}
          <div className="my-3 -mx-2 px-2">
            <TradingViewWidget id={widget.id} symbol={widget.symbol} />
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 text-[11px] font-semibold"
            style={{ color: widget.color }}>
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: widget.color }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ backgroundColor: widget.color }}
              />
            </span>
            LIVE
          </div>
        </div>
      </div>
    </div>
  );
}

export function CryptoDashboard() {
  return (
    <section className="relative py-12 sm:py-16 md:py-20 overflow-hidden bg-black/40 dark:bg-black/60">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #6C5CE7 0%, transparent 70%)',
            animation: 'float 20s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #0984E3 0%, transparent 70%)',
            animation: 'float 25s ease-in-out infinite 2s',
          }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #F7931A 0%, transparent 70%)',
            animation: 'float 30s ease-in-out infinite 4s',
          }}
        />
      </div>

      <div className="container relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 sm:mb-16 text-center">
          <div
            className="inline-flex items-center gap-2 mb-4 px-3 sm:px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-xl text-xs sm:text-sm font-bold uppercase tracking-wider"
            style={{ animation: 'slideIn 0.6s ease-out' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-white/80">Real-Time Market Data</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-4 leading-tight"
            style={{ animation: 'slideIn 0.6s ease-out 0.1s backwards' }}
          >
            Crypto & Stock{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
              Live Charts
            </span>
          </h2>

          <p
            className="text-sm sm:text-base md:text-lg text-white/60 max-w-2xl mx-auto"
            style={{ animation: 'slideIn 0.6s ease-out 0.2s backwards' }}
          >
            Professional-grade market analysis powered by TradingView. Track 8 assets in real-time with interactive charts and technical indicators.
          </p>
        </div>

        {/* Chart Grid - Responsive layout */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 auto-rows-max">
          {WIDGETS.map((w, i) => (
            <CryptoCard key={w.id} widget={w} index={i} />
          ))}
        </div>

        {/* Info section */}
        <div className="mt-12 sm:mt-16 grid md:grid-cols-3 gap-4 sm:gap-6">
          {[
            { icon: '⚡', title: 'Real-Time Data', desc: 'Updated every second with live market prices' },
            { icon: '📊', title: 'Advanced Charts', desc: 'Professional technical analysis tools' },
            { icon: '🔒', title: 'Secure & Reliable', desc: 'Powered by trusted TradingView' },
          ].map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl hover:border-white/20 hover:bg-white/10 transition-all duration-300"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-white/60">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 sm:mt-12 p-4 sm:p-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl">
          <p className="text-xs text-amber-100 leading-relaxed">
            <strong>⚠️ Disclaimer:</strong> Market data is for informational purposes only. Prices may be delayed. Cryptocurrency and stock markets carry significant risk. Always consult a licensed financial advisor before making investment decisions. Past performance does not guarantee future results.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-30px) translateX(20px); }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        .group:hover {
          transform: translateY(-4px);
          transition: transform 0.3s ease;
        }
      `}</style>
    </section>
  );
}
