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
      return <div className="text-right">{price !== undefined && price !== null ? price.toFixed(2) : "N/A"}</div>
    },
  },
  {
    accessorKey: "regularMarketChange",
    header: () => <div className="text-right">$ Change</div>,
    cell: (props) => {
      const { row } = props
      const change = row.getValue("regularMarketChange") as number
      return (
        <div
          className={cn(
            "text-right",
            change < 0 ? "text-red-500" : change > 0 ? "text-green-500" : ""
          )}
        >
          {change !== undefined && change !== null ? (change > 0 ? "+" : "") + change.toFixed(2) : "N/A"}
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
      return (
        <div className="flex justify-end">
          {changePercent !== undefined && changePercent !== null ? (
            <div
              className={cn(
                "w-[4rem] min-w-fit rounded-md px-2 py-0.5 text-right",
                changePercent < 0
                  ? "bg-red-300 text-red-800 dark:bg-red-950 dark:text-red-500"
                  : "bg-green-300 text-green-800 dark:bg-green-950 dark:text-green-400"
              )}
            >
              {changePercent.toFixed(2)}%
            </div>
          ) : (
            <div className="w-[4rem] min-w-fit rounded-md px-2 py-0.5 text-right bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
              N/A
            </div>
          )}
        </div>
      )
    },
  },
]
