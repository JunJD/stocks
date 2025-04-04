// 股票筛选器数据
export interface ScreenerData {
    quotes: ScreenerQuote[];
    screenerType: string;
    lastUpdated: number;
    error?: string;
}

// 筛选器单个股票数据
export interface ScreenerQuote {
    symbol: string;
    shortName: string;
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
    regularMarketVolume: number;
    averageDailyVolume3Month?: number;
    marketCap?: number;
    epsTrailingTwelveMonths?: number;
    trailingPE?: number;
    [key: string]: any;
}
