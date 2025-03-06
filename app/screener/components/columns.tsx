"use client"

import { CellContext, ColumnDef } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
  averageDailyVolume3Month?: number
  marketCap?: number
  epsTrailingTwelveMonths?: number
  trailingPE?: number
  [key: string]: any
}

/**
 * 筛选器表格列定义
 */
export const columns: ColumnDef<ScreenerQuote>[] = [
  {
    accessorKey: "symbol",
    meta: "代码",
    header: "代码",
    cell: ({ row }) => {
      const symbol = row.getValue("symbol") as string

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
  },
  {
    accessorKey: "regularMarketPrice",
    meta: "价格",
    header: () => <div className="text-right">价格</div>,
    cell: (props: CellContext<ScreenerQuote, unknown>) => {
      const { row } = props
      const price = row.getValue("regularMarketPrice") as number
      if (price === undefined || price === null) {
        return <div className="text-right">N/A</div>
      }
      return <div className="text-right">{price.toFixed(3)}</div>
    },
  },
  {
    accessorKey: "regularMarketChange",
    meta: "涨跌额",
    header: () => <div className="text-right">涨跌额</div>,
    cell: (props: CellContext<ScreenerQuote, unknown>) => {
      const { row } = props
      const change = row.getValue("regularMarketChange") as number
      if (change === undefined || change === null) {
        return <div className="text-right">N/A</div>
      }

      const formattedChange = Math.abs(change).toFixed(3)
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
    cell: (props: CellContext<ScreenerQuote, unknown>) => {
      const { row } = props
      const changePercent = row.getValue(
        "regularMarketChangePercent"
      ) as number

      if (changePercent === undefined || changePercent === null) {
        return <div className="text-right">N/A</div>
      }

      const formattedChange = (changePercent * 100).toFixed(3)
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
    accessorKey: "regularMarketVolume",
    meta: "成交量",
    header: () => <div className="text-right">成交量</div>,
    cell: (props: CellContext<ScreenerQuote, unknown>) => {
      const { row } = props
      const volume = row.getValue("regularMarketVolume") as number
      if (volume === undefined || volume === null) {
        return <div className="text-right">N/A</div>
      }

      const formatVolume = (volume: number): string => {
        if (volume >= 1e12) {
          return (volume / 1e12).toFixed(3) + "T"
        } else if (volume >= 1e9) {
          return (volume / 1e9).toFixed(3) + "B"
        } else if (volume >= 1e6) {
          return (volume / 1e6).toFixed(3) + "M"
        } else if (volume >= 1e3) {
          return (volume / 1e3).toFixed(3) + "K"
        }
        return volume.toString()
      }

      return <div className="text-right">{formatVolume(volume)}</div>
    },
  },
  {
    accessorKey: "averageDailyVolume3Month",
    meta: "平均成交量",
    header: () => <div className="text-right">平均成交量</div>,
    cell: (props: CellContext<ScreenerQuote, unknown>) => {
      const { row } = props
      const volume = row.getValue("averageDailyVolume3Month") as number
      if (volume === undefined || volume === null) {
        return <div className="text-right">N/A</div>
      }

      const formatVolume = (volume: number): string => {
        if (volume >= 1e12) {
          return (volume / 1e12).toFixed(3) + "T"
        } else if (volume >= 1e9) {
          return (volume / 1e9).toFixed(3) + "B"
        } else if (volume >= 1e6) {
          return (volume / 1e6).toFixed(3) + "M"
        } else if (volume >= 1e3) {
          return (volume / 1e3).toFixed(3) + "K"
        }
        return volume.toString()
      }

      return <div className="text-right">{formatVolume(volume)}</div>
    },
  },
  {
    accessorKey: "marketCap",
    meta: "市值",
    header: () => <div className="text-right">市值</div>,
    cell: (props: CellContext<ScreenerQuote, unknown>) => {
      const { row } = props
      const marketCap = row.getValue("marketCap") as number
      if (marketCap === undefined || marketCap === null) {
        return <div className="text-right">N/A</div>
      }

      const formatMarketCap = (marketCap: number): string => {
        if (marketCap >= 1e12) {
          return (marketCap / 1e12).toFixed(3) + "T"
        } else if (marketCap >= 1e9) {
          return (marketCap / 1e9).toFixed(3) + "B"
        } else if (marketCap >= 1e6) {
          return (marketCap / 1e6).toFixed(3) + "M"
        } else if (marketCap >= 1e3) {
          return (marketCap / 1e3).toFixed(3) + "K"
        }
        return marketCap.toString()
      }

      return <div className="text-right">{formatMarketCap(marketCap)}</div>
    },
  },
  {
    accessorKey: "P/E",
    meta: "市盈率",
    sortUndefined: -1,
    header: ({ column }) => {
      return <div className="text-right">市盈率</div>
    },
    cell: (props: CellContext<ScreenerQuote, unknown>) => {
      const { row } = props
      const pe = row.original.trailingPE;

      if (pe === undefined || pe === null || pe <= 0) {
        return <div className="text-right">N/A</div>
      }

      return <div className="text-right">{pe.toFixed(3)}</div>
    },
  },
]
