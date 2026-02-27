import { NextResponse } from 'next/server';

// In-memory rate limiting
const requestMap = new Map<string, { count: number; resetTime: number }>();

interface CoinData {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

interface StockData {
  symbol: string;
  price: number;
  change_percent: number;
}

interface CryptoData {
  bitcoin?: {
    usd: number;
    usd_24h_change: number;
  };
  ethereum?: {
    usd: number;
    usd_24h_change: number;
  };
  solana?: {
    usd: number;
    usd_24h_change: number;
  };
}

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const data = requestMap.get(ip);

  if (!data || now > data.resetTime) {
    requestMap.set(ip, { count: 1, resetTime: now + 5 * 60 * 1000 }); // 5-minute window
    return false;
  }

  if (data.count >= 60) {
    return true; // 60 requests per 5 minutes
  }

  data.count++;
  return false;
};

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  try {
    // Fetch crypto prices from CoinGecko (free, no auth needed)
    const cryptoRes = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true',
      { 
        cache: 'no-store',
        headers: { 'User-Agent': 'Awaaz-Nepal/1.0' }
      }
    );

    let cryptoData: CryptoData = {};
    if (cryptoRes.ok) {
      cryptoData = await cryptoRes.json();
    }

    // Format crypto data
    const cryptos = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: cryptoData.bitcoin?.usd || 66232.00,
        change: cryptoData.bitcoin?.usd_24h_change || -2.09,
        icon: '₿',
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: cryptoData.ethereum?.usd || 1925.03,
        change: cryptoData.ethereum?.usd_24h_change || -1.67,
        icon: 'Ξ',
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        price: cryptoData.solana?.usd || 245.50,
        change: cryptoData.solana?.usd_24h_change || 2.15,
        icon: '◎',
      },
    ];

    // Stock prices would need Alpha Vantage or similar (paid/limited free tier)
    // For now, we'll fetch from a free source or return mock data
    const stocks = [
      {
        symbol: 'NVDA',
        name: 'NVIDIA',
        price: 189.82,
        change: 1.02,
        icon: '📊',
      },
      {
        symbol: 'GOOG',
        name: 'Google',
        price: 314.98,
        change: 4.01,
        icon: '📊',
      },
      {
        symbol: 'TSLA',
        name: 'Tesla',
        price: 207.00,
        change: 2.15,
        icon: '📊',
      },
    ];

    return NextResponse.json(
      {
        cryptos,
        stocks,
        updated_at: new Date().toLocaleTimeString(),
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Market price error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    );
  }
}
