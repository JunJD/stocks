from typing import Dict
from fastapi import APIRouter
import akshare as ak
from fastapi import APIRouter
from typing import List, Dict, Any
from .utils.logger import get_logger
from .utils.stock_data_fetcher import fetch_stock_zh_a_spot
import pandas as pd
import concurrent.futures
import asyncio
import traceback

logger = get_logger(__name__)

router = APIRouter(tags=["stock_screener"])

def run_in_thread(func, *args, **kwargs):
    """在单独的线程中运行函数，避免与事件循环冲突"""
    with concurrent.futures.ThreadPoolExecutor() as executor:
        future = executor.submit(func, *args, **kwargs)
        return future.result()

@router.get("/stock/screener")
async def stock_screener(screener: str = "all_stocks", count: int = 40, page: int = 1) -> Dict:
    """
    获取股票筛选器数据API
    支持的筛选类型：
    - all_stocks: 全部股票（按代码排序）
    :param screener: 筛选类型
    :param count: 每页返回数量
    :param page: 页码，从1开始
    :return: 股票列表和总条目数
    """
    logger.info(f"获取筛选器数据，类型: {screener}, 数量: {count}, 页码: {page}")
    
    response = {
        "quotes": [],
        "total": 0
    }
    
    try:
        # 全部筛选器数据基于东方财富A股行情
        logger.info("从东方财富获取A股实时行情数据")
        
        # 使用自定义函数获取数据，传入分页参数
        df, total_count = run_in_thread(fetch_stock_zh_a_spot, count, page)
        
        # 记录数据框大小和总条目数
        logger.info(f"获取到 {len(df)} 条股票数据，总条目数: {total_count}")
        print('length:', len(df), 'total:', total_count)
        
        # 设置响应中的总条目数
        response["total"] = total_count
        
        if df is not None and not df.empty:
            logger.info(f"成功获取行情数据，条数: {len(df)}")
            
            # 记录一下列名，帮助调试
            logger.debug(f"数据列名: {df.columns.tolist()}")
            
            # 确保必要的字段存在
            required_fields = ["代码", "名称", "最新价", "涨跌额", "涨跌幅"]
            for field in required_fields:
                if field not in df.columns:
                    logger.error(f"缺少必要字段 '{field}'")
                    raise Exception(f"数据缺少必要字段 '{field}'")
            
            # 添加必要的字段
            df["symbol"] = df["代码"]
            df["name"] = df["名称"]
            df["price"] = df["最新价"]
            df["change"] = df["涨跌额"]
            df["changePct"] = df["涨跌幅"]
            
            # 如果有市盈率字段，使用它
            df["pe"] = df["市盈率-动态"] if "市盈率-动态" in df.columns else 0
            
            # 如果有市值字段，使用它
            df["marketCap"] = df["总市值"] if "总市值" in df.columns else 0
            
            # 处理所处行业字段
            if "所处行业" not in df.columns:
                df["所处行业"] = "未知"
            
            # 处理数据 - 只保留全部股票筛选器
            # 全部股票，按代码排序
            df = df.sort_values(by="代码")
            
            # 转换数据格式
            for _, row in df.iterrows():
                try:
                    # 格式化代码（添加市场前缀）
                    symbol = row["symbol"]
                    if not isinstance(symbol, str):
                        symbol = str(symbol)
                        
                    if symbol.startswith(("0", "3")):
                        display_symbol = f"sz{symbol}"
                    elif symbol.startswith("6"):
                        display_symbol = f"sh{symbol}"
                    else:
                        display_symbol = symbol
                        
                    # 安全地获取数值，确保不会出现NaN
                    def safe_float(val, default=0):
                        try:
                            if pd.isna(val):
                                return default
                            return float(val)
                        except (ValueError, TypeError):
                            return default
                    
                    # 构建股票数据
                    stock = {
                        "symbol": display_symbol,
                        "shortName": str(row["name"]),
                        "regularMarketPrice": safe_float(row["price"]),
                        "regularMarketChange": safe_float(row["change"]),
                        "regularMarketChangePercent": safe_float(row["changePct"]) / 100,  # 转换为小数
                        "regularMarketVolume": safe_float(row["成交量"]) if "成交量" in row and not pd.isna(row["成交量"]) else 0,
                        "regularMarketDayHigh": safe_float(row["最高"]) if "最高" in row and not pd.isna(row["最高"]) else 0,
                        "regularMarketDayLow": safe_float(row["最低"]) if "最低" in row and not pd.isna(row["最低"]) else 0,
                        "regularMarketOpen": safe_float(row["今开"]) if "今开" in row and not pd.isna(row["今开"]) else 0,
                        "regularMarketPreviousClose": safe_float(row["昨收"]) if "昨收" in row and not pd.isna(row["昨收"]) else 0,
                        "trailingPE": safe_float(row["pe"]) if "pe" in row and not pd.isna(row["pe"]) else 0,
                        "marketCap": safe_float(row["marketCap"]) if "marketCap" in row else 0,
                        "averageDailyVolume3Month": safe_float(row["成交量"]) if "成交量" in row and not pd.isna(row["成交量"]) else 0,
                        "sector": str(row["所处行业"]) if "所处行业" in row else "未知",
                        "currency": "CNY"
                    }
                    response["quotes"].append(stock)
                except Exception as e:
                    logger.error(f"处理行数据时出错: {str(e)}")
                    # 继续处理下一行，不要因为一行数据错误而中断整个处理
                
            logger.debug(f"处理完成，返回 {len(response['quotes'])} 条数据")
            
            # 如果没有获取到任何数据，返回错误
            if len(response["quotes"]) == 0:
                logger.error("处理后没有有效数据")
                response["error"] = "处理后没有有效数据"
        else:
            logger.error("获取到的数据为空")
            response["error"] = "获取到的数据为空"
            
    except Exception as e:
        logger.error(f"获取筛选器数据失败: {str(e)}", exc_info=True)
        response["error"] = f"获取数据失败: {str(e)}"
        traceback.print_exc()  # 打印完整堆栈，帮助调试
        
    return response 