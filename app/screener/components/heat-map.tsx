"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

interface HeatMapStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  marketCap: number;
  sector?: string;
}

interface SectorData {
  name: string;
  changePct: number;
  stocks: HeatMapStock[];
  totalMarketCap: number;
}

interface HeatMapProps {
  industryFilter?: string;
}

export function HeatMap({ industryFilter }: HeatMapProps) {
  const [heatMapData, setHeatMapData] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    async function fetchHeatMapData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/py/stock/heatmap?type=${activeTab}`);
        const data = await response.json();
        if (data.success && data.sectors) {
          setHeatMapData(data.sectors);
        }
      } catch (error) {
        console.error("获取热力图数据失败:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchHeatMapData();
  }, [activeTab]);

  // 计算热力图方块颜色
  const getColorByChange = (changePct: number) => {
    if (changePct > 0) {
      // 绿色渐变 - 涨幅越大颜色越深
      const intensity = Math.min(Math.abs(changePct) * 10, 100);
      return `rgba(16, 185, 129, ${intensity / 100})`;
    } else {
      // 红色渐变 - 跌幅越大颜色越深
      const intensity = Math.min(Math.abs(changePct) * 10, 100);
      return `rgba(239, 68, 68, ${intensity / 100})`;
    }
  };

  // 计算方块大小 (基于市值)
  const getBlockSize = (marketCap: number, totalMarketCap: number) => {
    const minSize = 60;
    const maxSize = 180;
    const ratio = marketCap / totalMarketCap;
    const size = Math.max(minSize, Math.min(maxSize, ratio * 1000));
    return size;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>市场热力图</CardTitle>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">全市场</TabsTrigger>
            <TabsTrigger value="industry">行业板块</TabsTrigger>
            <TabsTrigger value="concept">概念板块</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {Array(15).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full rounded-md" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center">
            {heatMapData.map((sector) => (
              <div key={sector.name} className="flex flex-col items-center mb-4">
                {activeTab !== "all" && (
                  <div className="text-sm font-medium mb-2">{sector.name}</div>
                )}
                <div className="flex flex-wrap gap-2 justify-center">
                  {sector.stocks
                    .filter(stock => !industryFilter || stock.sector === industryFilter)
                    .map((stock) => (
                      <div
                        key={stock.symbol}
                        style={{
                          width: `${getBlockSize(stock.marketCap, sector.totalMarketCap)}px`,
                          height: `${getBlockSize(stock.marketCap, sector.totalMarketCap)}px`,
                          backgroundColor: getColorByChange(stock.changePct),
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          padding: "4px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          transition: "transform 0.2s",
                        }}
                        className="text-center hover:transform hover:scale-105"
                        title={`${stock.name} (${stock.symbol}): ${stock.changePct.toFixed(2)}%`}
                        onClick={() => window.location.href = `/stocks/${stock.symbol}`}
                      >
                        <div className="text-xs font-bold truncate" style={{maxWidth: "100%"}}>{stock.name}</div>
                        <div className={`text-xs ${stock.changePct >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                          {stock.changePct.toFixed(2)}%
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 