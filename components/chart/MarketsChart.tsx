import { fetchChartData } from "@/lib/yahoo-finance/fetchChartData"
import { fetchQuote } from "@/lib/yahoo-finance/fetchQuote"
import type { Interval, Range } from "@/types/yahoo-finance"
import ClientMarketsChart from "./ClientMarketsChart"

// 服务器组件 - 负责获取初始数据
export default async function MarketsChart({
  ticker,
  interval,
}: {
  ticker: string
  interval: Interval
}) {
  console.log(`加载 MarketsChart: ticker=${ticker}, interval=${interval}`);
  
  try {
    // 并行获取图表数据和报价数据
    const [chartData, quoteData] = await Promise.all([
      fetchChartData(ticker, interval),
      fetchQuote(ticker),
    ]);
    
    console.log('Chart data received:', chartData?.quotes?.length || 0, 'data points');
    console.log('Quote data received:', quoteData?.shortName || 'No name');
    
    // 检查是否有图表数据
    if (!chartData || !chartData.quotes || chartData.quotes.length === 0) {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <span className="text-sm text-gray-500">没有可用数据</span>
        </div>
      );
    }
    
    // 传递数据给客户端组件进行渲染和轮询
    return (
      <ClientMarketsChart 
        initialChartData={chartData} 
        initialQuoteData={quoteData} 
        ticker={ticker}
        interval={interval}
      />
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
