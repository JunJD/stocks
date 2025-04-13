"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import StockHoverCard from "@/components/chart/StockHoverCard"

/**
 * 股票筛选器数据格式定义
 */
export interface ScreenerQuote {
  symbol: string
  shortName: string
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketVolume: number
  regularMarketDayHigh?: number
  regularMarketDayLow?: number
  regularMarketOpen?: number
  regularMarketPreviousClose?: number
  averageDailyVolume3Month?: number
  marketCap?: number
  trailingPE?: number
  sector?: string
  [key: string]: any
}

/**
 * 筛选器表格列定义
 */
export const columns = [
  {
    accessorKey: "symbol",
    meta: "代码",
    header: "代码",
    cell: (props: any) => {
      const symbol = props.row.symbol

      if (!symbol) {
        return <div>N/A</div>
      }

      return (
        <Link
          href={`/stocks/${symbol}`}
          className="font-bold text-blue-500 hover:underline"
        >
          {symbol}
        </Link>
      )
    },
    enableHiding: false,
  },
  {
    accessorKey: "shortName",
    meta: "公司",
    header: "公司",
    cell: (props: any) => {
      const symbol = props.row.symbol
      const shortName = props.row.shortName

      if (!shortName) {
        return <div>N/A</div>
      }

      return (
        <StockHoverCard symbol={symbol}>
          <div>{shortName}</div>
        </StockHoverCard>
      )
    },
  },
  {
    accessorKey: "regularMarketPrice",
    meta: "价格",
    header: () => <div className="text-right">价格</div>,
    cell: (props: any) => {
      const price = props.row.regularMarketPrice
      if (price === undefined || price === null) {
        return <div className="text-right">N/A</div>
      }
      return <div className="text-right">{(price / 100).toFixed(3)}</div>
    },
  },
  {
    accessorKey: "regularMarketChange",
    meta: "涨跌额",
    header: () => <div className="text-right">涨跌额</div>,
    cell: (props: any) => {
      const change = props.row.regularMarketChange
      if (change === undefined || change === null) {
        return <div className="text-right">N/A</div>
      }

      const formattedChange = Math.abs(change / 100).toFixed(3)
      const isPositive = change > 0
      const isZero = change === 0

      return (
        <div className="flex justify-end">
          <div
            className={`text-right ${
              isPositive
                ? "text-green-800 dark:text-green-400"
                : isZero
                ? "text-red-800 dark:text-red-500"
                : "text-red-800 dark:text-red-500"
            }`}
          >
            {isPositive ? "+" : ""}
            {formattedChange}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "regularMarketChangePercent",
    meta: "涨跌幅",
    header: () => <div className="text-right">涨跌幅</div>,
    cell: (props: any) => {
      const changePercent = props.row.regularMarketChangePercent

      if (changePercent === undefined || changePercent === null) {
        return <div className="text-right">N/A</div>
      }

      const formattedChange = `${(changePercent).toFixed(2)}%`
      const isPositive = changePercent > 0
      const isZero = changePercent === 0

      return (
        <div className="flex justify-end">
          <div
            className={`w-[4rem] min-w-fit rounded-md px-2 py-0.5 text-right ${
              isPositive
                ? "bg-green-300 text-green-800 dark:bg-green-950 dark:text-green-400"
                : isZero
                ? "bg-red-300 text-red-800 dark:bg-red-950 dark:text-red-500"
                : "bg-red-300 text-red-800 dark:bg-red-950 dark:text-red-500"
            }`}
          >
            {isPositive ? "+" : ""}
            {formattedChange}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "regularMarketOpen",
    meta: "今开",
    header: () => <div className="text-right">今开</div>,
    cell: (props: any) => {
      const open = props.row.regularMarketOpen
      if (open === undefined || open === null) {
        return <div className="text-right">N/A</div>
      }
      return <div className="text-right">{(open / 100).toFixed(3)}</div>
    },
  },
  {
    accessorKey: "regularMarketDayHigh",
    meta: "最高",
    header: () => <div className="text-right">最高</div>,
    cell: (props: any) => {
      const high = props.row.regularMarketDayHigh
      if (high === undefined || high === null) {
        return <div className="text-right">N/A</div>
      }
      return <div className="text-right">{(high / 100).toFixed(3)}</div>
    },
  },
  {
    accessorKey: "regularMarketDayLow",
    meta: "最低",
    header: () => <div className="text-right">最低</div>,
    cell: (props: any) => {
      const low = props.row.regularMarketDayLow
      if (low === undefined || low === null) {
        return <div className="text-right">N/A</div>
      }
      return <div className="text-right">{(low / 100).toFixed(3)}</div>
    },
  },
  {
    accessorKey: "regularMarketPreviousClose",
    meta: "昨收",
    header: () => <div className="text-right">昨收</div>,
    cell: (props: any) => {
      const close = props.row.regularMarketPreviousClose
      if (close === undefined || close === null) {
        return <div className="text-right">N/A</div>
      }
      return <div className="text-right">{(close / 100).toFixed(3)}</div>
    },
  },
 
]
