export interface StockData {
    quotes: any[];
    meta: {
        currency: string;
        symbol: string;
        regularMarketPrice: number;
        exchangeName: string;
        instrumentType: string;
        chartPreviousClose: number;
        previousClose: number;
    };
    error?: string;
}