declare module 'hamro-patro-scraper' {
    export interface GoldPriceItem {
        id?: number;
        price?: string;
    }

    export interface GoldPriceResponse {
        goldPrices?: GoldPriceItem[];
        updatedAt?: string;
    }

    export function getGoldPrices(): Promise<GoldPriceResponse>;
}
