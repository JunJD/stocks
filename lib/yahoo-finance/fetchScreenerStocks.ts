import { unstable_noStore as noStore } from "next/cache"
import { headers } from "next/headers"

const ITEMS_PER_PAGE = 40

export async function fetchScreenerStocks(query: string, count?: number, page?: number) {
  noStore()

  // 使用服务器端分页
  try {
    // 获取当前请求的 host
    const headersList = headers()
    const host = headersList.get('host') || 'localhost:3000'
    
    // 构建URL，加入页码参数
    const pageParam = page || 1
    const countParam = count || ITEMS_PER_PAGE
    
    const url = process.env.NODE_ENV === 'development' 
      ? `http://${host}/api/py/stock/screener?screener=${encodeURIComponent(query)}&count=${countParam}&page=${pageParam}`
      : `${process.env.API_BASE_URL}/api/py/stock/screener?screener=${encodeURIComponent(query)}&count=${countParam}&page=${pageParam}`;
    
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
