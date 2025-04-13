import { Suspense } from 'react'
import { DEFAULT_MARKET_INDICES } from '@/store/stockStore'
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import MarketsChart from '../chart/MarketsChart'

export default function IndexTiles() {

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {DEFAULT_MARKET_INDICES.map(({ symbol }) => {
        return (
          <Suspense fallback={
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="flex flex-col p-4">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-16 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </Card>
              ))}
            </div>
          } key={symbol}>
            <MarketsChart ticker={symbol} interval="1d" />
          </Suspense>
        )
      })}
    </div>
  )
} 