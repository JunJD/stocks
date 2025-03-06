from typing import Dict
from fastapi import APIRouter
import akshare as ak
from fastapi import APIRouter
from typing import List, Dict, Any
from .utils.logger import get_logger
import pandas as pd

logger = get_logger(__name__)

router = APIRouter(tags=["stock_screener"])

@router.get("/stock/screener")
async def stock_screener(screener: str = "most_actives", count: int = 40) -> Dict:
    """
    股票筛选器API
    :param screener: 筛选器类型：most_actives, day_gainers, day_losers等
    :param count: 返回数量
    :return: 筛选结果
    """
    try:
        response = {"quotes": []}
        
        # 获取A股实时行情数据
        try:
            # 使用东方财富数据源获取A股实时行情
            logger.info("从东方财富获取A股实时行情数据")
            df = ak.stock_zh_a_spot_em()
            
            if df is not None and not df.empty:
                logger.info(f"成功获取行情数据，条数: {len(df)}")
                
                # 重命名列以匹配所需格式
                df = df.rename(columns={
                    "代码": "symbol",
                    "名称": "name",
                    "最新价": "price",
                    "涨跌额": "change",
                    "涨跌幅": "changePct",
                    "总市值": "marketCap",
                    "市盈率-动态": "pe",
                    "所属行业": "sector"
                })
                
                # 根据筛选类型处理数据
                if screener == "most_actives":
                    title = "交易最活跃"
                    # 按成交额排序
                    df = df.sort_values(by="成交额", ascending=False)
                elif screener == "day_gainers":
                    title = "日涨幅最大"
                    # 按涨跌幅排序（降序）
                    df = df.sort_values(by="changePct", ascending=False)
                elif screener == "day_losers":
                    title = "日跌幅最大"
                    # 按涨跌幅排序（升序）
                    df = df.sort_values(by="changePct", ascending=True)
                else:
                    title = f"筛选器: {screener}"
                    # 默认按成交额排序
                    df = df.sort_values(by="成交额", ascending=False)
                
                # 限制返回数量
                df = df.head(count)
                
                # 转换数据格式
                for _, row in df.iterrows():
                    # 格式化代码（添加市场前缀）
                    symbol = row["symbol"]
                    if symbol.startswith(("0", "3")):
                        display_symbol = f"sz{symbol}"
                    elif symbol.startswith("6"):
                        display_symbol = f"sh{symbol}"
                    else:
                        display_symbol = symbol
                        
                    # 构建股票数据
                    stock = {
                        "symbol": display_symbol,
                        "shortName": row["name"],
                        "regularMarketPrice": float(row["price"]),
                        "regularMarketChange": float(row["change"]),
                        "regularMarketChangePercent": float(row["changePct"]) / 100,  # 转换为小数
                        "regularMarketVolume": float(row["成交量"]) if "成交量" in row and not pd.isna(row["成交量"]) else 0,
                        "regularMarketDayHigh": float(row["最高"]) if "最高" in row and not pd.isna(row["最高"]) else 0,
                        "regularMarketDayLow": float(row["最低"]) if "最低" in row and not pd.isna(row["最低"]) else 0,
                        "regularMarketOpen": float(row["开盘"]) if "开盘" in row and not pd.isna(row["开盘"]) else 0,
                        "regularMarketPreviousClose": float(row["昨收"]) if "昨收" in row and not pd.isna(row["昨收"]) else 0,
                        "trailingPE": float(row["pe"]) if "pe" in row and not pd.isna(row["pe"]) else 0,
                        "marketCap": float(row["marketCap"]) if "marketCap" in row else 0,
                        "averageDailyVolume3Month": float(row["成交量"]) if "成交量" in row and not pd.isna(row["成交量"]) else 0,
                        "sector": row["sector"] if "sector" in row else "未知",
                        "currency": "CNY"
                    }
                    response["quotes"].append(stock)
                    
                logger.debug(f"处理完成，返回 {len(response['quotes'])} 条数据")
            else:
                raise Exception("获取到的数据为空")
                
        except Exception as e:
            logger.error(f"获取实时行情数据失败: {str(e)}", exc_info=True)
            # 返回错误响应
            return {
                "error": f"获取数据失败: {str(e)}",
                "quotes": [],
                "count": 0,
                "total": 0,
                "title": "数据获取失败"
            }
        
        response["title"] = title
        response["count"] = len(response["quotes"])
        response["start"] = 0
        response["total"] = len(response["quotes"])
        
        return response
    except Exception as e:
        logger.error(f"股票筛选器错误: {str(e)}", exc_info=True)
        return {
            "error": f"筛选器处理失败: {str(e)}",
            "quotes": [],
            "count": 0,
            "total": 0,
            "title": f"错误: {screener}"
        } 