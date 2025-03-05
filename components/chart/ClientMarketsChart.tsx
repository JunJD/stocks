'use client'

import React, { useEffect, useState } from 'react';
import type { Interval, Range } from "@/types/yahoo-finance";
import AreaClosedChart from "./AreaClosedChart";

// 客户端组件 - 处理轮询和状态更新
export default function ClientMarketsChart({ 
  initialChartData, 
  initialQuoteData, 
  ticker, 
  range, 
  interval 
}: { 
  initialChartData: any, 
  initialQuoteData: any,
  ticker: string,
  range: Range,
  interval: Interval
}) {
  const [chartData, setChartData] = useState(initialChartData);
  const [quoteData, setQuoteData] = useState(initialQuoteData);
  const [isLoading, setIsLoading] = useState(false);

  // 轮询函数 - 获取最新数据
  const fetchLatestData = async () => {
    try {
      setIsLoading(true);
      console.log(`正在获取最新数据: ${ticker}`);
      
      const response = await fetch(`/api/py/stock/quote?ticker=${ticker}`);
      const quoteResult = await response.json();
      
      const chartResponse = await fetch(`/api/py/stock/chart?ticker=${ticker}&range=${range}&interval=${interval}`);
      const chartResult = await chartResponse.json();
      
      if (chartResult && chartResult.quotes && chartResult.quotes.length > 0) {
        console.log(`获取到 ${chartResult.quotes.length} 条图表数据`);
        setChartData(chartResult);
      }
      
      if (quoteResult) {
        console.log(`获取到最新报价数据: ${quoteResult.shortName || ticker}`);
        setQuoteData(quoteResult);
      }
    } catch (error) {
      console.error('轮询数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    // 只在客户端执行
    if (typeof window === 'undefined') return;
    
    console.log('设置轮询定时器，轮询间隔: 10秒');
    
    // 设置定时器，每10秒轮询一次
    const intervalId = setInterval(() => {
      // 检查是否在交易时间内
      if (isTradeTime()) {
        console.log('交易时间内，获取最新数据...');
        fetchLatestData();
      } else {
        console.log('非交易时间，跳过轮询');
      }
    }, 10000); // 10秒间隔
    
    // 清理函数
    return () => {
      console.log('清理轮询定时器');
      clearInterval(intervalId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, range, interval]); // 当这些参数变化时重新设置轮询

  // 检查是否有图表数据
  if (!chartData || !chartData.quotes || chartData.quotes.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <span className="text-sm text-gray-500">没有可用数据</span>
      </div>
    );
  }

  // 检查是否为中国指数
  const isChinaIndex = ["sh000016", "sh000300", "sh000852"].includes(ticker);
  
  // 获取货币符号 - 根据货币类型设置
  let currencySymbol = "¥"; // 默认人民币符号
  if (quoteData.currency === "USD") {
    currencySymbol = "$";
  } else if (quoteData.currency === "EUR") {
    currencySymbol = "€";
  } else if (quoteData.currency === "GBP") {
    currencySymbol = "£";
  }
  
  // 准备图表数据
  const chartQuotes = chartData.quotes.map((quote: any) => ({
    date: quote.date,
    close: Number(quote.close),
  }));
  
  // 获取最新价格
  const price = quoteData.regularMarketPrice || 0;
  
  // 获取涨跌幅
  const changePercent = quoteData.regularMarketChangePercent || 0;
  const changePercentString = (changePercent * 100).toFixed(3) + "%";
  const changeColor = changePercent > 0 ? "text-green-500" : changePercent < 0 ? "text-red-500" : "text-gray-500";

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-4">
        <div className="flex items-baseline">
          <h2 className="text-xl font-bold">{quoteData.shortName}</h2>
          <p className="ml-2 text-xs text-gray-500">{ticker}</p>
        </div>
        <div className="flex items-baseline">
          <h3 className="mr-2 text-lg">{currencySymbol}{Number(price).toLocaleString()}</h3>
          <p className={`text-sm ${changeColor}`}>{changePercentString}</p>
          {isLoading && <span className="ml-2 text-xs text-gray-500">更新中...</span>}
        </div>
      </div>
      <div className="h-full w-full">
        <AreaClosedChart chartQuotes={chartQuotes} range={range} />
      </div>
    </div>
  );
} 