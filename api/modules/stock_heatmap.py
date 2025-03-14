from typing import Dict, List
from fastapi import APIRouter, Query
import pandas as pd
import akshare as ak
from .utils.logger import get_logger

# 创建logger实例
logger = get_logger(__name__)

router = APIRouter(tags=["stock_heatmap"])

@router.get("/stock/heatmap")
async def stock_heatmap(type: str = "all") -> Dict:
    """
    获取股票热力图数据
    :param type: 热力图类型，可选all(全市场), industry(行业板块), concept(概念板块)
    :return: 热力图数据
    """
    logger.info(f"接收到热力图数据请求: 类型={type}")
    
    try:
        response = {
            "success": True,
            "message": "获取热力图数据成功",
            "sectors": []
        }
        
        if type == "industry":
            # 获取行业板块涨跌幅数据
            df_industry = ak.stock_sector_spot_em()
            for _, group in df_industry.groupby("板块名称"):
                sector_name = group["板块名称"].iloc[0]
                sector_change = float(group["涨跌幅"].iloc[0].replace("%", ""))
                
                # 获取该行业的个股
                sector_stocks = []
                stock_list = ak.stock_board_industry_cons_em(symbol=sector_name)
                if not stock_list.empty:
                    # 获取个股行情
                    codes = stock_list["代码"].tolist()
                    stock_quotes = ak.stock_zh_a_spot_em()
                    stock_quotes = stock_quotes[stock_quotes["代码"].isin(codes)]
                    
                    # 明确转换为Python原生类型
                    total_market_cap = float(stock_quotes["总市值"].sum())
                    
                    for _, row in stock_quotes.iterrows():
                        symbol = row["代码"]
                        prefix = "sh" if symbol.startswith("6") else "sz"
                        sector_stocks.append({
                            "symbol": f"{prefix}{symbol}",
                            "name": str(row["名称"]),
                            "price": float(row["最新价"]),
                            "change": float(row["涨跌额"]),
                            "changePct": float(row["涨跌幅"]),
                            "marketCap": float(row["总市值"]),
                            "sector": str(sector_name)
                        })
                
                response["sectors"].append({
                    "name": str(sector_name),
                    "changePct": float(sector_change),
                    "stocks": sector_stocks,
                    "totalMarketCap": float(total_market_cap)
                })
                
        elif type == "concept":
            # 获取概念板块涨跌幅数据
            df_concept = ak.stock_board_concept_name_em()
            
            # 处理前10个概念板块（为了性能）
            for index, row in df_concept.head(10).iterrows():
                concept_name = str(row["板块名称"])
                concept_change = float(row["涨跌幅"].replace("%", ""))
                
                # 获取该概念的个股
                sector_stocks = []
                try:
                    stock_list = ak.stock_board_concept_cons_em(symbol=concept_name)
                    if not stock_list.empty:
                        # 获取个股行情
                        codes = stock_list["代码"].tolist()
                        stock_quotes = ak.stock_zh_a_spot_em()
                        stock_quotes = stock_quotes[stock_quotes["代码"].isin(codes)]
                        
                        # 明确转换为Python原生类型
                        total_market_cap = float(stock_quotes["总市值"].sum())
                        
                        for _, stock_row in stock_quotes.iterrows():
                            symbol = stock_row["代码"]
                            prefix = "sh" if symbol.startswith("6") else "sz"
                            sector_stocks.append({
                                "symbol": f"{prefix}{symbol}",
                                "name": str(stock_row["名称"]),
                                "price": float(stock_row["最新价"]),
                                "change": float(stock_row["涨跌额"]),
                                "changePct": float(stock_row["涨跌幅"]),
                                "marketCap": float(stock_row["总市值"]),
                                "sector": str(concept_name)
                            })
                            
                    response["sectors"].append({
                        "name": str(concept_name),
                        "changePct": float(concept_change),
                        "stocks": sector_stocks,
                        "totalMarketCap": float(total_market_cap)
                    })
                except Exception as e:
                    logger.warning(f"获取概念板块 {concept_name} 数据失败: {str(e)}")
                
        else:  # 全市场热力图
            # 获取A股行情数据，按总市值分组
            stock_quotes = ak.stock_zh_a_spot_em()
            
            # 创建市值区间分组
            market_cap_groups = [
                {"name": "超大市值", "min": 1000, "max": float('inf')},
                {"name": "大市值", "min": 500, "max": 1000},
                {"name": "中大市值", "min": 100, "max": 500},
                {"name": "中小市值", "min": 50, "max": 100},
                {"name": "小市值", "min": 10, "max": 50},
                {"name": "微小市值", "min": 0, "max": 10}
            ]
            
            # 转换总市值为数值类型
            stock_quotes["总市值"] = pd.to_numeric(stock_quotes["总市值"], errors='coerce')
            
            # 按市值分组
            for group in market_cap_groups:
                filtered_stocks = stock_quotes[
                    (stock_quotes["总市值"] >= group["min"]) & 
                    (stock_quotes["总市值"] < group["max"])
                ]
                
                if filtered_stocks.empty:
                    continue
                    
                sector_stocks = []
                # 明确转换为Python原生类型
                total_market_cap = float(filtered_stocks["总市值"].sum())
                avg_change = float(filtered_stocks["涨跌幅"].mean())
                
                # 取该组中市值前30的股票
                top_stocks = filtered_stocks.nlargest(30, "总市值")
                
                for _, row in top_stocks.iterrows():
                    symbol = row["代码"]
                    prefix = "sh" if symbol.startswith("6") else "sz"
                    sector_stocks.append({
                        "symbol": f"{prefix}{symbol}",
                        "name": str(row["名称"]),
                        "price": float(row["最新价"]),
                        "change": float(row["涨跌额"]),
                        "changePct": float(row["涨跌幅"]),
                        "marketCap": float(row["总市值"]),
                    })
                
                response["sectors"].append({
                    "name": str(group["name"]),
                    "changePct": float(avg_change),
                    "stocks": sector_stocks,
                    "totalMarketCap": float(total_market_cap)
                })
        
        logger.info(f"热力图数据获取成功，共{len(response['sectors'])}个板块")
        return response
        
    except Exception as e:
        logger.error(f"获取热力图数据异常: {str(e)}", exc_info=True)
        return {
            "success": False,
            "message": f"获取热力图数据失败: {str(e)}",
            "sectors": []
        }