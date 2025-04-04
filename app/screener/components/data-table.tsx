"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useCallback, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import StockHoverCard from "@/components/chart/StockHoverCard"
import useStockStore from "@/store/stockStore"
import { Star } from "lucide-react"
import { useFavorites } from "@/components/providers/favorites-provider"

// 定义筛选器选项
const screenerOptions = [
  { id: "all_stocks", label: "全部股票" },
  { id: "most_actives", label: "成交活跃" },
  { id: "day_gainers", label: "日涨幅榜" },
  { id: "day_losers", label: "日跌幅榜" },
  { id: "small_cap_gainers", label: "小盘涨幅榜" },
  { id: "growth_technology_stocks", label: "科技成长股" },
];

interface DataTableProps {
  columns: any[]
  data: any[]
}

export function ScreenerTable({
  columns,
  data,
}: DataTableProps) {
  const { favorites, removeFromFavorites, addToFavorites } = useFavorites()
  const [searchText, setSearchText] = useState("")
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)
  
  // 初始化列可见性状态
  useEffect(() => {
    const initialVisibility: Record<string, boolean> = {};
    columns.forEach(col => {
      initialVisibility[col.accessorKey] = true;
    });
    setVisibleColumns(initialVisibility);
  }, [columns]);

  const isFavorite = useCallback((symbol: string) => {
    return favorites.some(favorite => favorite.symbol === symbol)
  }, [favorites])

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // 筛选数据
  const filteredData = data.filter(item => {
    if (!searchText) return true;
    const lowerCaseSearch = searchText.toLowerCase();
    return (
      (item.symbol && item.symbol.toLowerCase().includes(lowerCaseSearch)) ||
      (item.shortName && item.shortName.toLowerCase().includes(lowerCaseSearch))
    );
  });

  // 分页
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const getScreenerParam = useCallback(() => {
    return searchParams.get("screener") || "most_actives";
  }, [searchParams]);

  const getCurrentScreenerLabel = useCallback(() => {
    const currentValue = getScreenerParam();
    return screenerOptions.find(option => option.id === currentValue)?.label || "成交活跃";
  }, [getScreenerParam]);

  const handleSelect = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams)
      const SelectedValue = value.replace(/\s/g, "_").toLowerCase()

      if (SelectedValue) {
        params.set("screener", SelectedValue)
      } else {
        params.delete("screener")
      }
      replace(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, replace]
  )

  // 处理自选股添加/移除
  const handleToggleFavorite = (stock: any) => {
    if (isFavorite(stock.symbol)) {
      removeFromFavorites(stock.symbol);
    } else {
      addToFavorites({
        symbol: stock.symbol,
        shortName: stock.shortName
      });
    }
  };

  // 切换列可见性
  const toggleColumnVisibility = (column: string, isVisible: boolean) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: isVisible
    }));
  };

  // 获取可见列
  const getVisibleColumns = () => {
    return columns.filter(col => visibleColumns[col.accessorKey]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="搜索股票代码或公司名称..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-8 w-[150px] lg:w-[250px]">
                筛选器: {getCurrentScreenerLabel()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {screenerOptions.map((option) => (
                <DropdownMenuItem key={option.id} onSelect={() => handleSelect(option.id)}>
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto h-8">
              显示列
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {columns
              .filter(column => column.accessorKey !== "symbol" || !column.enableHiding)
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.accessorKey}
                  className="capitalize"
                  checked={visibleColumns[column.accessorKey]}
                  onCheckedChange={(value) => toggleColumnVisibility(column.accessorKey, !!value)}
                >
                  {typeof column.meta === 'string' ? column.meta : column.accessorKey}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                {/* 自选列 */}
                <TableHead className="w-10">
                  <div className="text-center">自选</div>
                </TableHead>
                
                {/* 动态列 */}
                {getVisibleColumns().map((column, index) => (
                  <TableHead key={index}>
                    {typeof column.header === 'function' 
                      ? column.header() 
                      : column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {/* 自选星标列 */}
                    <TableCell className="w-10">
                      <div className="text-center">
                        <button 
                          onClick={() => handleToggleFavorite(row)}
                          className="focus:outline-none"
                        >
                          <Star 
                            className={isFavorite(row.symbol) 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-muted-foreground"}
                            size={16} 
                          />
                        </button>
                      </div>
                    </TableCell>
                    
                    {/* 数据列 */}
                    {getVisibleColumns().map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        {column.accessorKey === 'symbol' ? (
                          <StockHoverCard symbol={row.symbol}>
                            {column.cell 
                              ? column.cell({ row }) 
                              : row[column.accessorKey]}
                          </StockHoverCard>
                        ) : (
                          column.cell 
                            ? column.cell({ row }) 
                            : row[column.accessorKey]
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={getVisibleColumns().length + 1} // +1 for the favorite column
                    className="h-24 text-center"
                  >
                    暂无结果
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">每页行数</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1); // 重置到第一页
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[15, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          第 {currentPage} 页，共 {totalPages || 1} 页
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage <= 1}
        >
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage >= totalPages}
        >
          下一页
        </Button>
      </div>
    </div>
  )
}
