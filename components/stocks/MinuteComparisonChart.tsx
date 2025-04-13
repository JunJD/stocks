'use client'

import React, { useEffect, useState, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

interface MinuteData {
  time: string; // 时间，格式为 "HH:MM"
  price: number; // 价格
  volume: number; // 成交量
  amount: number; // 成交额
  date: string; // 日期，格式为 "YYYY-MM-DD"
}

interface MinuteComparisonChartProps {
  symbol?: string; // 证券代码，默认为上证50
  displayType?: 'price' | 'amount' | 'volume'; // 展示数据类型：点位、成交额或成交量
}

export default function MinuteComparisonChart({ 
  symbol = "1.000016", 
  displayType = 'price' 
}: MinuteComparisonChartProps) {
  const [todayData, setTodayData] = useState<MinuteData[]>([]);
  const [yesterdayData, setYesterdayData] = useState<MinuteData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setLoading(true);
    setError(null);
    
    try {
      // 直接连接东方财富SSE接口
      const url = new URL(`https://${displayType==='price'? 10: 9}.push2his.eastmoney.com/api/qt/stock/trends2/sse`);
      url.searchParams.append('fields1', 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13,f17');
      url.searchParams.append('fields2', 'f51,f52,f53,f54,f55,f56,f57,f58');
      url.searchParams.append('mpi', '1000');
      url.searchParams.append('ut', 'fa5fd1943c7b386f172d6893dbfba10b');
      url.searchParams.append('secid', symbol);
      url.searchParams.append('ndays', '2');
      url.searchParams.append('iscr', '0');
      url.searchParams.append('iscca', '0');
      url.searchParams.append('wbp2u', '2165355837413214|0|1|0|web');
      url.searchParams.append('displayType', displayType);
      
      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.data && data.data.trends) {
            // 解析数据
            const parsedData = parseMinuteData(data.data);
            setTodayData(parsedData.today);
            setYesterdayData(parsedData.yesterday);
            setLoading(false);
          }
        } catch (err) {
          console.error('解析SSE数据出错:', err);
          setError('数据解析失败');
          setLoading(false);
        }
      };

      eventSource.onerror = () => {
        console.error('SSE连接错误');
        setError('数据加载失败，请稍后重试');
        setLoading(false);
        eventSource.close();
      };
    } catch (error) {
      console.error('创建SSE连接失败:', error);
      setError('连接失败，请稍后重试');
      setLoading(false);
    }

    // 组件卸载时关闭SSE连接
    return () => {
      eventSourceRef.current?.close();
    };
  }, [symbol]);

  // 解析分时数据
  const parseMinuteData = (data: any) => {
    const todayData: MinuteData[] = [];
    const yesterdayData: MinuteData[] = [];
    
    // 获取今天和昨天的日期
    const dates = data.trends.map((trend: string) => trend.split(',')[0].split(' ')[0]);
    const uniqueDatesSet = new Set(dates);
    const uniqueDates = Array.from(uniqueDatesSet).sort();
    
    if (uniqueDates.length !== 2) {
      console.warn('数据中没有两天的数据');
      return { today: [], yesterday: [] };
    }
    
    const todayDate = uniqueDates[1];
    const yesterdayDate = uniqueDates[0];
    
    // 处理原始数据
    data.trends.forEach((trend: string) => {
      const parts = trend.split(',');
      const dateTimeParts = parts[0].split(' ');
      const date = dateTimeParts[0];
      const time = dateTimeParts[1];
      const price = parseFloat(parts[2]); // 当前价格
      const volume = parseInt(parts[5]); // 成交量
      const amount = parseFloat(parts[6]); // 成交额
      
      const minuteData: MinuteData = {
        time,
        price,
        volume,
        amount,
        date
      };
      
      if (date === todayDate) {
        todayData.push(minuteData);
      } else if (date === yesterdayDate) {
        yesterdayData.push(minuteData);
      }
    });
    
    return { today: todayData, yesterday: yesterdayData };
  };

  // 准备图表选项
  const getOption = () => {
    // 准备X轴时间数据（以今天的时间为准）
    const times = todayData.map(item => item.time);
    
    // 准备Y轴数据
    const todayValues = todayData.map(item => {
      if (displayType === 'amount') return item.amount;
      if (displayType === 'volume') return item.volume;
      return item.price; // 默认展示点位
    });
    const yesterdayValues = [];
    
    // 将昨日数据匹配到今天的时间点上
    for (const time of times) {
      const yesterdayItem = yesterdayData.find(item => item.time === time);
      if (displayType === 'amount') {
        yesterdayValues.push(yesterdayItem ? yesterdayItem.amount : null);
      } else if (displayType === 'volume') {
        yesterdayValues.push(yesterdayItem ? yesterdayItem.volume : null);
      } else {
        yesterdayValues.push(yesterdayItem ? yesterdayItem.price : null);
      }
    }
    
    // 获取标题中显示的日期
    const todayDate = todayData.length > 0 ? todayData[0].date : '';
    const yesterdayDate = yesterdayData.length > 0 ? yesterdayData[0].date : '';
    
    // 获取Y轴标题
    let yAxisTitle = '点位';
    if (displayType === 'amount') {
      yAxisTitle = '成交额';
    } else if (displayType === 'volume') {
      yAxisTitle = '成交量';
    }
    
    return {
      title: {
        text: `${todayDate} vs ${yesterdayDate} 指数${yAxisTitle}对比`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function(params: any) {
          const time = params[0].name;
          let html = `<div>${time}</div>`;
          
          params.forEach((param: any) => {
            if (param.seriesName === '今日') {
              html += `<div>
                <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>
                今日${yAxisTitle}: ${param.value || '-'}
              </div>`;
            } else if (param.seriesName === '昨日') {
              html += `<div>
                <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color};"></span>
                昨日${yAxisTitle}: ${param.value || '-'}
              </div>`;
            }
          });
          
          return html;
        }
      },
      legend: {
        data: ['今日', '昨日'],
        top: 30
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: times,
        axisLabel: {
          formatter: function(value: string) {
            // 每5个点显示一次时间
            const minute = parseInt(value.split(':')[1]);
            if (minute % 5 === 0) {
              return value;
            }
            return '';
          }
        }
      },
      yAxis: {
        type: 'value',
        scale: true,
        name: yAxisTitle,
        splitLine: {
          lineStyle: {
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: '今日',
          type: 'line',
          data: todayValues,
          symbol: 'none',
          sampling: 'average',
          itemStyle: {
            color: '#ff4500'
          },
          lineStyle: {
            width: 2
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0,
                color: 'rgba(255,69,0,0.2)'
              }, {
                offset: 1,
                color: 'rgba(255,69,0,0)'
              }]
            }
          },
          emphasis: {
            focus: 'series'
          }
        },
        {
          name: '昨日',
          type: 'line',
          data: yesterdayValues,
          symbol: 'none',
          sampling: 'average',
          itemStyle: {
            color: '#3c9'
          },
          lineStyle: {
            width: 2
          },
          emphasis: {
            focus: 'series'
          }
        }
      ]
    };
  };

  if (loading) {
    return <div className="h-[350px] flex items-center justify-center">加载中...</div>;
  }

  if (error) {
    return <div className="h-[350px] flex items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="relative">
      <ReactECharts 
        option={getOption()} 
        style={{ height: '350px' }} 
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
} 