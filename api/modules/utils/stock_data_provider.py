import akshare as ak
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple, Callable
from ..utils.logger import get_logger, log_akshare_call

logger = get_logger(__name__)

class StockDataProvider:
    """股票数据提供者，负责从不同数据源获取数据并处理转换"""
    
    @staticmethod
    def standardize_ticker(ticker: str) -> Tuple[str, bool]:
        """
        标准化股票代码
        :param ticker: 原始股票代码
        :return: (标准化后的代码, 是否为指数)
        """
        # 移除前缀符号^
        clean_ticker = ticker.replace('^', '')
        
        # 判断是否为指数
        is_index = ticker.startswith('^') or clean_ticker in {
            "sh000016", "sh000300", "sh000852", "sh000001", "sz399001", "sz399006"
        }
        
        return clean_ticker, is_index
    
    @staticmethod
    def get_date_range(range_str: str) -> Tuple[datetime, datetime, str]:
        """
        根据范围字符串获取日期范围
        :param range_str: 范围字符串 (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)
        :return: (开始日期, 结束日期, 周期类型)
        """
        end_date = datetime.now()
        
        if range_str == "1d":
            start_date = end_date - timedelta(days=1)
            period = "daily"
        elif range_str == "5d":
            start_date = end_date - timedelta(days=5)
            period = "daily" 
        elif range_str == "1mo":
            start_date = end_date - timedelta(days=30)
            period = "daily"
        elif range_str == "3mo":
            start_date = end_date - timedelta(days=90)
            period = "daily"
        elif range_str == "6mo":
            start_date = end_date - timedelta(days=180)
            period = "daily"
        elif range_str == "1y":
            start_date = end_date - timedelta(days=365)
            period = "daily"
        elif range_str == "2y":
            start_date = end_date - timedelta(days=365*2)
            period = "daily"
        elif range_str == "5y":
            start_date = end_date - timedelta(days=365*5)
            period = "weekly"
        elif range_str == "10y":
            start_date = end_date - timedelta(days=365*10)
            period = "weekly"
        elif range_str == "ytd":
            start_date = datetime(end_date.year, 1, 1)
            period = "daily"
        else:  # "max"
            start_date = datetime(2000, 1, 1)
            period = "monthly"
            
        return start_date, end_date, period
    
    @staticmethod
    def format_date_str(date: datetime) -> str:
        """格式化日期为字符串 YYYYMMDD 格式"""
        return date.strftime("%Y%m%d")

    @log_akshare_call
    def get_stock_min_em(self, symbol: str, period: str = '1') -> Optional[pd.DataFrame]:
        """
        获取股票分时数据（东方财富）
        :param symbol: 股票代码 (如 '600519' 或 'sh600519')
        :param period: 分时周期 ('1', '5', '15', '30', '60')
        :return: 分时数据
        """
        try:
            # 去掉可能存在的sh/sz前缀
            if symbol.startswith('sh') or symbol.startswith('sz'):
                clean_symbol = symbol[2:]
            else:
                clean_symbol = symbol
                
            # 使用东方财富的分时历史数据接口
            # 注意：start_date和end_date格式需要为'YYYY-MM-DD HH:MM:SS'
            start_time = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d %H:%M:%S")
            end_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            logger.debug(f"获取股票 {symbol}(处理后:{clean_symbol}) 的分时数据，周期：{period}，开始时间：{start_time}，结束时间：{end_time}")
            
            return ak.stock_zh_a_hist_min_em(
                symbol=clean_symbol, 
                period=period,
                start_date=start_time, 
                end_date=end_time,
                adjust='qfq'
            )
        except Exception as e:
            logger.error(f"获取股票分时数据失败(stock_zh_a_hist_min_em): '{symbol}'", exc_info=True)
            return None
    
    @log_akshare_call
    def get_stock_min_sina(self, symbol: str, period: str = '1') -> Optional[pd.DataFrame]:
        """
        获取股票分时数据(通用API)
        :param symbol: 股票代码 (如 '600519' 或 'sh600519')
        :return: 分时数据
        """
        try:
            # 确保代码格式正确 (sz或sh前缀)
            if symbol.startswith('sh') or symbol.startswith('sz'):
                # 已经有前缀，无需修改
                formatted_symbol = symbol
            elif symbol.startswith(('0', '3')):
                formatted_symbol = f"sz{symbol}"
            elif symbol.startswith('6'):
                formatted_symbol = f"sh{symbol}"
            else:
                # 对于其他不确定的情况，尝试加上sz前缀
                formatted_symbol = f"sz{symbol}"
                
            logger.debug(f"尝试使用stock_zh_a_minute获取 {symbol}(处理后:{formatted_symbol}) 的分时数据")
            return ak.stock_zh_a_minute(symbol=formatted_symbol, period=period)
        except Exception as e:
            logger.error(f"获取股票分时数据失败(stock_zh_a_minute): '{symbol}'", exc_info=True)
            return None
    
    @log_akshare_call
    def get_index_min_sina(self, symbol: str, period: str = '1') -> Optional[pd.DataFrame]:
        """
        获取指数分时数据
        :param symbol: 指数代码 (如 'sh000016', 'sh000300' 或 '000016', '000300')
        :return: 分时数据
        """
        try:
            # 对于东方财富的指数API，需要去掉sh或sz前缀
            if symbol.startswith('sh') or symbol.startswith('sz'):
                # 去掉前缀，只保留数字部分
                clean_symbol = symbol[2:]
            else:
                clean_symbol = symbol
                
            # 使用东方财富指数分钟数据API
            now = datetime.now()
            start_date = (now - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
            end_date = now.strftime('%Y-%m-%d %H:%M:%S')
            
            logger.debug(f"尝试使用index_zh_a_hist_min_em获取 {symbol}(处理后:{clean_symbol}) 的分时数据，时间范围: {start_date} 至 {end_date}")
            return ak.index_zh_a_hist_min_em(
                symbol=clean_symbol, 
                period=period, 
                start_date=start_date, 
                end_date=end_date
            )
        except Exception as e:
            logger.error(f"获取指数分时数据失败(index_zh_a_hist_min_em): {e}", exc_info=True)
            return None
    
    def get_realtime_min_data(self, ticker: str, interval: str = '1') -> List[Dict[str, Any]]:
        """
        获取实时分时数据，自动尝试多个数据源
        :param ticker: 股票或指数代码
        :param interval: 分时间隔
        :return: 标准化后的分时数据
        """
        clean_ticker, is_index = self.standardize_ticker(ticker)
        
        # 定义数据源列表，按优先级排序
        data_sources = []
        
        if is_index:
            # 指数数据源
            data_sources = [
                {
                    "name": "index_zh_a_hist_min_em",
                    "handler": lambda: self.get_index_min_sina(clean_ticker, period=interval),
                    "mapper": self._map_index_min_sina
                }
            ]
        else:
            # 股票数据源
            data_sources = [
                {
                    "name": "stock_zh_a_hist_min_em",
                    "handler": lambda: self.get_stock_min_em(clean_ticker, period=interval),
                    "mapper": self._map_stock_min_em
                },
                {
                    "name": "stock_zh_a_minute",
                    "handler": lambda: self.get_stock_min_sina(clean_ticker, period=interval),
                    "mapper": self._map_stock_min_sina
                }
            ]
        
        # 尝试每个数据源
        all_errors = []
        for source in data_sources:
            try:
                logger.info(f"尝试从 {source['name']} 获取 {ticker} 的分时数据")
                df = source["handler"]()
                
                if df is not None and not df.empty:
                    logger.info(f"成功从 {source['name']} 获取数据，条数: {len(df)}")
                    # 使用映射函数转换数据格式
                    result = source["mapper"](df)
                    if result and len(result) > 0:
                        return result
                else:
                    logger.warning(f"从 {source['name']} 获取的数据为空")
            except Exception as e:
                error_msg = f"从 {source['name']} 获取数据时出错: {str(e)}"
                logger.error(error_msg, exc_info=True)
                all_errors.append(error_msg)
        
        if all_errors:
            logger.error(f"所有数据源都失败: {'; '.join(all_errors)}")
        
        return []
    
    def _map_stock_min_em(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """映射东方财富分时数据格式"""
        if df is None or df.empty:
            return []
        
        quotes = []
        try:
            # 检查必要的列是否存在
            required_cols = ["时间", "开盘", "收盘", "最高", "最低", "成交量"]
            
            if not all(col in df.columns for col in required_cols):
                logger.warning(f"东方财富分时数据缺少必要列，现有列: {df.columns.tolist()}")
                return []
            
            # 转换数据
            for _, row in df.iterrows():
                quote = {
                    "date": row["时间"],
                    "open": float(row["开盘"]),
                    "close": float(row["收盘"]),
                    "high": float(row["最高"]),
                    "low": float(row["最低"]),
                    "volume": float(row["成交量"]) if "成交量" in row else 0
                }
                quotes.append(quote)
                
            logger.debug(f"成功转换东方财富分时数据，条数: {len(quotes)}")
            return quotes
        except Exception as e:
            logger.error(f"转换东方财富分时数据时出错: {str(e)}", exc_info=True)
            return []
    
    def _map_stock_min_sina(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """映射股票分钟数据格式(stock_zh_a_minute API)"""
        if df is None or df.empty:
            return []
        
        quotes = []
        try:
            # 检查必要的列是否存在
            required_cols = ["day", "open", "high", "low", "close", "volume"]
            
            if not all(col in df.columns for col in required_cols):
                logger.warning(f"股票分钟数据缺少必要列，现有列: {df.columns.tolist()}")
                return []
            
            # 转换数据
            for _, row in df.iterrows():
                quote = {
                    "date": row["day"],
                    "open": float(row["open"]),
                    "close": float(row["close"]),
                    "high": float(row["high"]),
                    "low": float(row["low"]),
                    "volume": float(row["volume"]) if "volume" in row else 0
                }
                quotes.append(quote)
                
            logger.debug(f"成功转换股票分钟数据，条数: {len(quotes)}")
            return quotes
        except Exception as e:
            logger.error(f"转换股票分钟数据失败: {e}", exc_info=True)
            return []
    
    def _map_index_min_sina(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """映射指数分钟数据格式(index_zh_a_hist_min_em API)"""
        if df is None or df.empty:
            return []
        
        quotes = []
        try:
            # 检查必要的列是否存在
            required_cols = ["时间", "开盘", "收盘", "最高", "最低", "成交量"]
            
            if not all(col in df.columns for col in required_cols):
                logger.warning(f"指数分钟数据缺少必要列，现有列: {df.columns.tolist()}")
                return []
            
            # 转换数据
            for _, row in df.iterrows():
                quote = {
                    "date": row["时间"],
                    "open": float(row["开盘"]),
                    "close": float(row["收盘"]),
                    "high": float(row["最高"]),
                    "low": float(row["最低"]),
                    "volume": float(row["成交量"]) if "成交量" in row else 0
                }
                quotes.append(quote)
                
            logger.debug(f"成功转换指数分钟数据，条数: {len(quotes)}")
            return quotes
        except Exception as e:
            logger.error(f"转换指数分钟数据失败: {e}", exc_info=True)
            return []

# 创建全局数据提供者实例
stock_data_provider = StockDataProvider() 