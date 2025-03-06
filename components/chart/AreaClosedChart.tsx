// @ts-nocheck
"use client"
import { memo, useCallback, useMemo, useReducer } from "react"
import { scalePoint } from "d3-scale"
import { bisectRight } from "d3-array"

import { localPoint } from "@visx/event"
import { LinearGradient } from "@visx/gradient"
import { AreaClosed, LinePath } from "@visx/shape"
import { scaleLinear } from "@visx/scale"
import { ParentSize } from "@visx/responsive"
import { Button } from "../ui/button"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AxisBottom, AxisLeft } from "@visx/axis"
import { GridRows, GridColumns } from "@visx/grid"

// UTILS
const toDate = (d: any) => +new Date(d?.date || d)

// 使用人民币格式化
const formatCurrency = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
}).format

const MemoAreaClosed = memo(AreaClosed)
const MemoLinePath = memo(LinePath)

function reducer(state: any, action: any) {
  const initialState = {
    close: state.close,
    date: state.date,
    translate: "0%",
    hovered: false,
  }

  switch (action.type) {
    case "UPDATE": {
      return {
        close: action.close,
        date: action.date,
        x: action.x,
        y: action.y,
        translate: `-${(1 - action.x / action.width) * 100}%`,
        hovered: true,
      }
    }
    case "CLEAR": {
      return {
        ...initialState,
        x: undefined,
        y: undefined,
      }
    }
    default:
      return state
  }
}

interface InteractionsProps {
  width: number
  height: number
  xScale: any
  data: any[]
  dispatch: any
}

function Interactions({
  width,
  height,
  xScale,
  data,
  dispatch,
}: InteractionsProps) {
  const handleMove = useCallback(
    (event: React.PointerEvent<SVGRectElement>) => {
      const point = localPoint(event)
      if (!point) return

      const pointer = {
        x: Math.max(0, Math.min(width, Math.floor(point.x))),
        y: Math.max(0, Math.min(height, Math.floor(point.y))),
      }

      const x0 = pointer.x
      const dates = data.map((d: any) => xScale(toDate(d)))
      const index = bisectRight(dates, x0)

      const d0 = data[index - 1]
      const d1 = data[index]

      let d = d0
      if (d1 && toDate(d1)) {
        const diff0 = x0.valueOf() - toDate(d0).valueOf()
        const diff1 = toDate(d1).valueOf() - x0.valueOf()
        d = diff0 > diff1 ? d1 : d0
      }
      dispatch({ type: "UPDATE", ...d, ...pointer, width })
    },
    [xScale, data, dispatch, width]
  )

  const handleLeave = useCallback(() => dispatch({ type: "CLEAR" }), [dispatch])

  return (
    <rect
      width={width}
      height={height}
      rx={12}
      ry={12}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      fill={"transparent"}
    />
  )
}

interface AreaProps {
  mask: string
  id: string
  data: any[]
  x: any
  y: any
  yScale: any
  color: string
}

function Area({ mask, id, data, x, y, yScale, color }: AreaProps) {
  return (
    <g strokeLinecap="round" className="stroke-1">
      <LinearGradient
        id={id}
        from={color}
        fromOpacity={0.6}
        to={color}
        toOpacity={0}
      />
      <MemoAreaClosed
        data={data}
        x={x}
        y={y}
        yScale={yScale}
        stroke="transparent"
        fill={`url(#${id})`}
        mask={mask}
      />
      <MemoLinePath data={data} x={x} y={y} stroke={color} mask={mask} />
    </g>
  )
}

function GraphSlider({ data, width, height, top, state, dispatch }: any) {
  // 添加一些边距，以确保轴标签有足够的空间
  const margin = { top: 20, right: 40, bottom: 40, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(
    () => scalePoint().domain(data.map(toDate)).range([0, innerWidth]),
    [innerWidth, data]
  )

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [innerHeight, 0],
        domain: [
          Math.min(...data.map((d: any) => d.close)) * 0.999, // 稍微扩展y轴范围，避免数据点贴边
          Math.max(...data.map((d: any) => d.close)) * 1.001,
        ],
        nice: true, // 使刻度更美观
      }),
    [innerHeight, data]
  )

  const x = useCallback((d: any) => xScale(toDate(d)), [xScale])
  const y = useCallback((d: any) => yScale(d.close), [yScale])

  const pixelTranslate = (parseFloat(state.translate) / 100) * innerWidth
  const style = {
    transform: `translateX(${pixelTranslate}px)`,
  }

  const isIncreasing = data[data.length - 1].close > data[0].close

  // 获取最小和最大时间，用于格式化x轴
  const minDate = new Date(data[0].date)
  const maxDate = new Date(data[data.length - 1].date)
  
  // 根据数据范围选择合适的时间格式
  const formatTime = (date: Date) => {
    const diffDays = Math.floor((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays <= 1) {
      return date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0')
    } else if (diffDays <= 30) {
      return (date.getMonth() + 1) + '/' + date.getDate()
    } else {
      return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear().toString().substr(2, 2)
    }
  }

  // 获取x轴显示的刻度数量
  const getTickCount = () => {
    if (width < 400) return 5
    if (width < 800) return 8
    return 10
  }
  
  // 获取y轴显示的刻度数量
  const getYTickCount = () => {
    if (height < 200) return 3
    if (height < 400) return 5
    return 7
  }

  // 获取最新的数据点来显示标记
  const latestDataPoint = data[data.length - 1];
  const latestDate = new Date(latestDataPoint.date);
  
  // 格式化最新日期和时间
  const formattedLatestDate = `${latestDate.getFullYear()}年${latestDate.getMonth() + 1}月${latestDate.getDate()}日 ${latestDate.getHours()}:${String(latestDate.getMinutes()).padStart(2, '0')}`;

  return (
    <svg height={height} width="100%" viewBox={`0 0 ${width} ${height}`}>
      <g transform={`translate(${margin.left}, ${margin.top})`}>
        {/* 添加网格线 */}
        <GridRows
          scale={yScale}
          width={innerWidth}
          height={innerHeight}
          numTicks={getYTickCount()}
          stroke="#e0e0e0"
          strokeOpacity={0.3}
          strokeDasharray="3,3"
        />
        <GridColumns
          scale={xScale}
          width={innerWidth}
          height={innerHeight}
          numTicks={getTickCount()}
          stroke="#e0e0e0"
          strokeOpacity={0.3}
          strokeDasharray="3,3"
        />

        <mask id="mask" className="w-full">
          <rect x={0} y={0} width={innerWidth} height="100%" fill="#000" />
          <rect
            id="boundary"
            x={0}
            y={0}
            width={innerWidth}
            height="100%"
            fill="#fff"
            style={style}
          />
        </mask>
        
        <Area
          id="background"
          data={data}
          x={x}
          y={y}
          top={top}
          yScale={yScale}
          color={state.hovered ? "dodgerblue" : isIncreasing ? "green" : "red"}
        />
        <Area
          id="top"
          data={data}
          x={x}
          y={y}
          yScale={yScale}
          top={top}
          color={state.hovered ? "dodgerblue" : isIncreasing ? "green" : "red"}
          mask="url(#mask)"
        />
        
        {/* 添加最新价格标记点 */}
        <g className="latest-point">
          <line 
            x1={0} 
            x2={innerWidth} 
            y1={yScale(latestDataPoint.close)} 
            y2={yScale(latestDataPoint.close)} 
            stroke="#3B82F6" 
            strokeWidth={1} 
            strokeDasharray="3,3"
          />
          <circle
            cx={x(latestDataPoint)}
            cy={yScale(latestDataPoint.close)}
            r={6}
            fill="#3B82F6"
            stroke="#FFF"
            strokeWidth={2}
          />
          <text
            x={innerWidth - 10}
            y={yScale(latestDataPoint.close) - 10}
            textAnchor="end"
            className="text-xs font-medium fill-blue-500"
          >
            {formatCurrency(latestDataPoint.close)}
          </text>
          <text
            x={innerWidth - 10}
            y={20}
            textAnchor="end"
            className="text-xs font-medium fill-gray-500"
          >
            {formattedLatestDate}
          </text>
          
          {/* 添加垂直参考线 */}
          <line 
            x1={x(latestDataPoint)} 
            x2={x(latestDataPoint)} 
            y1={0} 
            y2={innerHeight} 
            stroke="#3B82F6" 
            strokeWidth={1} 
            strokeDasharray="3,3"
          />
        </g>

        {state.x && (
          <g className="marker">
            <line
              x1={state.x}
              x2={state.x}
              y1={0}
              y2={innerHeight}
              stroke={
                state.hovered ? "dodgerblue" : isIncreasing ? "green" : "red"
              }
              strokeWidth={2}
            />
            <circle
              cx={state.x}
              cy={yScale(state.close)}
              r={8}
              fill={state.hovered ? "dodgerblue" : isIncreasing ? "green" : "red"}
              stroke="#FFF"
              strokeWidth={3}
            />
            <text
              textAnchor={state.x + 8 > innerWidth / 2 ? "end" : "start"}
              x={state.x + 8 > innerWidth / 2 ? state.x - 8 : state.x + 6}
              y={0}
              dy={"0.75em"}
              fill={state.hovered ? "dodgerblue" : isIncreasing ? "green" : "red"}
              className="text-base font-medium"
            >
              {formatCurrency(state.close)}
            </text>
          </g>
        )}
        
        {/* 添加X轴 */}
        <AxisBottom
          top={innerHeight}
          scale={xScale}
          numTicks={getTickCount()}
          tickFormat={(value) => {
            const date = new Date(value)
            return formatTime(date)
          }}
          stroke="#888"
          tickStroke="#888"
          label="日期"
          labelClassName="text-xs fill-gray-500 font-medium"
          labelOffset={15}
          hideAxisLine={false}
          hideTicks={false}
          tickLength={4}
          tickLabelProps={() => ({
            fill: '#666',
            fontSize: 10,
            textAnchor: 'middle',
            dy: '0.33em'
          })}
        />
        
        {/* 添加Y轴 */}
        <AxisLeft
          scale={yScale}
          numTicks={getYTickCount()}
          tickFormat={(value) => value.toFixed(2)}
          stroke="#888"
          tickStroke="#888"
          label="价格"
          labelClassName="text-xs fill-gray-500 font-medium"
          labelOffset={25}
          hideAxisLine={false}
          hideTicks={false}
          tickLength={4}
          tickLabelProps={() => ({
            fill: '#666',
            fontSize: 10,
            textAnchor: 'end',
            dx: '-0.25em',
            dy: '0.25em'
          })}
        />
        
        <Interactions
          width={innerWidth}
          height={innerHeight}
          data={data}
          xScale={xScale}
          dispatch={dispatch}
        />
      </g>
    </svg>
  )
}

export default function AreaClosedChart({ chartQuotes }: { chartQuotes: any[] }) {
  const last = chartQuotes[chartQuotes.length - 1]

  const initialState = {
    close: last.close,
    date: last.date,
    translate: "0%",
    hovered: false,
  }

  const [state, dispatch] = useReducer(reducer, initialState)

  // TIME
  const myDate = new Date(state.date)
  const formattedDate = myDate.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  const formattedTime = myDate
    .toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(":", ".")

  return (
    <div className="w-full min-w-fit">
      <div
        suppressHydrationWarning
        className={
          state.hovered
            ? "flex items-center justify-center font-medium"
            : "invisible"
        }
      >
        {formattedDate}{" "}
        {formattedTime}
      </div>
      <div className="h-80">
        {chartQuotes.length > 0 ? (
          <ParentSize>
            {({ width, height }) => (
              <GraphSlider
                data={chartQuotes}
                width={width}
                height={height}
                top={0}
                state={state}
                dispatch={dispatch}
              />
            )}
          </ParentSize>
        ) : (
          <div className="flex h-80 w-full items-center justify-center">
            <p>No data available</p>
          </div>
        )}
      </div>
    </div>
  )
}
