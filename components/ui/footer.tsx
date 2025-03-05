"use client"

import Link from "next/link"
import { HomeIcon, StarIcon, BellIcon, SearchIcon } from "lucide-react"

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="container py-2">
        <div className="flex justify-around items-center">
          <Link
            href="/watchlist"
            className="flex flex-col items-center p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <StarIcon className="h-5 w-5" />
            <span className="text-xs mt-1">自选</span>
          </Link>
          
          <Link
            href="/news"
            className="flex flex-col items-center p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <BellIcon className="h-5 w-5" />
            <span className="text-xs mt-1">快讯</span>
          </Link>
          
          <Link
            href="/search"
            className="flex flex-col items-center p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <SearchIcon className="h-5 w-5" />
            <span className="text-xs mt-1">搜索</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
