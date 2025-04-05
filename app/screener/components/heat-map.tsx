"use client"

import { useEffect, useState, ReactNode, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Responsive as ResponsiveGridLayout } from "react-grid-layout"
import { RefreshCcw } from "lucide-react"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { Treemap, ResponsiveContainer, Tooltip } from "recharts"

interface HeatMapStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  marketCap: number;
  sector?: string;
  sectorName?: string;
}

interface SectorData {
  name: string;
  changePct: number;
  stocks: HeatMapStock[];
  totalMarketCap: number;
  netInflow?: number;
  netInflowRatio?: number;
}

interface HeatMapProps {
  industryFilter?: string;
}

// TreeMap数据结构定义
interface TreeMapItem {
  name: string;
  value: number;
  symbol: string;
  changePct: number;
  netInflow?: number;
  netInflowRatio?: number;
  children?: TreeMapItem[];
  color?: string;
  maxValue?: number;
}

export function HeatMap({ industryFilter }: HeatMapProps) {
  const [heatMapData, setHeatMapData] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("industry");

  const fetchHeatMapData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/py/stock/heatmap?type=${activeTab}`);
      const data = await response.json();
      if (data.success && data.sectors) {
        // 如果是行业板块，根据主力净流入绝对值排序
        if (activeTab === "industry") {
          data.sectors.sort((a: SectorData, b: SectorData) => {
            const aFlow = Math.abs(a.netInflow || 0);
            const bFlow = Math.abs(b.netInflow || 0);
            return bFlow - aFlow;
          });
        }
        setHeatMapData(data.sectors);

        // 检查是否实际有数据
        if (data.sectors.length === 0) {
          setError("没有获取到数据，请刷新重试");
        }
      } else {
        setError(data.message || "获取数据失败，请刷新重试");
      }
    } catch (error) {
      console.error("获取热力图数据失败:", error);
      setError("网络错误，请刷新重试");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatMapData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 计算热力图方块颜色
  const getColorByChange = (changePct: number) => {
    if (changePct > 0) {
      // 绿色渐变 - 更柔和的色调
      const intensity = Math.min(Math.abs(changePct) * 10, 100);
      return `rgba(52, 211, 153, ${0.3 + intensity / 200})`;
    } else {
      // 红色渐变 - 更柔和的色调
      const intensity = Math.min(Math.abs(changePct) * 10, 100);
      return `rgba(248, 113, 113, ${0.3 + intensity / 200})`;
    }
  };

  // 计算资金流颜色 (用于行业热力图)
  const getColorByNetInflow = (netInflow: number) => {
    if (netInflow > 0) {
      // 统一蓝色调 - 流入
      const intensity = Math.min(Math.abs(netInflow) / 1000000000 * 100, 100);
      return `rgba(59, 130, 246, ${0.4 + intensity / 200})`;
    } else {
      // 统一蓝色调 - 流出
      const intensity = Math.min(Math.abs(netInflow) / 1000000000 * 100, 100);
      return `rgba(147, 197, 253, ${0.4 + intensity / 200})`;
    }
  };

  // 根据值大小获取颜色
  const getColorByValue = (value: number, max: number) => {
    // 确保最大值不为0以避免除以0的错误
    const safeMax = max > 0 ? max : 1;
    const ratio = value / safeMax * 1000;

    // 移除调试日志
    console.log('safeMax', safeMax)
    console.log('ratio', ratio)

    return {
      fill: `rgba(99, 68, 68, ${0.3 + ratio * 0.4})`,  // 温和的紫色
      stroke: 'rgba(255, 255, 255, 0.3)',
      strokeWidth: 1
    };
  };

  // 将数据转换为TreeMap格式
  const treeMapData = useMemo(() => {
    if (heatMapData.length === 0 || loading) return [];

    const root: TreeMapItem = {
      name: activeTab === "industry" ? "行业资金流向" : "上证50成分股",
      value: 0,
      symbol: "",
      changePct: 0,
      children: []
    };

    // 分两种情况处理数据
    if (activeTab === "industry") {
      // 找出最大值用于计算比例
      const maxValue = Math.max(
        ...heatMapData.map(sector => Math.abs(sector.netInflow || 0))
      );

      console.log("行业最大净流入:", maxValue); // 调试日志

      // 处理行业数据
      root.children = heatMapData.map(sector => {
        const value = Math.abs(sector.netInflow || 0);
        console.log(`行业 ${sector.name} 值:`, value, "比例:", value / maxValue); // 调试日志

        return {
          name: sector.name,
          value: value > 0 ? value : 100000000, // 确保所有区块至少有最小大小
          symbol: sector.stocks[0]?.symbol || "",
          changePct: sector.changePct,
          netInflow: sector.netInflow,
          netInflowRatio: sector.netInflowRatio,
          maxValue // 正确传递最大值
        };
      });
    } else {
      // 找出最大市值用于计算比例
      let maxMarketCap = 0;
      heatMapData.forEach(sector => {
        sector.stocks.forEach(stock => {
          maxMarketCap = Math.max(maxMarketCap, stock.marketCap);
        });
      });

      console.log("最大市值:", maxMarketCap); // 调试日志

      // 处理上证50数据
      heatMapData.forEach(sector => {
        sector.stocks.forEach(stock => {
          if (!root.children) root.children = [];
          console.log(`股票 ${stock.name} 市值:`, stock.marketCap, "比例:", stock.marketCap / maxMarketCap); // 调试日志

          root.children.push({
            name: stock.name,
            value: stock.marketCap > 0 ? stock.marketCap : 1000000000,
            symbol: stock.symbol,
            changePct: stock.changePct,
            maxValue: maxMarketCap // 正确传递最大值
          });
        });
      });
    }

    return [root];
  }, [heatMapData, activeTab, loading]);

  // 自定义TreeMap内容渲染
  const renderTreeMapContent = (props: any) => {
    const { root, depth, x, y, width, height, index, name, symbol, netInflow, changePct, value, maxValue } = props;

    // 检查区块是否太小
    const isTiny = width < 70 || height < 60;
    const isSmall = width < 100 || height < 80;

    const colors = getColorByValue(value, maxValue || 1);

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: colors.fill,
            stroke: colors.stroke,
            strokeWidth: colors.strokeWidth,
            cursor: 'pointer'
          }}
          onClick={() => window.location.href = `/stocks/${symbol}`}
        />
        <text
          x={x + 5}
          y={y + 18}
          fill="#fff"
          fontSize={isTiny ? 10 : isSmall ? 12 : 14}
          fontWeight="bold"
          textAnchor="start"
        >
          {name}
        </text>
        {!isTiny && netInflow !== undefined && (
          <text
            x={x + 5}
            y={y + (isSmall ? 35 : 40)}
            fill="#fff"
            fontSize={isSmall ? 10 : 12}
            textAnchor="start"
          >
            {netInflow >= 0 ? '流入' : '流出'}: {Math.abs(netInflow / 100000000).toFixed(2)}亿
          </text>
        )}
        {!isTiny && (
          <text
            x={x + 5}
            y={y + (isSmall ? 50 : 60)}
            fill="#fff"
            fontSize={isSmall ? 10 : 12}
            textAnchor="start"
          >
            {changePct >= 0 ? '+' : ''}{changePct?.toFixed(2)}%
          </text>
        )}
      </g>
    );
  };

  // 将渲染函数转换为组件
  const TreemapContent = (props: any) => renderTreeMapContent(props);

  // 自定义工具提示
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-background border rounded-md shadow-md">
          <p className="font-bold">{data.name}</p>
          {data.symbol && <p className="text-sm opacity-80">{data.symbol}</p>}
          {data.netInflow !== undefined && (
            <p className="text-sm">
              资金{data.netInflow >= 0 ? '流入' : '流出'}: {Math.abs(data.netInflow / 100000000).toFixed(2)}亿
              {data.netInflowRatio !== undefined && ` (${(data.netInflowRatio >= 0 ? '+' : '') + data.netInflowRatio.toFixed(2)}%)`}
            </p>
          )}
          <p className="text-sm">
            涨跌幅: {data.changePct >= 0 ? '+' : ''}{data.changePct.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // 渲染热力图
  const renderHeatMap = () => {
    if (loading) {
      // 骨架屏
      return (
        <div className="grid grid-cols-3 gap-4 h-[520px]">
          {Array.from({ length: 12 }).map((_, index) => (
            <Skeleton key={index} className={`h-full w-full rounded-md ${index === 0 ? 'col-span-2 row-span-2' : ''}`} />
          ))}
        </div>
      );
    }

    if (error) {
      return renderErrorState();
    }

    if (treeMapData.length === 0 || !treeMapData[0].children || treeMapData[0].children.length === 0) {
      return (
        <div className="flex items-center justify-center h-[520px]">
          <p className="text-muted-foreground">暂无数据</p>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={520}>
        <Treemap
          data={treeMapData}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="#fff"
          content={<TreemapContent />}
          animationDuration={500}
        >
          <Tooltip content={CustomTooltip} />
        </Treemap>
      </ResponsiveContainer>
    );
  };

  // 处理错误状态
  const renderErrorState = () => {
    return (
      <div className="flex flex-col items-center justify-center h-[520px] rounded-lg border bg-card p-6 text-center">
        <p className="text-lg text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchHeatMapData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          <RefreshCcw size={16} />
          刷新数据
        </button>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>市场热力图</span>
          <button
            onClick={fetchHeatMapData}
            className="text-sm font-normal p-1 rounded bg-muted hover:bg-muted/80"
            title="刷新数据"
          >
            <RefreshCcw size={16} />
          </button>
        </CardTitle>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="industry">行业板块</TabsTrigger>
            <TabsTrigger value="sh50">上证50</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="mb-8 overflow-hidden">
          {renderHeatMap()}
        </div>
      </CardContent>
    </Card>
  );
} 