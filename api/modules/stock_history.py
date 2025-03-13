from typing import Dict, List, Optional
from fastapi import APIRouter, Query
import pandas as pd
from .utils.logger import get_logger
from .utils.stock_history_provider import stock_history_provider

# 创建logger实例
logger = get_logger(__name__)

router = APIRouter(tags=["stock_history"])

@router.get("/stock/history")
async def stock_history(
    ticker: str,
    period: str = "daily",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    adjust: str = "",
    indicators: bool = False
) -> Dict:
    """
    获取股票历史数据API
    :param ticker: 股票代码
    :param period: 周期，可选daily, weekly, monthly
    :param start_date: 开始日期，格式为YYYYMMDD
    :param end_date: 结束日期，格式为YYYYMMDD
    :param adjust: 复权类型，可选qfq(前复权), hfq(后复权), 空字符串表示不复权
    :param indicators: 是否计算技术指标
    :return: 股票历史数据
    """
    logger.info(f"接收到股票历史数据请求: {ticker}, 周期: {period}, 复权: {adjust}")
    
    try:
        if indicators and period == "daily":
            # 获取带有技术指标的日线数据
            df = stock_history_provider.get_stock_daily_indicators(
                ticker, start_date, end_date, adjust
            )
        else:
            # 获取原始历史数据
            df = stock_history_provider.get_stock_history(
                ticker, period, start_date, end_date, adjust
            )
        
        if df.empty:
            return {
                "success": False,
                "message": f"未找到股票 {ticker} 的历史数据",
                "data": []
            }
        
        # 转换DataFrame为JSON友好格式
        result = df.to_dict(orient="records")
        
        return {
            "success": True,
            "message": "获取历史数据成功",
            "count": len(result),
            "data": result
        }
    except Exception as e:
        logger.error(f"获取历史数据异常: {str(e)}", exc_info=True)
        return {
            "success": False,
            "message": f"获取历史数据失败: {str(e)}",
            "data": []
        }

@router.get("/stock/clear_history_cache")
async def clear_history_cache(ticker: Optional[str] = None) -> Dict:
    """
    清除历史数据缓存
    :param ticker: 股票代码，不提供则清除所有缓存
    :return: 操作结果
    """
    from .utils.stock_history_cache import stock_history_cache
    
    try:
        success = stock_history_cache.clear_cache(ticker)
        if success:
            msg = f"成功清除{'所有' if ticker is None else ticker + '的'}历史数据缓存"
            logger.info(msg)
            return {"success": True, "message": msg}
        else:
            msg = f"清除{'所有' if ticker is None else ticker + '的'}历史数据缓存失败"
            logger.warning(msg)
            return {"success": False, "message": msg}
    except Exception as e:
        logger.error(f"清除历史数据缓存异常: {str(e)}", exc_info=True)
        return {"success": False, "message": f"清除历史数据缓存异常: {str(e)}"}
