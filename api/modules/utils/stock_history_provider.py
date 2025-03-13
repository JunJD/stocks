import pandas as pd
import akshare as ak
from datetime import datetime, timedelta
import logging
from .logger import log_akshare_call
from .stock_history_cache import stock_history_cache

# 获取当前模块的logger
logger = logging.getLogger(__name__)

class StockHistoryProvider:
    """股票历史数据提供者"""
    
    def get_stock_history(self, symbol: str, period: str = "daily", 
                          start_date: str = None, end_date: str = None, 
                          adjust: str = "", use_cache: bool = True) -> pd.DataFrame:
        """
        获取股票历史数据，优先使用缓存
        
        Args:
            symbol: 股票代码，如000001或sz000001
            period: 周期，如daily, weekly, monthly
            start_date: 开始日期，格式为YYYYMMDD
            end_date: 结束日期，格式为YYYYMMDD
            adjust: 复权类型，如qfq, hfq
            use_cache: 是否使用缓存
            
        Returns:
            股票历史数据DataFrame
        """
        # 如果没有指定结束日期，则使用当前日期
        if end_date is None:
            end_date = datetime.now().strftime("%Y%m%d")
            
        # 如果没有指定开始日期，则使用一年前的日期
        if start_date is None:
            start_date = (datetime.now() - timedelta(days=365)).strftime("%Y%m%d")
            
        # 标准化股票代码
        if symbol.startswith(("sh", "sz", "bj")):
            clean_symbol = symbol[2:]
        else:
            clean_symbol = symbol
            
        # 尝试从缓存获取数据
        if use_cache and stock_history_cache.has_valid_cache(symbol, period, adjust):
            logger.info(f"从缓存获取股票 {symbol} 的历史数据")
            cached_data = stock_history_cache.get_cache(symbol, period, adjust)
            
            if cached_data is not None:
                # 尝试转换日期列为datetime类型
                date_col = '日期' if '日期' in cached_data.columns else 'date'
                if pd.api.types.is_object_dtype(cached_data[date_col]):
                    cached_data[date_col] = pd.to_datetime(cached_data[date_col])
                
                # 筛选指定日期范围的数据
                start_dt = pd.to_datetime(start_date)
                end_dt = pd.to_datetime(end_date)
                
                filtered_data = cached_data[
                    (cached_data[date_col] >= start_dt) & 
                    (cached_data[date_col] <= end_dt)
                ]
                
                # 如果缓存数据包含了请求的日期范围，直接返回
                if len(filtered_data) > 0:
                    logger.info(f"缓存命中，返回 {len(filtered_data)} 条历史数据")
                    return filtered_data
                
                # 如果缓存数据不完整，需要补充获取新数据
                logger.info("缓存数据不完整，需要补充获取新数据")
        
        # 从API获取数据
        logger.info(f"从API获取股票 {clean_symbol} 的历史数据")
        try:
            with log_akshare_call():
                history_data = ak.stock_zh_a_hist(
                    symbol=clean_symbol, 
                    period=period,
                    start_date=start_date,
                    end_date=end_date,
                    adjust=adjust
                )
                
            if history_data is not None and not history_data.empty:
                logger.info(f"成功获取 {len(history_data)} 条历史数据")
                
                # 更新缓存
                if use_cache:
                    stock_history_cache.merge_new_data(symbol, history_data, period, adjust)
                
                return history_data
            else:
                logger.warning(f"获取股票 {symbol} 的历史数据失败，返回空DataFrame")
                return pd.DataFrame()
        except Exception as e:
            logger.error(f"获取股票历史数据异常: {str(e)}")
            return pd.DataFrame()
            
    def get_stock_daily_indicators(self, symbol: str, 
                                  start_date: str = None, end_date: str = None,
                                  adjust: str = "qfq", use_cache: bool = True) -> pd.DataFrame:
        """
        获取股票日线指标数据
        
        Args:
            symbol: 股票代码
            start_date: 开始日期
            end_date: 结束日期
            adjust: 复权类型
            use_cache: 是否使用缓存
            
        Returns:
            带有技术指标的DataFrame
        """
        # 获取原始历史数据
        df = self.get_stock_history(symbol, "daily", start_date, end_date, adjust, use_cache)
        
        if df.empty:
            return df
            
        # 计算常用技术指标
        # 1. 移动平均线
        df['MA5'] = df['收盘'].rolling(window=5).mean()
        df['MA10'] = df['收盘'].rolling(window=10).mean()
        df['MA20'] = df['收盘'].rolling(window=20).mean()
        df['MA60'] = df['收盘'].rolling(window=60).mean()
        
        # 2. 成交量移动平均
        df['VOLUME_MA5'] = df['成交量'].rolling(window=5).mean()
        
        # 3. 相对强弱指标(RSI)
        close_diff = df['收盘'].diff()
        gain = close_diff.mask(close_diff < 0, 0)
        loss = -close_diff.mask(close_diff > 0, 0)
        avg_gain = gain.rolling(window=14).mean()
        avg_loss = loss.rolling(window=14).mean()
        rs = avg_gain / avg_loss
        df['RSI'] = 100 - (100 / (1 + rs))
        
        return df

# 创建全局单例实例
stock_history_provider = StockHistoryProvider()
