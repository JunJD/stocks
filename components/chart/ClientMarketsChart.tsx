'use client'

import React from 'react';
import type { Interval } from "@/types/yahoo-finance";
import AreaClosedChart from "./AreaClosedChart";
import useStockData from '@/store/useStockData';

// 客户端组件 - 通过全局状态管理获取和轮询数据
export default function ClientMarketsChart({ 
  initialChartData, 
  initialQuoteData, 
  ticker, 
  interval 
}: { 
  initialChartData: any, 
  initialQuoteData: any,
  ticker: string,
  interval: Interval
}) {
  // 使用自定义Hook获取股票数据，10秒轮询一次
  const { chartData, quoteData, isLoading, error } = useStockData(ticker, interval, 10000);
  
  // 使用初始数据或全局状态中的数据
  const currentChartData = chartData || initialChartData;
  const currentQuoteData = quoteData || initialQuoteData;

  // 检查是否有图表数据
  if (!currentChartData || !currentChartData.quotes || currentChartData.quotes.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <span className="text-sm text-gray-500">没有可用数据</span>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  // 检查是否为中国指数
  const isChinaIndex = ["sh000016", "sh000300", "sh000852"].includes(ticker);
  
  // 获取货币符号 - 根据货币类型设置
  let currencySymbol = "¥"; 
  if (currentQuoteData.currency === "USD") {
    currencySymbol = "$";
  } else if (currentQuoteData.currency === "EUR") {
    currencySymbol = "€";
  } else if (currentQuoteData.currency === "GBP") {
    currencySymbol = "£";
  }
  
  // 准备图表数据
  const chartQuotes = currentChartData.quotes.map((quote: any) => ({
    date: quote.date,
    close: Number(quote.close),
  }));
  
  // 获取最新价格
  const price = currentQuoteData.regularMarketPrice || 0;
  
  // 获取涨跌幅
  const changePercent = currentQuoteData.regularMarketChangePercent || 0;
  const changePercentString = (changePercent * 100).toFixed(3) + "%";
  const changeColor = changePercent > 0 ? "text-green-500" : changePercent < 0 ? "text-red-500" : "text-gray-500";

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-4">
        <div className="flex items-baseline">
          <h2 className="text-xl font-bold">{currentQuoteData.shortName}</h2>
          <p className="ml-2 text-xs text-gray-500">{ticker}</p>
        </div>
        <div className="flex items-baseline">
          <h3 className="mr-2 text-lg">{currencySymbol}{Number(price).toLocaleString()}</h3>
          <p className={`text-sm ${changeColor}`}>{changePercentString}</p>
          {isLoading && <span className="ml-2 text-xs text-gray-500">更新中...</span>}
        </div>
      </div>
      <div className="h-full w-full">
        <AreaClosedChart chartQuotes={chartQuotes} />
      </div>
    </div>
  );
} 