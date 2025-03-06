"use client"

import { CellContext, ColumnDef } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import Link from "next/link"

// 替换yahoo-finance2的类型
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

export const columns: ColumnDef<ScreenerQuote>[] = [
  {
    accessorKey: "symbol",
    meta: "Symbol",
    header: "Symbol",
    cell: (props: CellContext<ScreenerQuote, unknown>) => {
      const { row } = props
      const symbol: string = row.getValue("symbol")
      return (
        <Link
          prefetch={false}
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
    meta: "Company",
    header: "Company",
  },
  {
    accessorKey: "P/E",
    meta: "P/E",
    sortUndefined: -1,
    header: ({ column }) => {
      return <div className="text-right">P/E</div>
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
  {
    accessorKey: "regularMarketPrice",
    meta: "Price",
    header: () => <div className="text-right">Price</div>,
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
    meta: "Change ($)",
    header: () => <div className="text-right">Change</div>,
    cell: (props: CellContext<ScreenerQuote, unknown>) => {
      const { row } = props
      const marketChange = row.getValue("regularMarketChange") as number
      if (marketChange === undefined || marketChange === null) {
        return <div className="text-right">N/A</div>
      }
      return (
        <div className="flex justify-end">
          <div
            className={cn(
              "text-right",
              marketChange > 0
                ? "text-green-800 dark:text-green-400"
                : "text-red-800 dark:text-red-500"
            )}
          >
            {marketChange > 0 ? "+" : ""}
            {marketChange.toFixed(3)}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "regularMarketChangePercent",
    meta: "Change (%)",
    header: () => <div className="text-right">% Change</div>,
    cell: (props: CellContext<ScreenerQuote, unknown>) => {
      const { row } = props
      const marketChangePercent = row.getValue("regularMarketChangePercent") as number
      if (marketChangePercent === undefined || marketChangePercent === null) {
        return <div className="text-right">N/A</div>
      }
      return (
        <div className="flex justify-end">
          <div
            className={cn(
              "w-[4rem] min-w-fit rounded-md px-2 py-0.5 text-right",
              marketChangePercent > 0
                ? "bg-green-300 text-green-800 dark:bg-green-950 dark:text-green-400"
                : "bg-red-300 text-red-800 dark:bg-red-950 dark:text-red-500"
            )}
          >
            {marketChangePercent > 0 ? "+" : ""}
            {marketChangePercent.toFixed(3)}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "regularMarketVolume",
    meta: "Volume",
    header: () => <div className="text-right">Volume</div>,
    cell: (props: CellContext<ScreenerQuote, unknown>) => {
      const { row } = props
      const volume = row.getValue("regularMarketVolume") as number
      if (volume === undefined || volume === null) {
        return <div className="text-right">N/A</div>
      }
      const formatVolume = (volume: number): string => {
        if (volume >= 1000000) {
          return `${(volume / 1000000).toFixed(3)}M`
        } else {
          return volume.toString()
        }
      }

      return <div className="text-right">{formatVolume(volume)}</div>
    },
  },
  {
    accessorKey: "averageDailyVolume3Month",
    meta: "Avg Volume",
    header: () => <div className="text-right">Avg Volume</div>,
    cell: (props: CellContext<ScreenerQuote, unknown>) => {
      const { row } = props
      const volume = row.getValue("averageDailyVolume3Month") as number
      if (volume === undefined || volume === null) {
        return <div className="text-right">N/A</div>
      }
      const formatVolume = (volume: number): string => {
        if (volume >= 1000000) {
          return `${(volume / 1000000).toFixed(3)}M`
        } else {
          return volume.toString()
        }
      }

      return <div className="text-right">{formatVolume(volume)}</div>
    },
  },
  {
    accessorKey: "marketCap",
    meta: "Market Cap",
    header: () => <div className="text-right">Market Cap</div>,
    cell: (props: CellContext<ScreenerQuote, unknown>) => {
      const { row } = props
      const marketCap = row.getValue("marketCap") as number
      if (marketCap === undefined || marketCap === null) {
        return <div className="text-right">N/A</div>
      }
      const formatMarketCap = (marketCap: number): string => {
        if (marketCap >= 1_000_000_000_000) {
          return `${(marketCap / 1_000_000_000_000).toFixed(3)}T`
        } else if (marketCap >= 1_000_000_000) {
          return `${(marketCap / 1_000_000_000).toFixed(3)}B`
        } else {
          return `${(marketCap / 1_000_000).toFixed(3)}M`
        }
      }

      return <div className="text-right">{formatMarketCap(marketCap)}</div>
    },
  },
]
