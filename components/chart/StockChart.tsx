import { cn } from "@/lib/utils"
import { fetchChartData } from "@/lib/yahoo-finance/fetchChartData"
import type { Interval, Range } from "@/types/yahoo-finance"
import AreaClosedChart from "./AreaClosedChart"
import { fetchQuote } from "@/lib/yahoo-finance/fetchQuote"

interface StockGraphProps {
  ticker: string
  range: Range
  interval: Interval
}

// 定义 Quote 接口以匹配 fetchQuote 返回的数据结构
interface Quote {
  symbol: string
  shortName?: string
  fullExchangeName?: string
  currency?: string
  regularMarketPrice?: number
  regularMarketChange?: number
  regularMarketChangePercent?: number
  hasPrePostMarketData?: boolean
  postMarketPrice?: number
  postMarketChange?: number
  postMarketChangePercent?: number
  preMarketPrice?: number
  preMarketChange?: number
  preMarketChangePercent?: number
}

const rangeTextMapping = {
  "1d": "",
  "1w": "一周",
  "1m": "一个月",
  "3m": "三个月",
  "1y": "一年",
}

function calculatePriceChange(qouteClose: number, currentPrice: number) {
  const firstItemPrice = qouteClose || 0
  return firstItemPrice > 0 ? ((currentPrice - firstItemPrice) / firstItemPrice) * 100 : 0
}

export default async function StockChart({
  ticker,
  range,
  interval,
}: StockGraphProps) {
  const chartData = await fetchChartData(ticker, range, interval)
  const quoteData = await fetchQuote(ticker)

  const [chart, quote] = await Promise.all([chartData, quoteData]) as [any, Quote]

  // 计算价格变化
  const priceChange =
    chart.quotes.length &&
    calculatePriceChange(
      Number(chart.quotes[0].close),
      Number(quoteData.regularMarketPrice || chart.meta.regularMarketPrice)
    )

  const ChartQuotes = chart.quotes
    .map((quote: any) => ({
      date: quote.date,
      close: quote.close?.toFixed(2),
    }))
    .filter((quote: any) => quote.close !== undefined && quote.date !== null)

  // 判断是否为A股指数
  const isChinaIndex = ticker === "000016" || ticker === "000300" || ticker === "000852";

  return (
    <div className="h-[27.5rem] w-full">
      <div>
        <div className="space-x-1 text-muted-foreground">
          <span className="font-bold text-primary">{quoteData.symbol}</span>
          <span>·</span>
          <span>
            {quoteData.fullExchangeName === "NasdaqGS"
              ? "NASDAQ"
              : quoteData.fullExchangeName}
          </span>
          <span>{quoteData.shortName}</span>
        </div>

        <div className="flex flex-row items-end justify-between">
          <div className="space-x-1">
            <span className="text-nowrap">
              <span className="text-xl font-bold">
                {quote.currency === "USD" ? "$" : "¥"}
                {quote.regularMarketPrice?.toFixed(2)}
              </span>
              <span className="font-semibold">
                {quote.regularMarketChange !== undefined &&
                quote.regularMarketChangePercent !== undefined ? (
                  quote.regularMarketChange > 0 ? (
                    <span className="text-green-800 dark:text-green-400">
                      +{quote.regularMarketChange.toFixed(2)} (+
                      {quote.regularMarketChangePercent.toFixed(2)}%)
                    </span>
                  ) : (
                    <span className="text-red-800 dark:text-red-500">
                      {quote.regularMarketChange.toFixed(2)} (
                      {quote.regularMarketChangePercent.toFixed(2)}%)
                    </span>
                  )
                ) : null}
              </span>
            </span>
            {/* 中国A股没有盘前盘后数据，所以只在非中国A股指数时显示 */}
            {!isChinaIndex && quote.hasPrePostMarketData && (
              <span className="inline space-x-1 font-semibold text-muted-foreground">
                {quote.hasPrePostMarketData && quote.postMarketPrice && (
                  <>
                    <span>·</span>
                    <span>
                      盘后: {quote.currency === "USD" ? "$" : "¥"}
                      {quote.postMarketPrice.toFixed(2)}
                    </span>
                    <span>
                      {quote.postMarketChange !== undefined &&
                      quote.postMarketChangePercent !== undefined ? (
                        quote.postMarketChange > 0 ? (
                          <span className="text-green-800 dark:text-green-400">
                            +{quote.postMarketChange.toFixed(2)} (+
                            {quote.postMarketChangePercent.toFixed(2)}%)
                          </span>
                        ) : (
                          <span className="text-red-800 dark:text-red-500">
                            {quote.postMarketChange.toFixed(2)} (
                            {quote.postMarketChangePercent.toFixed(2)}%)
                          </span>
                        )
                      ) : null}
                    </span>
                  </>
                )}
                {quote.hasPrePostMarketData && quote.preMarketPrice && (
                  <>
                    <span>·</span>
                    <span>
                      盘前: {quote.currency === "USD" ? "$" : "¥"}
                      {quote.preMarketPrice.toFixed(2)}
                    </span>
                    <span>
                      {quote.preMarketChange !== undefined &&
                      quote.preMarketChangePercent !== undefined ? (
                        quote.preMarketChange > 0 ? (
                          <span className="text-green-800 dark:text-green-400">
                            +{quote.preMarketChange.toFixed(2)} (+
                            {quote.preMarketChangePercent.toFixed(2)}%)
                          </span>
                        ) : (
                          <span className="text-red-800 dark:text-red-500">
                            {quote.preMarketChange.toFixed(2)} (
                            {quote.preMarketChangePercent.toFixed(2)}%)
                          </span>
                        )
                      ) : null}
                    </span>
                  </>
                )}
              </span>
            )}
          </div>
          <span className="space-x-1 whitespace-nowrap font-semibold">
            {priceChange !== 0 && rangeTextMapping[range] !== "" && (
              <span
                className={cn(
                  priceChange > 0
                    ? "text-green-800 dark:text-green-400"
                    : "text-red-800 dark:text-red-500"
                )}
              >
                {priceChange > 0
                  ? `+${priceChange.toFixed(2)}%`
                  : `${priceChange.toFixed(2)}%`}
              </span>
            )}
            <span className="text-muted-foreground">
              {rangeTextMapping[range]}
            </span>
          </span>
        </div>
      </div>
      {chart.quotes.length === 0 && (
        <div className="flex h-full items-center justify-center text-center text-neutral-500">
          没有可用数据
        </div>
      )}
      {chart.quotes.length > 0 && (
        <AreaClosedChart chartQuotes={ChartQuotes} range={range} />
      )}
    </div>
  )
}
