import useStockStore from "@/store/stockStore";
import { StockData } from "@/types/stock-data";
import { Interval } from "@/types/yahoo-finance";

// 股票数据获取函数
export async function fetchStockData(ticker: string, interval: Interval = "1m") {
    const store = useStockStore.getState();
    
    // 检查是否需要更新数据
    if (store.needsUpdate(ticker)) {
      try {
        // 获取图表数据
        const chartResponse = await fetch(`/api/py/stock/chart?ticker=${ticker}&interval=${interval}`);
        const chartData = await chartResponse.json();
        
        if (chartData) {
          // 格式化为前端需要的格式
          const formattedChartData: StockData = {
            quotes: chartData.quotes || [],
            meta: {
              currency: chartData.currency || "CNY",
              symbol: chartData.ticker || ticker,
              regularMarketPrice: chartData.quotes && chartData.quotes.length ? 
                chartData.quotes[chartData.quotes.length - 1].close : 0,
              exchangeName: ticker.startsWith('6') ? "SSE" : "SZSE",
              instrumentType: ticker === "sh000016" || ticker === "sh000300" || ticker === "sh000852" ? "INDEX" : "EQUITY",
              chartPreviousClose: chartData.quotes && chartData.quotes.length ? chartData.quotes[0].close : 0,
              previousClose: chartData.quotes && chartData.quotes.length ? chartData.quotes[0].close : 0,
            },
            error: chartData.error
          };
          
          store.setChartData(ticker, formattedChartData);
        }
        
        // 获取报价数据
        const quoteResponse = await fetch(`/api/py/stock/quote?ticker=${ticker}`);
        const quoteData = await quoteResponse.json();
        
        if (quoteData) {
          store.setQuoteData(ticker, quoteData);
        }
      } catch (error) {
        console.error("获取股票数据失败:", error);
      }
    }
    
    // 返回当前缓存的数据
    return {
      chartData: store.getChartData(ticker),
      quoteData: store.getQuoteData(ticker)
    };
  }
  