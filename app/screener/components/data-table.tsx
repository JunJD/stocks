"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
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
import { useCallback, useState, useRef } from "react"
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

// 定义筛选器选项
const screenerOptions = [
  { id: "all_stocks", label: "全部股票" },
  { id: "most_actives", label: "成交活跃" },
  { id: "day_gainers", label: "日涨幅榜" },
  { id: "day_losers", label: "日跌幅榜" },
  { id: "small_cap_gainers", label: "小盘涨幅榜" },
  { id: "growth_technology_stocks", label: "科技成长股" },
];

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function ScreenerTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  
  // 从全局状态获取自选股相关函数
  const addToFavorites = useStockStore(state => state.addToFavorites);
  const removeFromFavorites = useStockStore(state => state.removeFromFavorites);
  const isFavorite = useStockStore(state => state.isFavorite);

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const table = useReactTable({
    data,
    columns,
    initialState: {
      pagination: {
        pageSize: 15,
      },
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFilteredRowModel: getFilteredRowModel(),
  })

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="搜索股票代码或公司名称..."
            value={(table.getColumn("shortName")?.getFilterValue() as string) ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              // 同时筛选股票代码和公司名称
              table.getColumn("shortName")?.setFilterValue(value);
              
              // 如果有symbol列，也对其进行筛选
              if (table.getColumn("symbol")) {
                table.getColumn("symbol")?.setFilterValue(value);
              }
            }}
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
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {typeof column.columnDef.meta === 'string' ? column.columnDef.meta : column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {/* 添加自选列 */}
                  <TableHead className="w-10">
                    <div className="text-center">自选</div>
                  </TableHead>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            header.column.getCanSort()
                              ? "cursor-pointer select-none"
                              : ""
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {/* 自选星标列 */}
                    <TableCell className="w-10">
                      <div className="text-center">
                        <button 
                          onClick={() => handleToggleFavorite(row.original as any)}
                          className="focus:outline-none"
                        >
                          <Star 
                            className={isFavorite((row.original as any).symbol) 
                              ? "fill-yellow-400 text-yellow-400" 
                              : "text-muted-foreground"}
                            size={16} 
                          />
                        </button>
                      </div>
                    </TableCell>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {cell.column.id === 'symbol' ? (
                          <StockHoverCard symbol={(row.original as any).symbol}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </StockHoverCard>
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1} // +1 for the favorite column
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
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[15, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          第 {table.getState().pagination.pageIndex + 1} 页，共{" "}
          {table.getPageCount()} 页
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          下一页
        </Button>
      </div>
    </div>
  )
}
