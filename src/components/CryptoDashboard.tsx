'use client';

import { useEffect, useRef, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  Globe,
  Zap,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';

// ── Asset definitions ────────────────────────────────────────
const ASSETS = [
  {
    id: 'btc', symbol: 'BINANCE:BTCUSDT', label: 'Bitcoin', ticker: 'BTC',
    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', category: 'Crypto',
    emoji: '₿', change: '+2.41%', positive: true,
  },
  {
    id: 'eth', symbol: 'BINANCE:ETHUSDT', label: 'Ethereum', ticker: 'ETH',
    color: '#818CF8', bg: 'rgba(129,140,248,0.12)', category: 'Crypto',
    emoji: 'Ξ', change: '+1.87%', positive: true,
  },
  {
    id: 'sol', symbol: 'BINANCE:SOLUSDT', label: 'Solana', ticker: 'SOL',
    color: '#14F195', bg: 'rgba(20,241,149,0.10)', category: 'Crypto',
    emoji: '◎', change: '-0.93%', positive: false,
  },
  {
    id: 'xau', symbol: 'OANDA:XAUUSD', label: 'Gold', ticker: 'XAU/USD',
    color: '#06B6D4', bg: 'rgba(6,182,212,0.12)', category: 'Commodity',
    emoji: '🏅', change: '+0.34%', positive: true,
  },
  {
    id: 'nvda', symbol: 'NASDAQ:NVDA', label: 'NVIDIA', ticker: 'NVDA',
    color: '#84CC16', bg: 'rgba(132,204,22,0.12)', category: 'Stock',
    emoji: 'N', change: '+3.12%', positive: true,
  },
  {
    id: 'tsla', symbol: 'NASDAQ:TSLA', label: 'Tesla', ticker: 'TSLA',
    color: '#F43F5E', bg: 'rgba(244,63,94,0.12)', category: 'Stock',
    emoji: 'T', change: '-1.55%', positive: false,
  },
  {
    id: 'googl', symbol: 'NASDAQ:GOOGL', label: 'Google', ticker: 'GOOGL',
    color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', category: 'Stock',
    emoji: 'G', change: '+0.73%', positive: true,
  },
  {
    id: 'aapl', symbol: 'NASDAQ:AAPL', label: 'Apple', ticker: 'AAPL',
    color: '#94A3B8', bg: 'rgba(148,163,184,0.12)', category: 'Stock',
    emoji: '', change: '-0.28%', positive: false,
  },
];


const CATEGORIES = ['All', 'Crypto', 'Stock', 'Commodity'];

// ── TradingView chart embed ───────────────────────────────────
function TradingViewWidget({ id, symbol, height = 420 }: { id: string; symbol: string; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const check = () => document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(check() ? 'dark' : 'light');
    const obs = new MutationObserver(() => setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light'));
    obs.observe(document.documentElement, { attributes: true });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol, width: '100%', height: `${height}`,
      locale: 'en', colorTheme: theme, autosize: false,
      interval: 'D', timezone: 'Etc/UTC', theme,
      style: '1', enable_publishing: false, hide_top_toolbar: false,
      hide_legend: false, save_image: false,
      backgroundColor: 'rgba(0,0,0,0)',
      gridColor: 'rgba(120,120,120,0.04)',
    });
    container.appendChild(script);
    return () => { container.innerHTML = ''; };
  }, [id, symbol, theme, height]);

  return (
    <div ref={containerRef} className="tradingview-widget-container overflow-hidden rounded-xl w-full">
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}

// ── Mini asset selector tab ───────────────────────────────────
function AssetTab({
  asset, active, onClick,
}: { asset: typeof ASSETS[0]; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-300 shrink-0 ${active
        ? 'border-[var(--ac)] bg-[var(--acbg)] shadow-lg'
        : 'border-border/50 bg-card/40 hover:border-border hover:bg-card/70'
        }`}
      style={{
        '--ac': asset.color,
        '--acbg': asset.bg,
      } as React.CSSProperties}
    >
      {/* Token icon */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ background: asset.bg, color: asset.color, border: `1.5px solid ${asset.color}40` }}
      >
        {asset.emoji}
      </div>
      <div className="flex flex-col items-start leading-none">
        <span className={`text-xs font-bold transition-colors duration-200 ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
          {asset.ticker}
        </span>
        <span
          className={`text-[10px] font-semibold mt-0.5 flex items-center gap-0.5 ${asset.positive ? 'text-emerald-400' : 'text-rose-400'}`}
        >
          {asset.positive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
          {asset.change}
        </span>
      </div>
      {/* Active indicator dot */}
      {active && (
        <span className="ml-auto relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: asset.color }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: asset.color }} />
        </span>
      )}
    </button>
  );
}

// ── Main dashboard ────────────────────────────────────────────
export function CryptoDashboard() {
  const [activeId, setActiveId] = useState('btc');
  const [category, setCategory] = useState('All');

  const active = ASSETS.find(a => a.id === activeId) ?? ASSETS[0];
  const filtered = category === 'All' ? ASSETS : ASSETS.filter(a => a.category === category);

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Background ambient glows */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[300px] blur-[120px] opacity-20 rounded-full pointer-events-none transition-all duration-700"
        style={{ background: `radial-gradient(ellipse, ${active.color}66, transparent 70%)` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

        {/* ── Section Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-bold text-primary mb-4">
              <Activity className="w-3.5 h-3.5" />
              <span>Live Market Intelligence</span>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 market-heading">
              Global Markets
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
              Real-time charts from TradingView — crypto, stocks &amp; commodities.
            </p>
          </div>

          {/* Category filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-200 ${category === cat
                  ? 'bg-foreground text-background border-foreground shadow-sm'
                  : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main content: Chart + Sidebar ── */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">

          {/* Left: Featured chart */}
          <div className="crypto-chart-panel rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
            {/* Chart header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black shrink-0"
                  style={{ background: active.bg, color: active.color, border: `1.5px solid ${active.color}40` }}
                >
                  {active.emoji}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base text-foreground tracking-tight">{active.label}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ color: active.color, background: active.bg }}
                    >
                      {active.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground font-medium">{active.ticker}</span>
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${active.positive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {active.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {active.change} (24h)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: active.color }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: active.color }} />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live</span>
              </div>
            </div>

            {/* Chart embed */}
            <div className="p-3">
              <TradingViewWidget id={`main-${active.id}`} symbol={active.symbol} height={400} />
            </div>
          </div>

          {/* Right: Asset selector panel */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[560px] pr-1 [scrollbar-width:thin] [scrollbar-color:hsl(var(--border))_transparent]">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 mb-1">
              Select Asset
            </div>
            {filtered.map(asset => (
              <AssetTab
                key={asset.id}
                asset={asset}
                active={activeId === asset.id}
                onClick={() => setActiveId(asset.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Bottom mini info strip ── */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <Zap className="w-4 h-4" />,
              color: '#facc15',
              bg: 'rgba(250,204,21,0.1)',
              title: 'Real-Time Data',
              desc: 'Prices refresh live via TradingView\'s global infrastructure.',
            },
            {
              icon: <BarChart2 className="w-4 h-4" />,
              color: '#60a5fa',
              bg: 'rgba(96,165,250,0.1)',
              title: 'Professional Charts',
              desc: 'Full candlestick charts with technical indicator support.',
            },
            {
              icon: <Globe className="w-4 h-4" />,
              color: '#34d399',
              bg: 'rgba(52,211,153,0.1)',
              title: 'Informational Only',
              desc: 'For educational insight — not financial or investment advice.',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm hover:border-border transition-all duration-300 group"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                style={{ background: item.bg, color: item.color }}
              >
                {item.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground mb-0.5">{item.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
