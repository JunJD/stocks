"use client"

import { ColumnDef } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import Link from "next/link"

// 自定义 Quote 接口替代 yahoo-finance2 的类型
export interface Quote {
  symbol: string
  shortName?: string
  regularMarketPrice?: number
  regularMarketChange?: number
  regularMarketChangePercent?: number
  [key: string]: any
}

export const columns: ColumnDef<Quote>[] = [
  {
    accessorKey: "shortName",
    header: "Title",
    cell: (props) => {
      const { row } = props
      const title = row.getValue("shortName") as string
      const symbol = row.original.symbol

      return (
        <Link
          prefetch={false}
          href={{
            pathname: "/",
            query: { ticker: symbol },
          }}
          className="font-medium"
        >
          {title || symbol || "Unknown"}
        </Link>
      )
    },
  },
  {
    accessorKey: "regularMarketPrice",
    header: () => <div className="text-right">Price</div>,
    cell: (props) => {
      const { row } = props
      const price = row.getValue("regularMarketPrice") as number
      // 检查价格是否为有效数字
      const isValidPrice = price !== undefined && price !== null && !isNaN(price)
      return <div className="text-right">{isValidPrice ? price.toFixed(3) : "暂无"}</div>
    },
  },
  {
    accessorKey: "regularMarketChange",
    header: () => <div className="text-right">$ Change</div>,
    cell: (props) => {
      const { row } = props
      const change = row.getValue("regularMarketChange") as number
      // 检查变化值是否为有效数字
      const isValidChange = change !== undefined && change !== null && !isNaN(change)
      
      return (
        <div
          className={cn(
            "text-right",
            !isValidChange ? "" : change < 0 ? "text-red-500" : change > 0 ? "text-green-500" : ""
          )}
        >
          {isValidChange ? (change > 0 ? "+" : "") + change.toFixed(3) : "暂无"}
        </div>
      )
    },
  },
  {
    accessorKey: "regularMarketChangePercent",
    header: () => <div className="text-right">% Change</div>,
    cell: (props) => {
      const { row } = props
      const changePercent = row.getValue("regularMarketChangePercent") as number
      // 检查百分比变化是否为有效数字
      const isValidPercent = changePercent !== undefined && changePercent !== null && !isNaN(changePercent)
      
      // 安全处理无效数据
      if (!isValidPercent) {
        return (
          <div className="flex justify-end">
            <div className="w-[4rem] min-w-fit rounded-md px-2 py-0.5 text-right bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              暂无
            </div>
          </div>
        )
      }
      
      return (
        <div className="flex justify-end">
          <div
            className={cn(
              "w-[4rem] min-w-fit rounded-md px-2 py-0.5 text-right",
              changePercent < 0
                ? "bg-red-300 text-red-800 dark:bg-red-950 dark:text-red-500"
                : "bg-green-300 text-green-800 dark:bg-green-950 dark:text-green-400"
            )}
          >
            {(changePercent * 100).toFixed(3)}%
          </div>
        </div>
      )
    },
  },
]
