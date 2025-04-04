export interface QuoteData {
    symbol: string;
    shortName: string;
    longName: string;
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    regularMarketDayHigh: number;
    regularMarketDayLow: number;
    regularMarketVolume: number;
    regularMarketOpen: number;
    regularMarketPreviousClose: number;
    exchange: string;
    currency: string;
    quoteType: "EQUITY" | "INDEX";
    _no_data?: boolean;
    _error?: string;
}