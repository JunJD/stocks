import { unstable_noStore as noStore } from "next/cache"
import { headers } from "next/headers"

const ITEMS_PER_PAGE = 40

export async function fetchScreenerStocks(query: string, count?: number) {
  noStore()

  // PAGINATION IS HANDLED BY TENSTACK TABLE
  try {
    // 获取当前请求的 host
    const headersList = headers()
    const host = headersList.get('host') || 'localhost:3000'
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    
    // 构建URL
    const url = `${protocol}://${host}/api/py/stock/screener?screener=${encodeURIComponent(query)}&count=${count || ITEMS_PER_PAGE}`
    
    // 发送请求
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Error fetching screener data: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.log("Failed to fetch screener stocks", error)
    throw new Error("Failed to fetch screener stocks.")
  }
}
