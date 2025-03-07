from typing import Dict, List, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
import pandas as pd
from .utils.logger import get_logger
from .utils.stock_data_provider import stock_data_provider

# 创建logger实例
logger = get_logger(__name__)

router = APIRouter(tags=["stock_chart"])

# 定义中国主要指数代码映射
CHINA_INDEX_MAP = {
    "sh000016": "上证50", 
    "sh000300": "沪深300",
    "sh000852": "中证1000",
}

@router.get("/stock/chart")
async def stock_chart(
    ticker: str, 
    interval: str = "1m"
) -> Dict[str, Any]:
    """
    获取股票图表数据API
    :param ticker: 股票代码
    :param interval: 时间间隔 (1m, 5m, 15m, 30m, 60m, 1d, 1wk, 1mo)
    :return: 图表数据
    """
    logger.info(f"接收到图表数据请求: ticker={ticker}, interval={interval}")
    
    try:
        # 标准化股票代码
        clean_ticker, is_index = stock_data_provider.standardize_ticker(ticker)
        logger.debug(f"处理后的股票代码: {clean_ticker}, 是否为指数: {is_index}")
        
        # 转换interval为akshare支持的格式
        ak_interval = _convert_interval(interval)
        logger.debug(f"转换后的时间间隔: {ak_interval}")
        
        # 获取分时数据
        quotes = []
        if ak_interval in ('1', '5', '15', '30', '60'):
            # 使用分时数据
            quotes = stock_data_provider.get_realtime_min_data(clean_ticker, ak_interval)
            if not quotes:
                logger.warning(f"未能获取到 {ticker} 的分时数据")
        else:
            # 对于非分钟级别的请求，使用较长时间范围的数据
            logger.warning(f"不支持的时间间隔: {interval}，默认使用1分钟")
            quotes = stock_data_provider.get_realtime_min_data(clean_ticker, '1')
        
        # 记录最终数据内容
        data_count = len(quotes) if quotes else 0
        logger.info(f"返回数据: 股票={ticker}, 数据点数={data_count}")
        if quotes and data_count > 0:
            logger.debug(f"第一个数据点: {quotes[0]}")
            logger.debug(f"最后一个数据点: {quotes[-1]}")
        
        # 返回与Yahoo Finance格式兼容的结果
        return {
            "ticker": ticker,
            "quotes": quotes,
            "currency": "CNY",
            "error": None
        }
    except Exception as e:
        logger.error(f"处理图表数据请求时发生错误: {str(e)}", exc_info=True)
        return {
            "ticker": ticker,
            "quotes": [],
            "currency": "CNY",
            "error": str(e)
        }

def _convert_interval(interval: str) -> str:
    """
    将前端时间间隔转换为akshare支持的格式
    :param interval: 前端时间间隔
    :return: akshare支持的时间间隔
    """
    interval_map = {
        "1m": "1",
        "5m": "5",
        "15m": "15",
        "30m": "30",
        "60m": "60",
        "1h": "60",
        "1d": "D",
        "1wk": "W",
        "1mo": "M"
    }
    
    return interval_map.get(interval, "1") 