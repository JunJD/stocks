import { DataTable } from "@/components/stocks/markets/data-table"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { DEFAULT_INTERVAL, DEFAULT_RANGE } from "@/lib/yahoo-finance/constants"
import { Interval } from "@/types/yahoo-finance"
import { Suspense } from "react"

import {
  validateInterval,
  validateRange,
} from "@/lib/yahoo-finance/fetchChartData"

import IndexTiles from "@/components/stocks/IndexTiles"

import ZDFDistributionChart from '@/components/stocks/ZDFDistributionChart';
import VolumeAnalysis from "@/components/stocks/VolumeAnalysis"
import { fetchScreenerStocks } from "@/lib/yahoo-finance/fetchScreenerStocks"

function isMarketOpen() {
  const now = new Date()

  // 转换为中国时间
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Shanghai",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }
  const formatter = new Intl.DateTimeFormat([], options)

  const timeString = formatter.format(now)
  const [hour, minute] = timeString.split(":").map(Number)
  const timeInCN = hour + minute / 60

  // 获取中国时间的工作日
  const dayInCN = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Shanghai" })
  ).getDay()

  // 检查当前时间是否在中国A股交易时间内（9:30 AM - 11:30 AM, 13:00 PM - 15:00 PM）
  if (
    dayInCN >= 1 &&
    dayInCN <= 5 &&
    ((timeInCN >= 9.5 && timeInCN < 11.5) || (timeInCN >= 13 && timeInCN < 15))
  ) {
    return true
  } else {
    return false
  }
}

// 现在将从全局状态获取这些板块，而不是在这里硬编码
// 这些作为默认值
const DEFAULT_INDICES = [
  { symbol: "sh000016", shortName: "上证50" },
  { symbol: "sh000300", shortName: "沪深300" },
  { symbol: "sh000852", shortName: "中证1000" },
  { symbol: "sh000001", shortName: "上证指数" },
  { symbol: "sz399001", shortName: "深证成指" },
  { symbol: "sz399006", shortName: "创业板指" },
]

// 使用中国指数作为默认显示的股票列表
const tickersFutures = DEFAULT_INDICES
const tickerAfterOpen = DEFAULT_INDICES

function getMarketSentiment(changePercentage: number | undefined) {
  if (!changePercentage) {
    return "neutral"
  }
  if (changePercentage > 0.1) {
    return "bullish"
  } else if (changePercentage < -0.1) {
    return "bearish"
  } else {
    return "neutral"
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams?: {
    ticker?: string
    range?: string
    interval?: string
  }
}) {
  const tickers = isMarketOpen() ? tickerAfterOpen : tickersFutures

  const ticker = searchParams?.ticker || tickers[0].symbol
  const range = validateRange(searchParams?.range || DEFAULT_RANGE)
  const interval = validateInterval(
    range,
    (searchParams?.interval as Interval) || DEFAULT_INTERVAL
  )

  const results = await fetchScreenerStocks('all_stocks', -1)
  // 确保返回的数据格式正确
  const stockData = results?.quotes || []

  const resultsWithTitles = stockData.map((result: any, index: number) => ({
    ...result,
    shortName: result.shortName || tickers[index].shortName,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* <div className="w-full lg:w-1/2">
          <Card className="relative flex h-full min-h-[15rem] flex-col justify-between overflow-hidden">
            <CardHeader>
              <CardTitle className="z-50 w-fit rounded-full px-4  py-2 font-medium dark:bg-neutral-100/5">
                市场情绪{" "}
                <strong className={sentimentColor}>
                  {marketSentiment === "bullish" ? "看涨" : 
                   marketSentiment === "bearish" ? "看跌" : "中性"}
                </strong>
              </CardTitle>
            </CardHeader>
            {news.news[0] && news.news[0].title && (
              <CardFooter className="flex-col items-start">
                <p className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-500">
                  今日市场要闻
                </p>
                <Link
                  prefetch={false}
                  href={news.news[0].link}
                  className="text-lg font-extrabold"
                >
                  {news.news[0].title}
                </Link>
              </CardFooter>
            )}
            <div
              className={`pointer-events-none absolute inset-0 z-0 h-[65%] w-[65%] -translate-x-[10%] -translate-y-[30%] rounded-full blur-3xl ${sentimentBackground}`}
            />
          </Card>
        </div> */}
        {/* <div className="w-full lg:w-1/2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">板块表现</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>加载中...</div>}>
                <SectorPerformance />
              </Suspense>
            </CardContent>
          </Card>
        </div> */}
      </div>
      <div className="flex flex-col gap-6">
        <div className="w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">市场指数</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>加载中...</div>}>
                <IndexTiles />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 mt-6">
          <Suspense fallback={<div>加载中...</div>}>
            <ZDFDistributionChart />
          </Suspense>
        </div>



        <div className="flex flex-col gap-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">成交额分析</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>加载中...</div>}>
                <VolumeAnalysis data={resultsWithTitles} />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
