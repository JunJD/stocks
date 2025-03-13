import os
import json
import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import logging

# 获取当前模块的logger
logger = logging.getLogger(__name__)

class StockDataCache:
    """股票数据缓存管理器"""
    
    def __init__(self, cache_dir: str = "data/cache/stock"):
        """
        初始化缓存管理器
        
        Args:
            cache_dir: 缓存目录
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"股票数据缓存目录：{self.cache_dir}")
    
    def get_cache_path(self, ticker: str) -> Path:
        """获取指定股票的缓存文件路径"""
        # 将股票代码中的特殊字符替换为下划线
        safe_ticker = ticker.replace(".", "_").replace("^", "_")
        return self.cache_dir / f"{safe_ticker}.json"
    
    def has_valid_cache(self, ticker: str, max_age_days: int = 1) -> bool:
        """
        检查是否有有效的缓存
        
        Args:
            ticker: 股票代码
            max_age_days: 缓存最大有效天数
            
        Returns:
            是否有有效缓存
        """
        cache_path = self.get_cache_path(ticker)
        
        # 检查缓存文件是否存在
        if not cache_path.exists():
            return False
        
        # 检查文件修改时间是否在有效期内
        file_mtime = datetime.datetime.fromtimestamp(cache_path.stat().st_mtime)
        now = datetime.datetime.now()
        
        # 如果是周末，缓存可以更长时间有效
        today = now.weekday()
        if today >= 5:  # 5=周六, 6=周日
            max_age_days = 3  # 周末缓存可以保留更长时间
        
        # 检查文件是否在有效期内
        if (now - file_mtime).days > max_age_days:
            return False
        
        # 读取缓存文件，检查交易日是否为当前交易日
        try:
            with open(cache_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # 如果没有cache_date字段，认为缓存无效
            if 'cache_date' not in data:
                return False
                
            # 如果是工作日，检查日期是否为今天
            if today < 5 and data['cache_date'] != now.strftime('%Y-%m-%d'):
                # 检查是否是节假日
                # TODO: 这里可以添加节假日检查逻辑
                return False
                
            return True
        except Exception as e:
            logger.warning(f"检查缓存有效性异常: {str(e)}")
            return False
    
    def get_cache(self, ticker: str) -> Optional[Dict[str, Any]]:
        """获取缓存数据"""
        cache_path = self.get_cache_path(ticker)
        
        if not cache_path.exists():
            return None
        
        try:
            with open(cache_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"读取缓存文件异常: {str(e)}")
            return None
    
    def update_cache(self, ticker: str, data: Dict[str, Any]) -> bool:
        """更新缓存数据"""
        cache_path = self.get_cache_path(ticker)
        
        # 添加缓存时间戳
        data['cache_date'] = datetime.datetime.now().strftime('%Y-%m-%d')
        
        try:
            with open(cache_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"更新股票 {ticker} 的缓存成功")
            return True
        except Exception as e:
            logger.error(f"更新缓存文件异常: {str(e)}")
            return False
    
    def clear_cache(self, ticker: Optional[str] = None) -> bool:
        """
        清除缓存
        
        Args:
            ticker: 要清除的股票代码，如果为None则清除所有缓存
        
        Returns:
            是否成功清除
        """
        try:
            if ticker:
                cache_path = self.get_cache_path(ticker)
                if cache_path.exists():
                    cache_path.unlink()
                    logger.info(f"已清除股票 {ticker} 的缓存")
            else:
                # 清除所有缓存
                for cache_file in self.cache_dir.glob("*.json"):
                    cache_file.unlink()
                logger.info("已清除所有股票缓存")
            return True
        except Exception as e:
            logger.error(f"清除缓存异常: {str(e)}")
            return False

# 创建全局单例实例
stock_cache = StockDataCache() 