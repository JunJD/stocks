'use client'

import React, { useState, useRef, useEffect } from 'react';
import { useFloating, autoUpdate, offset, arrow, shift, flip, useHover, useDismiss, useRole, useInteractions, FloatingArrow } from '@floating-ui/react';
import { preloadStockChart } from '@/store/stockStore';
import { ParentSize } from '@visx/responsive';
import { scaleLinear, scalePoint } from '@visx/scale';
import { max, min } from '@visx/vendor/d3-array';
import { AreaClosed, LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';

interface ChartPoint {
  date: string;
  close: number;
}

interface StockHoverCardProps {
  symbol: string;
  children: React.ReactNode;
}

export default function StockHoverCard({ symbol, children }: StockHoverCardProps) {
  const [open, setOpen] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const arrowRef = useRef(null);
  
  // 设置 Floating UI
  const {refs, floatingStyles, context} = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'right-start',
    middleware: [
      offset(10),
      shift({padding: 5}),
      flip(),
      arrow({element: arrowRef})
    ],
    whileElementsMounted: autoUpdate
  });
  
  const hover = useHover(context, {
    delay: {
      open: 200, // 悬停200ms后显示
      close: 100 // 离开100ms后关闭
    }
  });
  const dismiss = useDismiss(context);
  const role = useRole(context);
  
  const {getReferenceProps, getFloatingProps} = useInteractions([
    hover,
    dismiss,
    role
  ]);
  
  // 加载图表数据
  useEffect(() => {
    if (open && symbol) {
      setLoading(true);
      setError(null);
      
      preloadStockChart(symbol)
        .then(data => {
          setChartData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(`加载${symbol}图表数据失败:`, err);
          setError('加载图表失败');
          setLoading(false);
        });
    }
  }, [symbol, open]);
  
  // 渲染图表内容
  const renderChartContent = () => {
    if (loading) {
      return <p className="text-sm text-center py-4">加载图表中...</p>;
    }
    
    if (error || !chartData || !chartData.quotes || chartData.quotes.length === 0) {
      return <p className="text-sm text-center py-4">{error || '暂无图表数据'}</p>;
    }
    
    const toDate = (d: ChartPoint | number): number => {
      if (typeof d === 'number') return d;
      return +new Date(d.date);
    };
    
    const chartQuotes: ChartPoint[] = chartData.quotes.map((quote: any) => ({
      date: quote.date,
      close: Number(quote.close),
    }));
    
    // 提取最新价格和变化百分比
    const latestQuote = chartQuotes[chartQuotes.length - 1];
    const firstQuote = chartQuotes[0];
    const price = latestQuote.close;
    const changePercent = ((latestQuote.close - firstQuote.close) / firstQuote.close) * 100;
    
    // 确定颜色 - 使用更鲜明的颜色
    const color = changePercent > 0 
      ? 'rgb(34, 197, 94)' // 更亮的绿色
      : changePercent < 0 
        ? 'rgb(239, 68, 68)' // 更亮的红色
        : 'rgb(148, 163, 184)'; // 更亮的灰色
    
    return (
      <>
        <div className="flex justify-between items-center mb-2 px-3 pt-3">
          <h3 className="text-sm font-medium">{symbol}</h3>
          <p className={`text-xs ${changePercent > 0 ? 'text-green-500' : changePercent < 0 ? 'text-red-500' : 'text-slate-500'}`}>
            {price.toFixed(2)} ({changePercent.toFixed(2)}%)
          </p>
        </div>
        <div className="h-32 w-64">
          <ParentSize>
            {({ width, height }: { width: number; height: number }) => {
              // 设置图表边距
              const margin = { top: 5, right: 5, bottom: 5, left: 5 };
              const innerWidth = width - margin.left - margin.right;
              const innerHeight = height - margin.top - margin.bottom;
              
              // 创建比例尺
              const xScale = scalePoint<number>()
                .domain(chartQuotes.map((d: ChartPoint) => toDate(d)))
                .range([0, innerWidth]);
              
              const yScale = scaleLinear<number>()
                .domain([
                  (min(chartQuotes, (d: ChartPoint) => d.close) || 0) * 0.999, 
                  (max(chartQuotes, (d: ChartPoint) => d.close) || 100) * 1.001
                ])
                .range([innerHeight, 0]);
              
              return (
                <svg width={width} height={height}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                    </linearGradient>
                  </defs>
                  
                  {/* 添加白色背景 */}
                  <rect width={width} height={height} fill="white" />
                  
                  <g transform={`translate(${margin.left},${margin.top})`}>
                    {/* 绘制面积图 */}
                    <AreaClosed<ChartPoint>
                      data={chartQuotes}
                      x={(d: ChartPoint) => xScale(toDate(d)) || 0}
                      y={(d: ChartPoint) => yScale(d.close) || 0}
                      yScale={yScale}
                      curve={curveMonotoneX}
                      fill="url(#areaGradient)" // 使用渐变填充
                    />
                    
                    {/* 绘制线条 */}
                    <LinePath<ChartPoint>
                      data={chartQuotes}
                      x={(d: ChartPoint) => xScale(toDate(d)) || 0}
                      y={(d: ChartPoint) => yScale(d.close) || 0}
                      stroke={color}
                      strokeWidth={2} // 增加线宽让线条更明显
                      curve={curveMonotoneX}
                    />
                  </g>
                </svg>
              );
            }}
          </ParentSize>
        </div>
      </>
    );
  };
  
  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </div>
      
      {open && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          className="z-50 bg-background/95 backdrop-blur-md border border-border rounded-md shadow-lg p-1"
          {...getFloatingProps()}
        >
          <FloatingArrow 
            ref={arrowRef} 
            context={context} 
            fill="white" 
            stroke="#e2e8f0" 
            strokeWidth={1} 
          />
          {renderChartContent()}
        </div>
      )}
    </>
  );
} 