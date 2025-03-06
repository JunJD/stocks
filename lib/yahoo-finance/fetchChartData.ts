import { unstable_noStore as noStore } from "next/cache"
import type { Interval, Range } from "@/types/yahoo-finance"
import { DEFAULT_RANGE, INTERVALS_FOR_RANGE, VALID_RANGES } from "./constants"
import { CalculateRange } from "@/lib/utils"
import { headers } from "next/headers"

export const validateRange = (range: string): Range =>
  VALID_RANGES.includes(range as Range) ? (range as Range) : DEFAULT_RANGE

export const validateInterval = (range: Range, interval: Interval): Interval =>
  INTERVALS_FOR_RANGE[range].includes(interval)
    ? interval
    : INTERVALS_FOR_RANGE[range][0]

export async function fetchChartData(
  ticker: string,
  interval: Interval
) {
  noStore()

  try {
    // 对 ticker 进行 URL 编码
    const encodedTicker = encodeURIComponent(ticker)
    
    // 获取当前请求的 host
    const headersList = headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    
    // 构建完整的 URL
    const url = `${protocol}://${host}/api/py/stock/chart?ticker=${encodedTicker}&interval=${interval}`
    
    // 调用 Python FastAPI 接口
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 转换为与前端组件兼容的格式
    return {
      meta: {
        currency: data.currency || "CNY",
        symbol: data.ticker || ticker,
        regularMarketPrice: data.quotes && data.quotes.length ? data.quotes[data.quotes.length - 1].close : 0,
        exchangeName: ticker === "sh000016" || ticker === "sh000300" || ticker === "sh000852" 
          ? (ticker.startsWith('0') ? "SSE" : "SZSE")
          : (data.ticker && data.ticker.startsWith('6') ? "SSE" : "SZSE"),
        instrumentType: ticker === "sh000016" || ticker === "sh000300" || ticker === "sh000852" ? "INDEX" : "EQUITY",
        chartPreviousClose: data.quotes && data.quotes.length ? data.quotes[0].close : 0,
        previousClose: data.quotes && data.quotes.length ? data.quotes[0].close : 0,
      },
      quotes: data.quotes || [],
      error: data.error
    }
  } catch (error) {
    console.log("Failed to fetch chart data", error)
    throw new Error("Failed to fetch chart data.")
  }
}
