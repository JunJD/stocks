import { fetchChartData } from "@/lib/yahoo-finance/fetchChartData"
import { Interval, Range } from "@/types/yahoo-finance"
import AreaClosedChart from "./AreaClosedChart"
import { fetchQuote } from "@/lib/yahoo-finance/fetchQuote"

// 定义Quote接口
interface Quote {
  symbol: string;
  shortName?: string;
  currency?: string;
  regularMarketPrice?: number;
}

export default async function MarketsChart({
  ticker,
  range,
  interval,
}: {
  ticker: string
  range: Range
  interval: Interval
}) {
  const chartData = await fetchChartData(ticker, range, interval)
  const quoteData = await fetchQuote(ticker)

  const [chart, quote] = await Promise.all([chartData, quoteData]) as [any, Quote]

  const stockQuotes = chart.quotes
    ? chart.quotes
        .map((quoteItem: any) => ({
          date: quoteItem.date,
          close: quoteItem.close?.toFixed(2),
        }))
        .filter((quoteItem: any) => quoteItem.close !== undefined && quoteItem.date !== null)
    : []

  // 判断是否为A股指数
  const isChinaIndex = ticker === "000016" || ticker === "000300" || ticker === "000852";
  const currencySymbol = quote.currency === "USD" ? "$" : "¥";

  return (
    <>
      <div className="mb-0.5 font-medium">
        {quote.shortName} ({quote.symbol}){" "}
        {quote.regularMarketPrice?.toLocaleString(undefined, {
          style: "currency",
          currency: quote.currency || "CNY",
          currencyDisplay: "symbol"
        })}
      </div>
      {chart.quotes.length > 0 ? (
        <AreaClosedChart chartQuotes={stockQuotes} range={range} />
      ) : (
        <div className="flex h-full items-center justify-center text-center text-neutral-500">
          没有可用数据
        </div>
      )}
    </>
  )
}
