'use client'

import { ReactNode, createContext, useContext, useEffect } from 'react'
import useStockStore, { fetchStockData } from '@/store/stockStore'

// 创建自选股上下文
export const FavoritesContext = createContext<{
  isLoading: boolean
  favorites: any[]
  addToFavorites: (stock: { symbol: string, shortName: string }) => void
  removeFromFavorites: (symbol: string) => void
  isFavorite: (symbol: string) => boolean
}>({
  isLoading: false,
  favorites: [],
  addToFavorites: () => {},
  removeFromFavorites: () => {},
  isFavorite: () => false
})

// 自选股提供者组件
export function FavoritesProvider({ children }: { children: ReactNode }) {
  // 获取全局状态中的自选股相关函数
  const favorites = useStockStore(state => state.favorites)
  const addToFavorites = useStockStore(state => state.addToFavorites)
  const removeFromFavorites = useStockStore(state => state.removeFromFavorites)
  const isFavorite = useStockStore(state => state.isFavorite)
  
  // 加载所有自选股数据
  useEffect(() => {
    const loadFavoritesData = async () => {
      try {
        // 异步加载所有自选股数据
        await Promise.all(
          favorites.map(favorite => fetchStockData(favorite.symbol))
        )
      } catch (error) {
        console.error('加载自选股数据失败:', error)
      }
    }
    
    if (favorites.length > 0) {
      loadFavoritesData()
    }
  }, [favorites])
  
  return (
    <FavoritesContext.Provider 
      value={{ 
        isLoading: false, 
        favorites, 
        addToFavorites, 
        removeFromFavorites, 
        isFavorite 
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

// 使用自选股上下文的Hook
export const useFavorites = () => useContext(FavoritesContext) 