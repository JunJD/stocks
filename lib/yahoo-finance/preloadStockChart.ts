import useStockStore from "@/store/stockStore";
import { StockData } from "@/types/stock-data";
import { Interval } from "@/types/yahoo-finance";

// 预加载单个股票的分时图数据
export async function preloadStockChart(ticker: string, interval: Interval = "1m") {
    const store = useStockStore.getState();

    if (store.needsUpdate(ticker)) {
        try {
            const chartResponse = await fetch(`/api/py/stock/chart?ticker=${ticker}&interval=${interval}`);
            const chartData = await chartResponse.json();

            if (chartData && chartData.quotes) {
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
                return formattedChartData;
            }
        } catch (error) {
            console.error(`预加载${ticker}图表数据失败:`, error);
        }
    }

    return store.getChartData(ticker);
}
