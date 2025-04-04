"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { Responsive as ResponsiveGridLayout } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"

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
}

interface HeatMapProps {
  industryFilter?: string;
}

export function HeatMap({ industryFilter }: HeatMapProps) {
  const [heatMapData, setHeatMapData] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [windowWidth, setWindowWidth] = useState(1200);

  // 监听窗口大小变化
  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth);
    }
    
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

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

  // 获取股票数据，已划分为不同的块区域
  const getStockBlocks = (): { layout: any[], blocks: any[] } => {
    if (heatMapData.length === 0) {
      return { layout: [], blocks: [] };
    }

    const allStocks = heatMapData.flatMap(sector => 
      sector.stocks.map(stock => ({
        ...stock,
        sectorName: sector.name
      }))
    );

    // 根据市值对股票进行排序，让大市值股票获得更大的区块
    const sortedStocks = [...allStocks].sort((a, b) => b.marketCap - a.marketCap);
    
    // 为布局创建不同大小的块
    const layout = [];
    const blocks = [];
    
    // 如果有数据，第一个是主要指数（大区块）
    if (sortedStocks.length > 0) {
      const mainStock = sortedStocks[0];
      
      // 主要指数的布局和区块内容
      layout.push({ i: 'main', x: 0, y: 0, w: 6, h: 12, static: true });
      blocks.push(renderStockBlock('main', mainStock, true));
      
      // 右侧第一行 - 3个小区块
      const row1Stocks = sortedStocks.slice(1, 4);
      row1Stocks.forEach((stock, index) => {
        const id = `b${index + 1}`;
        layout.push({ i: id, x: 6 + index*2, y: 0, w: 2, h: 4, static: true });
        blocks.push(renderStockBlock(id, stock));
      });
      
      // 右侧第二行 - 1个中区块和1个小区块
      if (sortedStocks.length > 4) {
        // 中区块
        layout.push({ i: 'c1', x: 6, y: 4, w: 4, h: 4, static: true });
        blocks.push(renderStockBlock('c1', sortedStocks[4], false, true));
        
        // 小区块
        if (sortedStocks.length > 5) {
          layout.push({ i: 'c2', x: 10, y: 4, w: 2, h: 4, static: true });
          blocks.push(renderStockBlock('c2', sortedStocks[5]));
        }
      }
      
      // 右侧第三行 - 3个小区块
      const row3Stocks = sortedStocks.slice(6, 9);
      row3Stocks.forEach((stock, index) => {
        const id = `d${index + 1}`;
        layout.push({ i: id, x: 6 + index*2, y: 8, w: 2, h: 4, static: true });
        blocks.push(renderStockBlock(id, stock));
      });
    }
    
    return { layout, blocks };
  };

  // 渲染单个股票区块 
  const renderStockBlock = (id: string, stock: HeatMapStock, isMain = false, isMedium = false) => {
    if (!stock) {
      return <div key={id} className="flex items-center justify-center rounded-lg border bg-card">
        <p className="text-muted-foreground">暂无数据</p>
      </div>;
    }
    
    return (
      <div 
        key={id} 
        className="overflow-hidden rounded-lg border transition-transform hover:scale-[1.02] cursor-pointer"
        style={{ 
          backgroundColor: getColorByChange(stock.changePct),
          height: '100%'
        }}
        onClick={() => window.location.href = `/stocks/${stock.symbol}`}
      >
        <div className={`flex flex-col ${isMain ? 'p-6' : isMedium ? 'p-4' : 'p-2'} h-full`}>
          <div>
            <h3 className={`${isMain ? 'text-2xl' : isMedium ? 'text-lg' : 'text-sm'} font-bold truncate`}>
              {stock.name}
            </h3>
            <p className={`${isMain ? 'text-lg' : 'text-xs'} opacity-90 truncate`}>
              {stock.symbol}
            </p>
            {stock.sectorName && !isMain && (
              <p className="text-xs opacity-75 truncate">{stock.sectorName}</p>
            )}
          </div>
          
          <div className="mt-auto">
            {isMain && (
              <p className="text-3xl font-bold mb-1">{stock.price.toFixed(2)}</p>
            )}
            <div className={`flex ${isMain ? 'flex-row gap-2' : 'flex-col'}`}>
              {isMain && (
                <span className={`${isMain ? 'text-xl' : 'text-sm'} font-semibold ${stock.changePct >= 0 ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                  {stock.changePct >= 0 ? '+' : ''}{stock.change.toFixed(2)}
                </span>
              )}
              <span className={`${isMain ? 'text-xl' : 'text-sm'} font-semibold ${stock.changePct >= 0 ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                {isMain && '('}{stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%{isMain && ')'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 处理加载中状态的布局
  const renderLoadingLayout = () => {
    const layout = [
      { i: 'main', x: 0, y: 0, w: 6, h: 12, static: true },
      { i: 'b1', x: 6, y: 0, w: 2, h: 4, static: true },
      { i: 'b2', x: 8, y: 0, w: 2, h: 4, static: true },
      { i: 'b3', x: 10, y: 0, w: 2, h: 4, static: true },
      { i: 'c1', x: 6, y: 4, w: 4, h: 4, static: true },
      { i: 'c2', x: 10, y: 4, w: 2, h: 4, static: true },
      { i: 'd1', x: 6, y: 8, w: 2, h: 4, static: true },
      { i: 'd2', x: 8, y: 8, w: 2, h: 4, static: true },
      { i: 'd3', x: 10, y: 8, w: 2, h: 4, static: true }
    ];

    const blocks = layout.map(item => (
      <div key={item.i} className="rounded-lg">
        <Skeleton className="h-full w-full rounded-md" />
      </div>
    ));

    return { layout, blocks };
  };

  // 获取当前的布局和区块
  const { layout, blocks } = loading ? renderLoadingLayout() : getStockBlocks();

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
        <div className="mb-8 overflow-hidden">
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 12, sm: 12, xs: 4, xxs: 2 }}
            rowHeight={30}
            width={windowWidth > 1200 ? 1200 : windowWidth - 40}
            margin={[10, 10]}
            isDraggable={false}
            isResizable={false}
            containerPadding={[0, 0]}
          >
            {blocks}
          </ResponsiveGridLayout>
        </div>
      </CardContent>
    </Card>
  );
} 