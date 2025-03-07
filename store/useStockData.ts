import { useEffect, useState } from 'react';
import useStockStore, { fetchStockData, StockData, QuoteData } from './stockStore';
import type { Interval } from "@/types/yahoo-finance";

interface UseStockDataResult {
  chartData: StockData | null;
  quoteData: QuoteData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 自定义Hook，用于在React组件中获取股票数据
 * 
 * @param ticker 股票代码
 * @param interval 时间间隔
 * @param pollingInterval 轮询间隔（毫秒），0表示不轮询
 * @returns 股票数据、加载状态和错误信息
 */
export default function useStockData(
  ticker: string, 
  interval: Interval = "1m",
  pollingInterval: number = 0
): UseStockDataResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 从全局状态获取数据
  const getChartData = useStockStore(state => state.getChartData);
  const getQuoteData = useStockStore(state => state.getQuoteData);
  const needsUpdate = useStockStore(state => state.needsUpdate);
  
  // 本地状态用于触发渲染
  const [chartData, setChartData] = useState<StockData | null>(getChartData(ticker));
  const [quoteData, setQuoteData] = useState<QuoteData | null>(getQuoteData(ticker));
  
  // 检查是否在交易时间
  const isTradeTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const day = now.getDay(); // 0是周日，6是周六
    
    // 周末不轮询
    if (day === 0 || day === 6) return false;
    
    // 交易时间：9:30-11:30, 13:00-15:00
    return (
      (hours === 9 && minutes >= 30) || 
      (hours === 10) || 
      (hours === 11 && minutes <= 30) ||
      (hours === 13) || 
      (hours === 14)
    );
  };
  
  // 获取数据的函数
  const fetchData = async () => {
    if (!ticker) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // 只在确实需要更新时才发起请求
      if (needsUpdate(ticker)) {
        const { chartData: newChartData, quoteData: newQuoteData } = await fetchStockData(ticker, interval);
        
        // 更新本地状态以触发重新渲染
        setChartData(newChartData);
        setQuoteData(newQuoteData);
        
        // 检查是否有错误
        if (newQuoteData?._error) {
          setError(newQuoteData._error);
        }
      } else {
        // 即使不需要更新，也从全局状态获取最新数据
        setChartData(getChartData(ticker));
        setQuoteData(getQuoteData(ticker));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 初始加载和ticker/interval变化时获取数据
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, interval]);
  
  // 设置轮询
  useEffect(() => {
    if (pollingInterval <= 0) return;
    
    console.log(`设置轮询定时器，ticker: ${ticker}, 轮询间隔: ${pollingInterval}毫秒`);
    
    const intervalId = setInterval(() => {
      // 检查是否在交易时间内
      if (isTradeTime()) {
        console.log('交易时间内，获取最新数据...');
        fetchData();
      } else {
        console.log('非交易时间，跳过轮询');
      }
    }, pollingInterval);
    
    // 清理函数
    return () => {
      console.log(`清理轮询定时器，ticker: ${ticker}`);
      clearInterval(intervalId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, interval, pollingInterval]);
  
  return {
    chartData,
    quoteData,
    isLoading,
    error,
    refetch: fetchData
  };
} 