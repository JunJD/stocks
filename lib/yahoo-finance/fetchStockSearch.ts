import { unstable_noStore as noStore } from "next/cache"
import { headers } from 'next/headers'

// 自定义 SearchResult 接口替代 yahoo-finance2 的类型
export interface SearchQuote {
  symbol: string
  shortname: string
  exchange: string
  type: string
  [key: string]: any
}

export interface SearchNews {
  title: string
  link: string
  publisher: string
  publish_time: string
  [key: string]: any
}

export interface SearchResult {
  quotes: SearchQuote[]
  news: SearchNews[]
  count: number
  totalTime?: number
  [key: string]: any
}

export async function fetchStockSearch(ticker: string, newsCount: number = 5) {
  console.log('ticker', ticker)
  noStore()

  const queryOptions = {
    quotesCount: 1,
    newsCount: newsCount,
    enableFuzzyQuery: true,
  }
  console.log('queryOptions', queryOptions)

  try {
    // 对 ticker 进行 URL 编码
    const encodedTicker = encodeURIComponent(ticker)
    
    // 获取当前请求的 host
    const headersList = headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    
    // 构建完整的 URL
    const url = `${protocol}://${host}/api/py/stock/search?ticker=${encodedTicker}&news_count=${newsCount}`
    
    // 调用 Python FastAPI 接口
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('response==》', data)
    
    return data as SearchResult
    
  } catch (error) {
    console.log("Failed to fetch stock search", error)
    throw new Error("Failed to fetch stock search.")
  }
}
