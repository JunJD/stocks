import { DataTable } from "@/components/stocks/markets/data-table"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DEFAULT_INTERVAL, DEFAULT_RANGE } from "@/lib/yahoo-finance/constants"
import { Interval } from "@/types/yahoo-finance"
import { Suspense } from "react"
import MarketsChart from "@/components/chart/MarketsChart"
import Link from "next/link"
import { columns } from "@/components/stocks/markets/columns"
import SectorPerformance from "@/components/stocks/SectorPerformance"
import {
  validateInterval,
  validateRange,
} from "@/lib/yahoo-finance/fetchChartData"
import { fetchStockSearch } from "@/lib/yahoo-finance/fetchStockSearch"
import { headers } from "next/headers"

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

// 中国A股指数
const chinaTickers = [
  { symbol: "000016", shortName: "上证50" },
  { symbol: "000300", shortName: "沪深300" },
  { symbol: "000852", shortName: "中证1000" },
  { symbol: "CL=F", shortName: "原油" },
  { symbol: "GC=F", shortName: "黄金" },
  { symbol: "SI=F", shortName: "白银" },
  { symbol: "EURUSD=X", shortName: "欧元/美元" },
  { symbol: "^TNX", shortName: "10年期国债" },
  { symbol: "BTC-USD", shortName: "比特币" },
]

// 使用中国指数作为默认显示的股票列表
const tickersFutures = chinaTickers
const tickerAfterOpen = chinaTickers

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
  // 使用沪深300指数替代道琼斯指数获取新闻
  const news = await fetchStockSearch("000300", 1)

  // 使用我们的API获取股票数据
  const fetchStockData = async (symbol: string) => {
    try {
      // 获取当前请求的 host
      const headersList = headers()
      const host = headersList.get('host') || 'localhost:3000' 
      const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
      
      // 构建URL
      const url = `${protocol}://${host}/api/py/stock/quote?ticker=${encodeURIComponent(symbol)}`
      
      // 发送请求
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Error fetching stock data: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error)
      return {
        symbol: symbol,
        shortName: `Error loading ${symbol}`,
        regularMarketPrice: 0,
        regularMarketChange: 0,
        regularMarketChangePercent: 0,
        regularMarketDayHigh: 0,
        regularMarketDayLow: 0,
        regularMarketVolume: 0
      }
    }
  }

  const promises = tickers.map(({ symbol }) => fetchStockData(symbol))
  const results = await Promise.all(promises)

  const resultsWithTitles = results.map((result, index) => ({
    ...result,
    shortName: result.shortName || tickers[index].shortName,
  }))

  const marketSentiment = getMarketSentiment(
    resultsWithTitles[0].regularMarketChangePercent
  )

  const sentimentColor =
    marketSentiment === "bullish"
      ? "text-green-500"
      : marketSentiment === "bearish"
        ? "text-red-500"
        : "text-neutral-500"

  const sentimentBackground =
    marketSentiment === "bullish"
      ? "bg-green-500/10"
      : marketSentiment === "bearish"
        ? "bg-red-300/50 dark:bg-red-950/50"
        : "bg-neutral-500/10"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="w-full lg:w-1/2">
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
        </div>
        <div className="w-full lg:w-1/2">
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
        </div>
      </div>
      <div>
        <h2 className="py-4 text-xl font-medium">市场行情</h2>
        <Card className="flex flex-col gap-4 p-6 lg:flex-row">
          <div className="w-full lg:w-1/2">
            <Suspense fallback={<div>加载中...</div>}>
              <DataTable columns={columns} data={resultsWithTitles} />
            </Suspense>
          </div>
          <div className="w-full lg:w-1/2">
            <Suspense fallback={<div>加载中...</div>}>
              <MarketsChart ticker={ticker} range={range} interval={interval} />
            </Suspense>
          </div>
        </Card>
      </div>
    </div>
  )
}
