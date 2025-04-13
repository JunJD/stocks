import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"

import { Suspense } from "react"
import IndexTiles from "@/components/stocks/IndexTiles"
import ZDFDistributionChart from '@/components/stocks/ZDFDistributionChart';
import MinuteComparisonChart from "@/components/stocks/MinuteComparisonChart"

// 现在将从全局状态获取这些板块，而不是在这里硬编码
// 这些作为默认值
const DEFAULT_INDICES = [
  { symbol: "1.000016", shortName: "上证50" },
  { symbol: "1.000300", shortName: "沪深300" },
  { symbol: "1.000852", shortName: "中证1000" },
  { symbol: "1.000001", shortName: "上证指数" },
  { symbol: "0.399001", shortName: "深证成指" },
  { symbol: "0.399006", shortName: "创业板指" },
]
export default async function Home({
  searchParams,
}: {
  searchParams?: {

  }
}) {
  return (
    <div className="space-y-6 mb-16">
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
              <CardTitle className="text-lg">上证50 成交额分析</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<div>加载中...</div>}>
                <div className="grid gap-6">
                  <MinuteComparisonChart displayType={'amount'}/>
                  {DEFAULT_INDICES.map((index) => (
                    <div className="rounded-lg shadow p-4" key={index.symbol}>
                      <h2 className="text-lg font-semibold mb-4">{index.shortName}</h2>
                      <MinuteComparisonChart symbol={index.symbol} />
                    </div>
                  ))}
                </div>
              </Suspense>
            </CardContent>
          </Card>
        </div>

        
      </div>
    </div>
  )
}
