"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData> {
  columns: any[]
  data: TData[]
}

export function DataTable<TData>({
  columns,
  data,
}: DataTableProps<TData>) {
  return (
    <div className="rounded-md">
      <Table>
        <TableHeader className="hidden">
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index}>
                {typeof column.header === 'function' 
                  ? column.header({}) 
                  : column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex}>
                    {column.cell 
                      ? column.cell({ row, getValue: (key: string) => (row as any)[key], original: row }) 
                      : (row as any)[column.accessorKey]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                没有数据可显示
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// 添加一个加载状态组件
export function DataTableSkeleton() {
  return (
    <div className="rounded-md">
      <Table>
        <TableBody>
          {Array(5).fill(0).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </TableCell>
              <TableCell>
                <div className="h-5 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </TableCell>
              <TableCell>
                <div className="h-5 w-14 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <div className="h-6 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// 添加一个错误状态组件
export function DataTableError({ error }: { error: string }) {
  return (
    <div className="rounded-md">
      <Table>
        <TableBody>
          <TableRow>
            <TableCell colSpan={4} className="h-24 text-center text-red-500">
              <div className="flex flex-col items-center">
                <p>加载数据时出错</p>
                <p className="text-sm text-gray-500">请稍后再试</p>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}
