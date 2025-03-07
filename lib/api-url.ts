import { headers } from "next/headers"

/**
 * 生成API URL，根据环境自动选择开发或生产环境URL
 */
export function getApiUrl(path: string, query: Record<string, string | number | boolean> = {}) {
  // 在服务器端
  try {
    const headersList = headers()
    const host = headersList.get('host') || 'localhost:3000'
    
    // 构建查询字符串
    const queryString = Object.keys(query).length 
      ? '?' + Object.entries(query)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&')
      : '';
    
    // 根据环境返回不同的URL
    return process.env.NODE_ENV === 'development'
      ? `http://${host}/api/py/${path}${queryString}`
      : `${process.env.API_BASE_URL}/api/py/${path}${queryString}`;
  } catch (e) {
    // 在客户端
    return process.env.NODE_ENV === 'development'
      ? `/api/py/${path}`
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/py/${path}`;
  }
} 