declare module 'hamro-patro-scraper' {
  interface GoldPrice {
    goldPrices?: Array<{
      id: number;
      label: string;
      value: string;
    }>;
    updatedAt?: string;
    [key: string]: any;
  }

  export function getGoldPrices(): Promise<GoldPrice>;
}
