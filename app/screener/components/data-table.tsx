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
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import StockHoverCard from "@/components/chart/StockHoverCard"
import { Star } from "lucide-react"
import { useFavorites } from "@/components/providers/favorites-provider"

interface DataTableProps {
  columns: any[]
  data: any[]
  totalCount?: number
  currentPage?: number
  pageSize?: number
}

export function ScreenerTable({
  columns,
  data,
  totalCount = 0,
  currentPage = 1,
  pageSize = 15
}: DataTableProps) {
  const { favorites, removeFromFavorites, addToFavorites } = useFavorites()
  const [searchText, setSearchText] = useState("")
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({})
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  
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

  // 本地筛选数据（仅基于搜索文本）
  const filteredData = data.filter(item => {
    if (!searchText) return true;
    const lowerCaseSearch = searchText.toLowerCase();
    return (
      (item.symbol && item.symbol.toLowerCase().includes(lowerCaseSearch)) ||
      (item.shortName && item.shortName.toLowerCase().includes(lowerCaseSearch))
    );
  });

  // 计算总页数（基于服务器返回的总数）
  const totalItems = searchText ? filteredData.length : totalCount;
  const totalPages = Math.ceil(totalItems / pageSize);

  // 处理分页变化
  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    replace(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, replace]);

  // 处理每页数量变化
  const handlePageSizeChange = useCallback((newSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("count", newSize.toString());
    params.set("page", "1"); // 切换每页数量时重置到第一页
    replace(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, replace]);

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

  // 处理跳转页面
  const handleJumpToPage = (page: number) => {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    handlePageChange(page);
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
                <TableHead className="w-10 whitespace-nowrap">
                  <div className="text-center">自选</div>
                </TableHead>
                
                {/* 动态列 */}
                {getVisibleColumns().map((column, index) => (
                  <TableHead key={index} className="whitespace-nowrap">
                    {typeof column.header === 'function' 
                      ? column.header() 
                      : column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row, rowIndex) => (
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
                        {column.cell 
                          ? column.cell({ row }) 
                          : row[column.accessorKey]}
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
        <div className="flex items-center space-x-2 flex-shrink-0">
          <p className="text-sm font-medium">每页行数</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              handlePageSizeChange(Number(value));
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
        <div className="flex items-center space-x-2 flex-shrink-0">
          <div className="flex-shrink-0 items-center justify-center text-sm font-medium flex-shrink-0">
            第 {currentPage} 页，共 {totalPages || 1} 页
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="flex-shrink-0"
          >
            上一页
          </Button>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Input
              className="h-8 w-[50px]"
              type="number"
              min={1}
              max={totalPages}
              defaultValue={currentPage}
              onChange={(e) => {
                if (e.target.value && Number(e.target.value) > 0) {
                  handleJumpToPage(Number(e.target.value));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value) {
                  handleJumpToPage(Number(e.currentTarget.value));
                }
              }}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const input = document.querySelector('input[type="number"]') as HTMLInputElement;
                if (input && input.value) {
                  handleJumpToPage(Number(input.value));
                }
              }}
              className="flex-shrink-0"
            >
              跳转
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="flex-shrink-0"
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}
