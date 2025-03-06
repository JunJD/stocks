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
    获取股票筛选器数据API
    支持的筛选类型：
    - all_stocks: 全部股票（按代码排序）
    - most_actives: 成交活跃
    - day_gainers: 涨幅前列
    - day_losers: 跌幅前列
    - small_cap_gainers: 小市值涨幅股
    - growth_technology_stocks: 科技成长股
    :param screener: 筛选类型
    :param count: 返回数量
    :return: 股票列表
    """
    logger.info(f"获取筛选器数据，类型: {screener}, 数量: {count}")
    
    response = {
        "quotes": []
    }
    
    try:
        # 全部筛选器数据基于东方财富A股行情
        logger.info("从东方财富获取A股实时行情数据")
        df = ak.stock_zh_a_spot_em()
        
        if df is not None and not df.empty:
            logger.info(f"成功获取行情数据，条数: {len(df)}")
            
            # 添加必要的字段
            df["symbol"] = df["代码"]
            df["name"] = df["名称"]
            df["price"] = df["最新价"]
            df["change"] = df["涨跌额"]
            df["changePct"] = df["涨跌幅"]
            df["pe"] = df["市盈率-动态"]
            df["marketCap"] = df["总市值"]
            
            # 按筛选类型处理数据
            if screener == "all_stocks":
                # 全部股票，按代码排序
                df = df.sort_values(by="代码")
                # 限制返回数量，但增加到100条
                df = df.head(min(count, 100))
            elif screener == "most_actives":
                # 成交活跃股
                df = df.sort_values(by="成交额", ascending=False)
                # 限制返回数量
                df = df.head(count)
            elif screener == "day_gainers":
                # 涨幅前列
                df = df.sort_values(by="涨跌幅", ascending=False)
                # 限制返回数量
                df = df.head(count)
            elif screener == "day_losers":
                # 跌幅前列
                df = df.sort_values(by="涨跌幅", ascending=True)
                # 限制返回数量
                df = df.head(count)
            elif screener == "small_cap_gainers":
                # 小市值涨幅股
                # 过滤出总市值小于300亿的股票
                small_cap_df = df[df["总市值"] < 30000000000]
                # 按涨跌幅排序
                small_cap_df = small_cap_df.sort_values(by="涨跌幅", ascending=False)
                # 限制返回数量
                df = small_cap_df.head(count)
            elif screener == "growth_technology_stocks":
                # 科技成长股 - 以计算机、通信、电子行业为主
                tech_df = df[df["所处行业"].str.contains("计算机|通信|电子|科技|互联网", na=False)]
                # 按涨跌幅排序
                tech_df = tech_df.sort_values(by="涨跌幅", ascending=False)
                # 限制返回数量
                df = tech_df.head(count)
            else:
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
                    "sector": row["所处行业"] if "所处行业" in row else "未知",
                    "currency": "CNY"
                }
                response["quotes"].append(stock)
                
            logger.debug(f"处理完成，返回 {len(response['quotes'])} 条数据")
        else:
            raise Exception("获取到的数据为空")
            
    except Exception as e:
        logger.error(f"获取筛选器数据失败: {str(e)}", exc_info=True)
        response["error"] = f"获取数据失败: {str(e)}"
        
    return response 