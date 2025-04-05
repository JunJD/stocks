import type { Metadata } from "next"

import { fetchScreenerStocks } from "@/lib/yahoo-finance/fetchScreenerStocks"
import { ScreenerTable } from "@/app/screener/components/data-table"
import { columns } from "@/app/screener/components/columns"

import {
    Card,
} from "@/components/ui/card"
import { Suspense } from "react"
import MarketsChart from "@/components/chart/MarketsChart"
import { validateInterval, validateRange } from "@/lib/yahoo-finance/fetchChartData"
import { DEFAULT_INTERVAL, DEFAULT_RANGE } from "@/lib/yahoo-finance/constants"
import { Interval } from "@/types/yahoo-finance"
import { FavoritesProvider } from "@/components/providers/favorites-provider"
import { FavoritesList } from "@/components/stocks/favorites-list"


export const metadata: Metadata = {
    title: "股票筛选器 | AKShare股票数据",
    description: "强大的股票筛选工具，帮助您筛选和发现投资机会。",
}

const DEFAULT_INDICES = [
    { symbol: "sh000016", shortName: "上证50" },
    { symbol: "sh000300", shortName: "沪深300" },
    { symbol: "sh000852", shortName: "中证1000" },
    { symbol: "sh000001", shortName: "上证指数" },
    { symbol: "sz399001", shortName: "深证成指" },
    { symbol: "sz399006", shortName: "创业板指" },
]

export default async function ScreenerPage({
    searchParams,
}: {
    searchParams?: {
        ticker?: string
        range?: string
        interval?: string
        screener?: string
        count?: string
        page?: string
    }
}) {
    const tickers = DEFAULT_INDICES

    const screenerParam = searchParams?.screener || "all_stocks"
    const countParam = searchParams?.count || '15'
    const pageParam = searchParams?.page || '1'
    const rangeParam = validateRange(searchParams?.range || DEFAULT_RANGE)
    const tickerParam = searchParams?.ticker || tickers[0].symbol
    const intervalParam = validateInterval(
        rangeParam,
        (searchParams?.interval as Interval) || DEFAULT_INTERVAL
    )

    // 获取筛选结果数据（带分页参数）
    const data = await fetchScreenerStocks(
        screenerParam, 
        parseInt(countParam), 
        parseInt(pageParam)
    )

    // 确保返回的数据格式正确
    const stockData = data?.quotes || []
    const totalCount = data?.total || 0

    return (
        <FavoritesProvider>
            <div className="space-y-6 mb-10">
                <div className="flex flex-col gap-4">
                    <Card className="flex flex-col gap-4 p-6 lg:flex-row">
                        <div className="w-full lg:w-1/2">
                            <FavoritesList />
                        </div>
                        <div className="w-full lg:w-1/2">
                            <Suspense fallback={<div>加载中...</div>}>
                                <MarketsChart ticker={tickerParam} interval={intervalParam} />
                            </Suspense>
                        </div>
                    </Card>
                </div>
                <div className="space-y-4">
                    <ScreenerTable 
                        data={stockData} 
                        columns={columns}
                        totalCount={totalCount}
                        currentPage={parseInt(pageParam)}
                        pageSize={parseInt(countParam)}
                    />
                </div>
            </div>
        </FavoritesProvider>
    )
}
