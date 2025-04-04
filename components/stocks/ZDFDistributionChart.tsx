'use client'
import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

interface ZDFDistributionData {
  date: number;
  distribution: Record<string, number>;
  formatted_distribution: Record<string, number>;
  summary: {
    up_count: number;
    down_count: number;
    flat_count: number;
    total_count: number;
  };
}

const ZDFDistributionChart: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ZDFDistributionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/py/market/zdf/distribution');
        if (!response.ok) {
          throw new Error(`请求失败: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败');
        console.error('获取涨跌分布数据出错:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderChart = () => {
    if (!data) return null;

    // 准备图表数据
    const categories: string[] = [];
    const values: number[] = [];
    
    // 按照涨跌幅排序
    const sortedKeys = Object.keys(data.formatted_distribution).sort((a, b) => {
      // 从"下跌10%~11%"提取数字部分
      const getPercent = (str: string): number => {
        if (str.includes('上涨')) return parseFloat(str.replace(/[^0-9.]/g, ''));
        if (str.includes('下跌')) return -parseFloat(str.replace(/[^0-9.]/g, ''));
        return 0; // 持平
      };
      return getPercent(a) - getPercent(b);
    });
    
    sortedKeys.forEach(key => {
      categories.push(key);
      values.push(data.formatted_distribution[key]);
    });

    const option = {
      title: {
        text: `A股涨跌分布 - ${data.date}`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: '{b}: {c}家'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          interval: 0,
          rotate: 45,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        name: '股票数量'
      },
      series: [
        {
          name: '股票数量',
          type: 'bar',
          data: values,
          itemStyle: {
            color: function(params: any) {
              const category = categories[params.dataIndex];
              if (category.includes('上涨')) return '#f56c6c';
              if (category.includes('下跌')) return '#4eb61b';
              return '#909399'; // 持平为灰色
            }
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}'
          }
        }
      ]
    };

    return <ReactECharts option={option} style={{ height: '400px' }} />;
  };

  const renderSummary = () => {
    if (!data) return null;
    
    const { up_count, down_count, flat_count, total_count } = data.summary;
    const upPercent = ((up_count / total_count) * 100).toFixed(2);
    const downPercent = ((down_count / total_count) * 100).toFixed(2);
    const flatPercent = ((flat_count / total_count) * 100).toFixed(2);
    
    return (
      <div className="grid grid-cols-3 gap-4 mb-4 bg-white p-4 rounded-lg shadow">
        <div className="text-center">
          <div className="text-sm text-gray-500">上涨家数</div>
          <div className="text-xl font-bold text-red-500">{up_count} 家</div>
          <div className="text-sm">({upPercent}%)</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">下跌家数</div>
          <div className="text-xl font-bold text-green-500">{down_count} 家</div>
          <div className="text-sm">({downPercent}%)</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">持平家数</div>
          <div className="text-xl font-bold text-gray-500">{flat_count} 家</div>
          <div className="text-sm">({flatPercent}%)</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
          <div className="mt-2">加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">加载失败: {error}</div>;
  }

  return (
    <div className="zdf-distribution-container">
      {renderSummary()}
      <hr className="my-4" />
      {renderChart()}
    </div>
  );
};

export default ZDFDistributionChart; 