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
  const isIntraday = interval === '1m' || interval === '2m' || interval === '5m' || 
                    interval === '15m' || interval === '30m' || interval === '60m' || 
                    interval === '1h';
                    
  // 过滤数据 - 如果是分时图，只保留最新一天的数据
  let chartQuotes = currentChartData.quotes.map((quote: any) => ({
    date: quote.date,
    close: Number(quote.close),
  }));
  
  if (isIntraday && chartQuotes.length > 0) {
    // 获取最新数据点的日期
    const latestDate = new Date(chartQuotes[chartQuotes.length - 1].date);
    const latestDay = latestDate.setHours(0, 0, 0, 0); // 设置为当天的00:00:00
    
    // 只保留当天的数据
    chartQuotes = chartQuotes.filter((quote: {date: string, close: number}) => {
      const quoteDate = new Date(quote.date);
      const quoteDay = quoteDate.setHours(0, 0, 0, 0);
      return quoteDay === latestDay;
    });
  }
  
  console.log('chartQuotes==>', chartQuotes);
  
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
        <AreaClosedChart chartQuotes={chartQuotes} interval={interval} />
      </div>
    </div>
  );
} 