'use client'

import { useEffect, useState } from 'react'
import useStockStore, { fetchStockData } from '@/store/stockStore'
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function IndexTiles() {
  const [loading, setLoading] = useState(true)
  
  // 从全局状态获取市场指数
  const marketIndices = useStockStore(state => state.marketIndices)
  const quoteData = useStockStore(state => state.quoteData)
  
  // 加载所有指数数据
  useEffect(() => {
    const loadAllIndices = async () => {
      setLoading(true)
      try {
        // 异步加载所有指数数据
        await Promise.all(
          marketIndices.map(index => fetchStockData(index.symbol))
        )
      } catch (error) {
        console.error('加载指数数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadAllIndices()
  }, [marketIndices])
  
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="flex flex-col p-4">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-6 w-16 mb-1" />
            <Skeleton className="h-3 w-12" />
          </Card>
        ))}
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {marketIndices.map(index => {
        const quote = quoteData[index.symbol]
        
        // 如果没有数据，显示占位符
        if (!quote) {
          return (
            <Card key={index.symbol} className="flex flex-col p-4">
              <div className="text-sm text-muted-foreground">{index.shortName}</div>
              <div className="text-lg font-semibold">--</div>
              <div className="text-xs text-muted-foreground">--</div>
            </Card>
          )
        }
        
        const price = quote.regularMarketPrice
        const change = quote.regularMarketChange
        const changePercent = quote.regularMarketChangePercent
        
        // 确定颜色
        const color = changePercent > 0 
          ? "text-green-600 dark:text-green-400" 
          : changePercent < 0 
            ? "text-red-600 dark:text-red-400" 
            : "text-slate-600 dark:text-slate-400"
        
        return (
          <Card key={index.symbol} className="flex flex-col p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="text-sm text-muted-foreground">{index.shortName}</div>
            <div className="text-lg font-semibold">
              {price.toFixed(2)}
            </div>
            <div className={`text-xs ${color}`}>
              {change > 0 ? '+' : ''}{change.toFixed(2)} ({changePercent > 0 ? '+' : ''}{(changePercent * 100).toFixed(2)}%)
            </div>
          </Card>
        )
      })}
    </div>
  )
} 