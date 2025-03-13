import os
import json
import pandas as pd
import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List, Union
import logging

# 获取当前模块的logger
logger = logging.getLogger(__name__)

class StockHistoryCache:
    """股票历史数据缓存管理器"""
    
    def __init__(self, cache_dir: str = "data/cache/stock_history"):
        """
        初始化缓存管理器
        
        Args:
            cache_dir: 缓存目录
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"股票历史数据缓存目录：{self.cache_dir}")
    
    def get_cache_path(self, ticker: str, period: str = "daily", adjust: str = "") -> Path:
        """获取指定股票的缓存文件路径"""
        # 将股票代码中的特殊字符替换为下划线
        safe_ticker = ticker.replace(".", "_").replace("^", "_")
        adjust_suffix = f"_{adjust}" if adjust else ""
        return self.cache_dir / f"{safe_ticker}_{period}{adjust_suffix}.parquet"
    
    def has_valid_cache(self, ticker: str, period: str = "daily", adjust: str = "", 
                         max_age_days: int = 7) -> bool:
        """
        检查是否有有效的缓存
        
        Args:
            ticker: 股票代码
            period: 周期，如daily, weekly, monthly
            adjust: 复权类型，如qfq, hfq
            max_age_days: 缓存最大有效天数
            
        Returns:
            是否有有效缓存
        """
        cache_path = self.get_cache_path(ticker, period, adjust)
        
        # 检查缓存文件是否存在
        if not cache_path.exists():
            return False
        
        # 检查文件修改时间是否在有效期内
        file_mtime = datetime.datetime.fromtimestamp(cache_path.stat().st_mtime)
        now = datetime.datetime.now()
        
        # 如果是周末，缓存可以更长时间有效
        today = now.weekday()
        if today >= 5:  # 5=周六, 6=周日
            max_age_days = max(max_age_days, 10)  # 周末缓存可以保留更长时间
        
        # 检查文件是否在有效期内
        if (now - file_mtime).days > max_age_days:
            return False
            
        return True
    
    def get_cache(self, ticker: str, period: str = "daily", adjust: str = "") -> Optional[pd.DataFrame]:
        """获取缓存数据"""
        cache_path = self.get_cache_path(ticker, period, adjust)
        
        if not cache_path.exists():
            return None
        
        try:
            df = pd.read_parquet(cache_path)
            return df
        except Exception as e:
            logger.warning(f"读取历史数据缓存文件异常: {str(e)}")
            return None
    
    def update_cache(self, ticker: str, data: pd.DataFrame, period: str = "daily", 
                     adjust: str = "") -> bool:
        """
        更新缓存数据
        
        Args:
            ticker: 股票代码
            data: 历史数据DataFrame
            period: 周期
            adjust: 复权类型
            
        Returns:
            是否成功更新
        """
        cache_path = self.get_cache_path(ticker, period, adjust)
        
        try:
            # 确保目录存在
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 保存为parquet格式，更节省空间且保留数据类型
            data.to_parquet(cache_path, index=False)
            logger.info(f"更新股票 {ticker} 的历史数据缓存成功")
            return True
        except Exception as e:
            logger.error(f"更新历史数据缓存文件异常: {str(e)}")
            return False
    
    def merge_new_data(self, ticker: str, new_data: pd.DataFrame, period: str = "daily", 
                      adjust: str = "") -> bool:
        """
        合并新数据到现有缓存
        
        Args:
            ticker: 股票代码
            new_data: 新的历史数据
            period: 周期
            adjust: 复权类型
            
        Returns:
            是否成功合并
        """
        # 获取现有缓存
        cached_data = self.get_cache(ticker, period, adjust)
        
        if cached_data is None:
            # 没有缓存，直接保存新数据
            return self.update_cache(ticker, new_data, period, adjust)
        
        try:
            # 假设数据中有日期列，名为'日期'或'date'
            date_col = '日期' if '日期' in new_data.columns else 'date'
            
            # 确保日期列是日期类型
            if pd.api.types.is_object_dtype(cached_data[date_col]):
                cached_data[date_col] = pd.to_datetime(cached_data[date_col])
            if pd.api.types.is_object_dtype(new_data[date_col]):
                new_data[date_col] = pd.to_datetime(new_data[date_col])
            
            # 合并数据，删除重复项
            merged_data = pd.concat([cached_data, new_data], ignore_index=True)
            merged_data = merged_data.drop_duplicates(subset=[date_col])
            
            # 按日期排序
            merged_data = merged_data.sort_values(by=date_col)
            
            # 更新缓存
            return self.update_cache(ticker, merged_data, period, adjust)
        except Exception as e:
            logger.error(f"合并历史数据失败: {str(e)}")
            return False
    
    def clear_cache(self, ticker: Optional[str] = None, period: Optional[str] = None, 
                   adjust: Optional[str] = None) -> bool:
        """
        清除缓存
        
        Args:
            ticker: 要清除的股票代码，如果为None则匹配所有股票
            period: 要清除的周期，如果为None则匹配所有周期
            adjust: 要清除的复权类型，如果为None则匹配所有复权类型
            
        Returns:
            是否成功清除
        """
        try:
            pattern = ""
            if ticker:
                safe_ticker = ticker.replace(".", "_").replace("^", "_")
                pattern = f"{safe_ticker}_"
                if period:
                    pattern += f"{period}"
                    if adjust:
                        pattern += f"_{adjust}"
            elif period:
                pattern = f"*_{period}"
                if adjust:
                    pattern += f"_{adjust}"
            elif adjust:
                pattern = f"*_*_{adjust}"
            else:
                pattern = "*"
                
            count = 0
            for cache_file in self.cache_dir.glob(f"{pattern}.parquet"):
                cache_file.unlink()
                count += 1
                
            logger.info(f"已清除{count}个股票历史数据缓存文件")
            return True
        except Exception as e:
            logger.error(f"清除历史数据缓存异常: {str(e)}")
            return False

# 创建全局单例实例
stock_history_cache = StockHistoryCache()
