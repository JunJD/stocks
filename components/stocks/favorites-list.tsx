'use client'

import React from 'react'
import { useFavorites } from '@/components/providers/favorites-provider'
import useStockStore from '@/store/stockStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from '@/lib/utils'

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
    <Card className="h-full">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead className="text-right">价格</TableHead>
              <TableHead className="text-right">涨跌额</TableHead>
              <TableHead className="text-right">涨跌幅</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {favorites.map((favorite) => {
              const quote = quoteData[favorite.symbol] || {};
              const { 
                regularMarketPrice, 
                regularMarketChange, 
                regularMarketChangePercent 
              } = quote;
              
              return (
                <TableRow key={favorite.symbol}>
                  <TableCell>
                    <Link
                      prefetch={false}
                      href={{
                        pathname: "/optional",
                        query: { ticker: favorite.symbol },
                      }}
                      className="font-medium"
                    >
                      {favorite.shortName || favorite.symbol || "Unknown"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    {regularMarketPrice !== undefined ? regularMarketPrice.toFixed(2) : "--"}
                  </TableCell>
                  <TableCell className="text-right">
                    {regularMarketChange !== undefined ? (
                      <span 
                        className={
                          regularMarketChange > 0 
                            ? "text-green-600 dark:text-green-400" 
                            : regularMarketChange < 0 
                              ? "text-red-600 dark:text-red-400" 
                              : ""
                        }
                      >
                        {regularMarketChange > 0 ? "+" : ""}
                        {regularMarketChange.toFixed(2)}
                      </span>
                    ) : "--"}
                  </TableCell>
                  <TableCell className="text-right">
                    {regularMarketChangePercent !== undefined ? (
                      <div className="flex justify-end">
                        <div
                          className={cn(
                            "w-[4rem] min-w-fit rounded-md px-2 py-0.5 text-right",
                            regularMarketChangePercent < 0
                              ? "bg-red-300 text-red-800 dark:bg-red-950 dark:text-red-500"
                              : "bg-green-300 text-green-800 dark:bg-green-950 dark:text-green-400"
                          )}
                        >
                          {regularMarketChangePercent > 0 ? "+" : ""}
                          {(regularMarketChangePercent * 100).toFixed(2)}%
                        </div>
                      </div>
                    ) : "--"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeFromFavorites(favorite.symbol)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 