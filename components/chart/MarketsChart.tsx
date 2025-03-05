import AreaClosedChart from "@/components/chart/AreaClosedChart"
import { fetchChartData } from "@/lib/yahoo-finance/fetchChartData"
import { fetchQuote } from "@/lib/yahoo-finance/fetchQuote"
import type { Interval, Range } from "@/types/yahoo-finance"

interface Quote {
  symbol: string;
  shortName?: string;
  fullExchangeName?: string;
  currency?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  regularMarketOpen?: number;
  regularMarketPreviousClose?: number;
  exchange?: string;
}

// 格式化货币
const formatCurrency = (value: number, symbol: string = "¥") => {
  return `${symbol}${value.toFixed(3)}`;
};

export default async function MarketsChart({
  ticker,
  range,
  interval,
}: {
  ticker: string
  range: Range
  interval: Interval
}) {
  try {
    console.log(`加载 MarketsChart: ticker=${ticker}, range=${range}, interval=${interval}`);
    
    // 并行获取图表数据和报价数据
    const [chartData, quoteData] = await Promise.all([
      fetchChartData(ticker, range, interval),
      fetchQuote(ticker),
    ]) as [any, Quote]
    
    console.log('Chart data received:', chartData?.quotes?.length || 0, 'data points');
    console.log('Quote data received:', quoteData?.shortName || 'No name');

    // 检查是否为中国指数
    const isChinaIndex = ["sh000016", "sh000300", "sh000852"].includes(ticker);
    
    // 获取货币符号 - 根据货币类型设置
    let currencySymbol = "¥"; // 默认人民币符号
    if (quoteData.currency === "USD") {
      currencySymbol = "$";
    } else if (quoteData.currency === "EUR") {
      currencySymbol = "€";
    } else if (quoteData.currency === "GBP") {
      currencySymbol = "£";
    }
    
    // 准备图表数据
    const chartQuotes = chartData.quotes.map((quote: any) => ({
      date: quote.date,
      price: Number(quote.close),
    }));
    
    // 检查是否有图表数据
    if (chartQuotes.length === 0) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <span className="text-sm text-gray-500">没有可用数据</span>
        </div>
      );
    }

    // 获取最新价格
    const price = quoteData.regularMarketPrice || 0;
    
    // 获取涨跌幅
    const changePercent = quoteData.regularMarketChangePercent || 0;
    const changePercentString = (changePercent * 100).toFixed(3) + "%";
    const changeColor = changePercent > 0 ? "text-green-500" : changePercent < 0 ? "text-red-500" : "text-gray-500";
    
    return (
      <div className="flex h-full w-full flex-col gap-2">
        <div className="flex flex-col">
          <h3 className="text-lg font-bold">
            {quoteData.shortName || ticker}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-medium">
              {formatCurrency(price, currencySymbol)}
            </span>
            <span className={`${changeColor}`}>
              {changePercentString}
            </span>
          </div>
          {isChinaIndex && (
            <div className="mt-1 text-sm text-gray-500">
              {quoteData.fullExchangeName || "中国指数"}
            </div>
          )}
        </div>
        <div className="h-[280px]">
          <AreaClosedChart chartQuotes={chartQuotes} range={range} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading market chart:", error);
    return (
      <div className="flex h-full w-full flex-col items-center justify-center">
        <span className="text-sm text-gray-500">图表加载失败</span>
        <span className="text-xs text-gray-400">{String(error).substring(0, 100)}</span>
      </div>
    );
  }
}
