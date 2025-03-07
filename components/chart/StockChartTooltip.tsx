'use client'

import React, { useState, useEffect } from 'react';
import { preloadStockChart } from '@/store/stockStore';
import { ParentSize } from '@visx/responsive';
import { scaleLinear, scalePoint } from '@visx/scale';
import { max, min } from '@visx/vendor/d3-array';
import { AreaClosed, LinePath } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';

interface StockChartTooltipProps {
  symbol: string;
  isVisible: boolean;
}

// 定义图表数据点类型
interface ChartPoint {
  date: string;
  close: number;
}

// 简化版折线图组件
export default function StockChartTooltip({ symbol, isVisible }: StockChartTooltipProps) {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 当symbol变化或组件变为可见时加载数据
  useEffect(() => {
    if (isVisible && symbol) {
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
  }, [symbol, isVisible]);

  if (!isVisible) return null;
  
  if (loading) {
    return (
      <div className="fixed z-50 w-64 bg-background/80 backdrop-blur-md border border-border rounded-md shadow-lg p-4">
        <p className="text-sm text-center">加载图表中...</p>
      </div>
    );
  }

  if (error || !chartData || !chartData.quotes || chartData.quotes.length === 0) {
    return (
      <div className="fixed z-50 w-64 bg-background/80 backdrop-blur-md border border-border rounded-md shadow-lg p-4">
        <p className="text-sm text-center">{error || '暂无图表数据'}</p>
      </div>
    );
  }

  const toDate = (d: ChartPoint | number): number => {
    if (typeof d === 'number') return d;
    return +new Date(d?.date);
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

  // 确定颜色
  const color = changePercent > 0 ? 'rgb(22, 163, 74)' : changePercent < 0 ? 'rgb(220, 38, 38)' : 'rgb(100, 116, 139)';

  return (
    <div className="fixed z-50 w-64 bg-background/80 backdrop-blur-md border border-border rounded-md shadow-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">{symbol}</h3>
        <p className={`text-xs ${changePercent > 0 ? 'text-green-600' : changePercent < 0 ? 'text-red-600' : 'text-slate-500'}`}>
          {price.toFixed(2)} ({changePercent.toFixed(2)}%)
        </p>
      </div>
      <div className="h-32">
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
                <g transform={`translate(${margin.left},${margin.top})`}>
                  {/* 绘制面积图 */}
                  <AreaClosed<ChartPoint>
                    data={chartQuotes}
                    x={(d: ChartPoint) => xScale(toDate(d)) || 0}
                    y={(d: ChartPoint) => yScale(d.close) || 0}
                    yScale={yScale}
                    curve={curveMonotoneX}
                    fill={`${color}20`}
                  />
                  
                  {/* 绘制线条 */}
                  <LinePath<ChartPoint>
                    data={chartQuotes}
                    x={(d: ChartPoint) => xScale(toDate(d)) || 0}
                    y={(d: ChartPoint) => yScale(d.close) || 0}
                    stroke={color}
                    strokeWidth={1.5}
                    curve={curveMonotoneX}
                  />
                </g>
              </svg>
            );
          }}
        </ParentSize>
      </div>
    </div>
  );
} 