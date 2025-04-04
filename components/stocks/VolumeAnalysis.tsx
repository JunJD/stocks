'use client'
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { StockData } from '@/store/stockStore';

// 定义数据接口
interface StockQuoteData {
  date: string;
  volume: number;
  close: number;
}

interface VolumeAnalysisProps {
  data: Array<{
    date: string;
    volume: number;
    close: number;
  }>;
}

export default function VolumeAnalysis({ data }: VolumeAnalysisProps) {
  // 准备图表数据
  const dates = data.map(item => item.date?.split('T')[0]);
  const volumes = data.map(item => Math.floor(item.volume / 10000)); // 转换为万手
  const closePrices = data.map(item => item.close);
  
  // 计算5日和10日移动平均线
  const ma5 = calculateMA(5, closePrices);
  const ma10 = calculateMA(10, closePrices);
  
  const option = {
    title: {
      text: '成交额分析',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['成交量', '指数', '5日均线', '10日均线'],
      top: '30px'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: dates
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '成交量(万手)',
        min: 0,
        axisLabel: {
          formatter: '{value} 万'
        }
      },
      {
        type: 'value',
        name: '指数点位',
        min: Math.min(...closePrices) * 0.95,
        position: 'right'
      }
    ],
    series: [
      {
        name: '成交量',
        type: 'bar',
        data: volumes,
        yAxisIndex: 0,
        itemStyle: {
          color: function(params: { dataIndex: number }) {
            const index = params.dataIndex;
            return index > 0 && closePrices[index] >= closePrices[index-1] ? '#f56c6c' : '#4eb61b';
          }
        }
      },
      {
        name: '指数',
        type: 'line',
        data: closePrices,
        yAxisIndex: 1,
        symbol: 'none',
        lineStyle: {
          width: 2
        }
      },
      {
        name: '5日均线',
        type: 'line',
        data: ma5,
        yAxisIndex: 1,
        symbol: 'none',
        lineStyle: {
          width: 1
        }
      },
      {
        name: '10日均线',
        type: 'line',
        data: ma10,
        yAxisIndex: 1,
        symbol: 'none',
        lineStyle: {
          width: 1
        }
      }
    ]
  };
  
  return <ReactECharts option={option} style={{ height: '350px' }} />;
}

// 计算移动平均线
function calculateMA(dayCount: number, data: number[]): (string | number)[] {
  const result: (string | number)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < dayCount - 1) {
      result.push('-');
      continue;
    }
    let sum = 0;
    for (let j = 0; j < dayCount; j++) {
      sum += data[i - j];
    }
    result.push((sum / dayCount).toFixed(2));
  }
  return result;
}