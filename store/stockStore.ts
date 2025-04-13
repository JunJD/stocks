import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Interval } from "@/types/yahoo-finance";
import { StockData } from '@/types/stock-data';
import { QuoteData } from '@/types/quote-data';
import { ScreenerData } from '@/types/screener-data';
import { IndexSection } from '@/types/index-section';

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

}

// 默认市场板块
export const DEFAULT_MARKET_INDICES = [
  { symbol: "sh000016", shortName: "上证50" },
  { symbol: "sh000300", shortName: "沪深300" },
  { symbol: "sh000852", shortName: "中证1000" },
  { symbol: "sh000001", shortName: "上证指数" },
  { symbol: "sz399001", shortName: "深证成指" },
  { symbol: "sz399006", shortName: "创业板指" },
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

    }),
    {
      name: 'stock-storage',
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
export default useStockStore; 