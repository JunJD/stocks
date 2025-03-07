/**
 * 股票数据获取模块
 * 用于从API获取股票和图表数据
 */

import type { Interval, Range } from "@/types/yahoo-finance";

/**
 * 获取股票行情数据
 * @param ticker 股票代码
 * @returns 股票行情数据
 */
export async function getQuoteData(ticker: string) {
  try {
    const url = process.env.NODE_ENV === 'development'
      ? `/api/py/stock/quote?ticker=${ticker}`
      : `${process.env.API_BASE_URL}/api/py/stock/quote?ticker=${ticker}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`获取股票数据失败: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('获取股票数据错误:', error);
    // 返回一个基本的数据结构，避免UI崩溃
    return {
      symbol: ticker,
      shortName: ticker,
      regularMarketPrice: 0,
      regularMarketChangePercent: 0,
      currency: 'CNY',
    };
  }
}

/**
 * 获取图表数据
 * @param ticker 股票代码
 * @param range 时间范围
 * @param interval 时间间隔
 * @returns 图表数据
 */
export async function getChartData(ticker: string, range: Range, interval: Interval) {
  try {
    const url = process.env.NODE_ENV === 'development'
      ? `/api/py/stock/chart?ticker=${ticker}&interval=${interval}`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/py/stock/chart?ticker=${ticker}&interval=${interval}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`获取图表数据失败: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('获取图表数据错误:', error);
    // 返回一个基本的数据结构，避免UI崩溃
    return {
      ticker: ticker,
      quotes: [],
      error: String(error),
    };
  }
} 