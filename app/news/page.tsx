"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

// 使用项目已有的UI组件
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

// 定义类型
interface NewsItem {
  title: string;
  content: string;
  time: string;
  url: string;
}

interface NewsCategory {
  id: string;
  name: string;
  description: string;
}

export default function NewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 从URL参数中获取当前状态
  const source = searchParams.get("source") || "sina";
  const count = parseInt(searchParams.get("count") || "20");
  const page = parseInt(searchParams.get("page") || "1");
  
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 更新URL参数的函数
  const updateQueryParams = (
    newSource?: string,
    newCount?: number,
    newPage?: number
  ) => {
    const params = new URLSearchParams(searchParams);
    
    if (newSource) params.set("source", newSource);
    if (newCount) params.set("count", newCount.toString());
    if (newPage) params.set("page", newPage.toString());
    
    router.push(`/news?${params.toString()}`);
  };

  // 获取新闻分类
  useEffect(() => {
    fetch("/api/py/stock/news_category")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.categories) {
          setCategories(data.categories);
        }
      })
      .catch((err) => {
        console.error("获取新闻分类失败:", err);
      });
  }, []);

  // 获取新闻数据
  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/py/stock/news?source=${source}&count=${count}&page=${page}`)
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.error) {
          setError(data.error);
          setNewsData([]);
        } else if (data.items && data.items.length > 0) {
          setNewsData(data.items);
        } else {
          setNewsData([]);
          setError("未获取到新闻数据");
        }
      })
      .catch((err) => {
        setLoading(false);
        setError(`获取新闻失败: ${err.message}`);
        setNewsData([]);
      });
  }, [source, count, page]);

  // 渲染新闻列表
  const renderNewsList = () => {
    if (loading) {
      return Array(5)
        .fill(null)
        .map((_, index) => (
          <Card key={index} className="mb-4">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
          </Card>
        ));
    }

    if (newsData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">暂无数据</p>
        </div>
      );
    }

    return newsData.map((item, index) => (
      <Card key={index} className="mb-4 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {item.url ? (
              <Link
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-primary"
              >
                {item.title || item.content}
              </Link>
            ) : (
              item.title || item.content
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-xs text-muted-foreground mb-2">
            {item.time}
          </CardDescription>
          {item.content && item.content !== item.title && (
            <p className="text-sm">{item.content}</p>
          )}
        </CardContent>
      </Card>
    ));
  };

  // 渲染分页控件
  const renderPagination = () => {
    if (source !== "broker_sina" || newsData.length === 0) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateQueryParams(undefined, undefined, page - 1)}
          disabled={page <= 1}
        >
          上一页
        </Button>
        <span className="text-sm text-muted-foreground">第 {page} 页</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => updateQueryParams(undefined, undefined, page + 1)}
        >
          下一页
        </Button>
      </div>
    );
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">股市快讯</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm whitespace-nowrap">数据来源:</span>
            <Select
              value={source}
              onValueChange={(value) => updateQueryParams(value, undefined, 1)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择数据来源" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm whitespace-nowrap">显示数量:</span>
            <Select
              value={count.toString()}
              onValueChange={(value) => 
                updateQueryParams(undefined, parseInt(value))
              }
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="显示数量" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10条</SelectItem>
                <SelectItem value="20">20条</SelectItem>
                <SelectItem value="30">30条</SelectItem>
                <SelectItem value="50">50条</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator className="mb-6" />

      {error && (
        <Alert variant="destructive" className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>错误</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {renderNewsList()}
      </div>

      {renderPagination()}
    </div>
  );
}