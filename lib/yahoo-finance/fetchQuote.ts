import { unstable_noStore as noStore } from "next/cache"
import { headers } from "next/headers"

export async function fetchQuote(ticker: string) {
  noStore()

  try {
    // 对 ticker 进行 URL 编码
    const encodedTicker = encodeURIComponent(ticker)
    
    // 获取当前请求的 host
    const headersList = headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    
    // 构建完整的 URL
    const url = process.env.NODE_ENV === 'development' 
      ? `http://${host}/api/py/stock/quote?ticker=${encodedTicker}`
      : `${process.env.API_BASE_URL}/api/py/stock/quote?ticker=${encodedTicker}`;
    
    // 调用 Python FastAPI 接口
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.log("Failed to fetch stock quote", error)
    throw new Error("Failed to fetch stock quote.")
  }
}
