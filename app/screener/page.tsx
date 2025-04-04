import type { Metadata } from "next"

import { fetchScreenerStocks } from "@/lib/yahoo-finance/fetchScreenerStocks"
import { HeatMap } from "./components/heat-map"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "股票筛选器 | AKShare股票数据",
  description: "强大的股票筛选工具，帮助您筛选和发现投资机会。",
}

export default async function ScreenerPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  const screenerParam = searchParams.screener || "all_stocks"
  const countParam = searchParams.count || "100"
  
  // 定义筛选器选项及其中文标签
  const screenerOptions = [
    { id: "all_stocks", label: "全部股票" },
    { id: "most_actives", label: "成交活跃" },
    { id: "day_gainers", label: "日涨幅榜" },
    { id: "day_losers", label: "日跌幅榜" },
    { id: "small_cap_gainers", label: "小盘涨幅榜" },
    { id: "growth_technology_stocks", label: "科技成长股" },
  ]
  
  // 获取当前筛选器的中文标签
  const currentScreenerLabel = screenerOptions.find(
    (option) => option.id === screenerParam
  )?.label || "全部股票"

  // 获取筛选结果数据
  const data = await fetchScreenerStocks(screenerParam, parseInt(countParam))
  
  // 确保返回的数据格式正确
  const stockData = data?.quotes || []
  
  console.log(`筛选器获取数据: ${stockData.length}条`)

  return (
    <div className="container mx-auto py-6 mb-6">
      <HeatMap />
    </div>
  )
}
