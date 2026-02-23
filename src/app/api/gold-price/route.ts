import { NextResponse } from 'next/server';
import { getGoldPrices } from 'hamro-patro-scraper';

type RateEntry = {
  count: number;
  start: number;
};

type GoldItem = {
  id: number;
  label: string;
  value: string;
};

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX = 60;
const CACHE_TTL_MS = 2 * 60 * 1000;

const rateLimitMap = new Map<string, RateEntry>();
let cache: { data: { items: GoldItem[]; updated_at: string }; expiresAt: number } | null = null;

const getClientIp = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

const isRateLimited = (ip: string) => {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.start > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return false;
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
};

const normalizeItems = (items: Array<{ id?: number; price?: string }>): GoldItem[] => {
  return items
    .map((item, index) => {
      const raw = String(item?.price ?? '').replace(/\s+/g, ' ').trim();
      if (!raw) return null;

      const match = raw.match(/^(.*?)-\s*Nrs\.?\s*(.+)$/i);
      const label = match ? match[1].trim() : raw;
      const value = match ? `Nrs. ${match[2].trim()}` : '';

      return {
        id: typeof item?.id === 'number' ? item.id : index + 1,
        label,
        value,
      };
    })
    .filter((item): item is GoldItem => Boolean(item));
};

const normalizeUpdatedAt = (value: string) => value.replace(/^Last Updated:\s*/i, '').trim();

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  if (cache && cache.expiresAt > Date.now()) {
    return NextResponse.json(cache.data, {
      headers: {
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=60',
      },
    });
  }

  try {
    const data = await getGoldPrices();
    const items = normalizeItems(Array.isArray(data?.goldPrices) ? data.goldPrices : []);
    const updatedAt = normalizeUpdatedAt(String(data?.updatedAt ?? ''));
    const payload = {
      items,
      updated_at: updatedAt,
    };

    cache = {
      data: payload,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch gold/silver prices' }, { status: 502 });
  }
}
