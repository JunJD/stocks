'use client'

import { useFavorites } from '@/components/providers/favorites-provider'
import useStockStore from '@/store/stockStore'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

export function FavoritesList() {
  const { favorites, removeFromFavorites } = useFavorites()
  const quoteData = useStockStore(state => state.quoteData)
  
  // 如果没有自选股，显示提示信息
  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-36 text-center">
        <p className="text-sm text-muted-foreground mb-2">暂无自选股</p>
        <p className="text-xs text-muted-foreground">
          在股票筛选器中可以添加自选股
        </p>
        <Link href="/screener" className="mt-2">
          <Button size="sm" variant="outline">
            前往添加
          </Button>
        </Link>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {favorites.map(favorite => {
        const quote = quoteData[favorite.symbol]
        
        // 如果还没有获取到数据，显示加载状态
        if (!quote) {
          return (
            <Card key={favorite.symbol} className="flex flex-col p-4 relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium">{favorite.shortName}</div>
                  <div className="text-xs text-muted-foreground">{favorite.symbol}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 absolute top-2 right-2"
                  onClick={() => removeFromFavorites(favorite.symbol)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="mt-2">
                <Skeleton className="h-6 w-16 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
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
          <Card key={favorite.symbol} className="flex flex-col p-4 relative hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <Link href={`/stocks/${favorite.symbol}`} className="flex-1 hover:underline">
                <div className="text-sm font-medium">{favorite.shortName}</div>
                <div className="text-xs text-muted-foreground">{favorite.symbol}</div>
              </Link>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 absolute top-2 right-2"
                onClick={() => removeFromFavorites(favorite.symbol)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="mt-2">
              <div className="text-lg font-semibold">
                {price.toFixed(2)}
              </div>
              <div className={`text-xs ${color}`}>
                {change > 0 ? '+' : ''}{change.toFixed(2)} ({changePercent > 0 ? '+' : ''}{(changePercent * 100).toFixed(2)}%)
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
} 