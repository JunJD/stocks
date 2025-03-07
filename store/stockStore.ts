import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Interval } from "@/types/yahoo-finance";

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

interface StockStore {
  // 缓存的数据
  chartData: Record<string, StockData>;
  quoteData: Record<string, QuoteData>;
  
  // 上次更新时间
  lastUpdated: Record<string, number>;
  
  // 设置图表数据
  setChartData: (ticker: string, data: StockData) => void;
  
  // 设置报价数据
  setQuoteData: (ticker: string, data: QuoteData) => void;
  
  // 获取图表数据（如果没有则返回空数据）
  getChartData: (ticker: string) => StockData | null;
  
  // 获取报价数据（如果没有则返回空数据）
  getQuoteData: (ticker: string) => QuoteData | null;
  
  // 检查数据是否需要更新（超过10秒）
  needsUpdate: (ticker: string) => boolean;
}

// 创建 Zustand store
const useStockStore = create<StockStore>()(
  // 使用 persist 中间件将数据持久化到 localStorage
  persist(
    (set, get) => ({
      chartData: {},
      quoteData: {},
      lastUpdated: {},
      
      setChartData: (ticker, data) => set((state) => ({
        chartData: { ...state.chartData, [ticker]: data },
        lastUpdated: { ...state.lastUpdated, [ticker]: Date.now() }
      })),
      
      setQuoteData: (ticker, data) => set((state) => ({
        quoteData: { ...state.quoteData, [ticker]: data },
        lastUpdated: { ...state.lastUpdated, [ticker]: Date.now() }
      })),
      
      getChartData: (ticker) => {
        const state = get();
        return state.chartData[ticker] || null;
      },
      
      getQuoteData: (ticker) => {
        const state = get();
        return state.quoteData[ticker] || null;
      },
      
      needsUpdate: (ticker) => {
        const state = get();
        const lastUpdate = state.lastUpdated[ticker] || 0;
        // 如果数据超过10秒钟未更新，认为需要重新获取
        return Date.now() - lastUpdate > 10000;
      }
    }),
    {
      name: 'stock-storage', // localStorage 中的 key 名称
      partialize: (state) => ({
        chartData: state.chartData,
        quoteData: state.quoteData,
        lastUpdated: state.lastUpdated,
      }),
    }
  )
);

// 股票数据获取函数
export async function fetchStockData(ticker: string, interval: Interval = "1m") {
  const store = useStockStore.getState();
  
  // 检查是否需要更新数据
  if (store.needsUpdate(ticker)) {
    try {
      // 获取图表数据
      const chartResponse = await fetch(`/api/py/stock/chart?ticker=${ticker}&interval=${interval}`);
      const chartData = await chartResponse.json();
      
      if (chartData) {
        // 格式化为前端需要的格式
        const formattedChartData: StockData = {
          quotes: chartData.quotes || [],
          meta: {
            currency: chartData.currency || "CNY",
            symbol: chartData.ticker || ticker,
            regularMarketPrice: chartData.quotes && chartData.quotes.length ? 
              chartData.quotes[chartData.quotes.length - 1].close : 0,
            exchangeName: ticker.startsWith('6') ? "SSE" : "SZSE",
            instrumentType: ticker === "sh000016" || ticker === "sh000300" || ticker === "sh000852" ? "INDEX" : "EQUITY",
            chartPreviousClose: chartData.quotes && chartData.quotes.length ? chartData.quotes[0].close : 0,
            previousClose: chartData.quotes && chartData.quotes.length ? chartData.quotes[0].close : 0,
          },
          error: chartData.error
        };
        
        store.setChartData(ticker, formattedChartData);
      }
      
      // 获取报价数据
      const quoteResponse = await fetch(`/api/py/stock/quote?ticker=${ticker}`);
      const quoteData = await quoteResponse.json();
      
      if (quoteData) {
        store.setQuoteData(ticker, quoteData);
      }
    } catch (error) {
      console.error("获取股票数据失败:", error);
    }
  }
  
  // 返回当前缓存的数据
  return {
    chartData: store.getChartData(ticker),
    quoteData: store.getQuoteData(ticker)
  };
}

export default useStockStore; 