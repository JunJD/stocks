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

// 首页指数板块配置
export interface IndexSection {
  symbol: string;
  shortName: string;
}

interface StockStore {
  // 缓存的数据
  chartData: Record<string, StockData>;
  quoteData: Record<string, QuoteData>;
  
  // 筛选器数据
  screenerData: ScreenerData | null;
  
  // 自选股列表
  favorites: IndexSection[];
  
  // 市场首页指数板块
  marketIndices: IndexSection[];
  
  // 上次更新时间
  lastUpdated: Record<string, number>;
  
  // 设置图表数据
  setChartData: (ticker: string, data: StockData) => void;
  
  // 设置报价数据
  setQuoteData: (ticker: string, data: QuoteData) => void;
  
  // 设置筛选器数据
  setScreenerData: (data: ScreenerData) => void;
  
  // 添加自选股
  addToFavorites: (stock: IndexSection) => void;
  
  // 从自选股移除
  removeFromFavorites: (symbol: string) => void;
  
  // 获取图表数据（如果没有则返回空数据）
  getChartData: (ticker: string) => StockData | null;
  
  // 获取报价数据（如果没有则返回空数据）
  getQuoteData: (ticker: string) => QuoteData | null;
  
  // 检查数据是否需要更新（超过10秒）
  needsUpdate: (ticker: string) => boolean;
  
  // 检查是否在自选股中
  isFavorite: (symbol: string) => boolean;
  
  // 更新市场指数列表
  setMarketIndices: (indices: IndexSection[]) => void;
}

// 默认市场板块
const DEFAULT_MARKET_INDICES = [
  { symbol: "sh000016", shortName: "上证50" },
  { symbol: "sh000300", shortName: "沪深300" },
  { symbol: "sh000852", shortName: "中证1000" },
];

// 创建 Zustand store
const useStockStore = create<StockStore>()(
  // 使用 persist 中间件将数据持久化到 localStorage
  persist(
    (set, get) => ({
      chartData: {},
      quoteData: {},
      screenerData: null,
      favorites: [],
      marketIndices: DEFAULT_MARKET_INDICES,
      lastUpdated: {},
      
      setChartData: (ticker, data) => set((state) => ({
        chartData: { ...state.chartData, [ticker]: data },
        lastUpdated: { ...state.lastUpdated, [ticker]: Date.now() }
      })),
      
      setQuoteData: (ticker, data) => set((state) => ({
        quoteData: { ...state.quoteData, [ticker]: data },
        lastUpdated: { ...state.lastUpdated, [ticker]: Date.now() }
      })),
      
      setScreenerData: (data) => set(() => ({
        screenerData: data
      })),
      
      addToFavorites: (stock) => set((state) => {
        // 检查是否已经存在
        if (state.favorites.some(item => item.symbol === stock.symbol)) {
          return state;
        }
        return {
          favorites: [...state.favorites, stock]
        };
      }),
      
      removeFromFavorites: (symbol) => set((state) => ({
        favorites: state.favorites.filter(stock => stock.symbol !== symbol)
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
      },
      
      isFavorite: (symbol) => {
        const state = get();
        return state.favorites.some(stock => stock.symbol === symbol);
      },
      
      setMarketIndices: (indices) => set(() => ({
        marketIndices: indices
      }))
    }),
    {
      name: 'stock-storage', // localStorage 中的 key 名称
      partialize: (state) => ({
        chartData: state.chartData,
        quoteData: state.quoteData,
        favorites: state.favorites,
        marketIndices: state.marketIndices,
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

// 获取筛选器数据
export async function fetchScreenerData(screenerType: string = "most_actives", count: number = 40) {
  const store = useStockStore.getState();
  const currentScreenerData = store.screenerData;
  
  // 只有当筛选器类型不同或数据超过30秒未更新时，才重新获取
  const needsUpdate = !currentScreenerData || 
                      currentScreenerData.screenerType !== screenerType || 
                      (Date.now() - currentScreenerData.lastUpdated > 30000);
  
  if (needsUpdate) {
    try {
      const response = await fetch(`/api/py/stock/screener?screener=${screenerType}&count=${count}`);
      const data = await response.json();
      
      if (data && data.quotes) {
        const screenerData: ScreenerData = {
          quotes: data.quotes,
          screenerType,
          lastUpdated: Date.now(),
          error: data.error
        };
        
        store.setScreenerData(screenerData);
        return screenerData;
      }
    } catch (error) {
      console.error("获取筛选器数据失败:", error);
      return currentScreenerData;
    }
  }
  
  return currentScreenerData;
}

// 预加载单个股票的分时图数据
export async function preloadStockChart(ticker: string, interval: Interval = "1m") {
  const store = useStockStore.getState();
  
  if (store.needsUpdate(ticker)) {
    try {
      const chartResponse = await fetch(`/api/py/stock/chart?ticker=${ticker}&interval=${interval}`);
      const chartData = await chartResponse.json();
      
      if (chartData && chartData.quotes) {
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
        return formattedChartData;
      }
    } catch (error) {
      console.error(`预加载${ticker}图表数据失败:`, error);
    }
  }
  
  return store.getChartData(ticker);
}

export default useStockStore; 