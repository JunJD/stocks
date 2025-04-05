from typing import Dict, List
from fastapi import APIRouter, Query
import pandas as pd
import time
from .utils.logger import get_logger
from .utils.stock_data_fetcher import fetch_industry_heatmap, fetch_sh50_stocks

# 创建logger实例
logger = get_logger(__name__)

router = APIRouter(tags=["stock_heatmap"])

@router.get("/stock/heatmap")
async def stock_heatmap(type: str = "all") -> Dict:
    """
    获取股票热力图数据
    :param type: 热力图类型，可选all(全市场), industry(行业板块), sh50(上证50)
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
            # 获取行业板块热力图数据 - 从20条增加到50条
            df_industry, _ = fetch_industry_heatmap(count=50)
            
            if not df_industry.empty:
                # 生成行业板块数据
                industry_groups = {}
                
                for _, row in df_industry.iterrows():
                    industry_name = row["板块名称"]
                    industry_change = row["涨跌幅"]
                    
                    # 收集该行业的股票
                    industry_stocks = []
                    industry_stocks.append({
                        "symbol": row["板块代码"],
                        "name": industry_name,
                        "price": float(row["指数"]),
                        "change": 0.0,  # 没有直接提供涨跌额，这里可以留空
                        "changePct": float(industry_change),
                        "marketCap": float(abs(row["主力净流入"])),  # 用主力净流入绝对值作为市值参考
                        "sector": "行业板块"
                    })
                    
                    # 添加领涨股
                    lead_stock = {
                        "symbol": row["领涨股票代码"],
                        "name": row["领涨股票"],
                        "price": 0.0,  # 没有价格信息
                        "change": 0.0, 
                        "changePct": 0.0,
                        "marketCap": float(abs(row["主力净流入"]) * 0.5),  # 估算
                        "sector": industry_name
                    }
                    industry_stocks.append(lead_stock)
                    
                    response["sectors"].append({
                        "name": industry_name,
                        "changePct": float(industry_change),
                        "stocks": industry_stocks,
                        "totalMarketCap": float(abs(row["主力净流入"])),
                        "netInflow": float(row["主力净流入"]),
                        "netInflowRatio": float(row["主力净流入占比"]) if "主力净流入占比" in row else 0.0
                    })
                
        elif type == "sh50":
            # 获取上证50成分股数据
            df_sh50, _ = fetch_sh50_stocks()
            
            if not df_sh50.empty:
                # 上证50作为一个整体板块
                sh50_stocks = []
                
                # 计算总市值和平均涨跌幅
                if "总市值" in df_sh50.columns:
                    total_market_cap = float(df_sh50["总市值"].sum())
                    avg_change = float(df_sh50["涨跌幅"].mean())
                else:
                    # 如果没有总市值列，使用成交额的10倍作为估计
                    total_market_cap = float(df_sh50["成交额"].sum() * 10)
                    avg_change = float(df_sh50["涨跌幅"].mean())
                
                for _, row in df_sh50.iterrows():
                    symbol = row["代码"]
                    prefix = "sh" if symbol.startswith("6") else "sz"
                    market_cap = float(row["总市值"]) if "总市值" in row else float(row["成交额"] * 10)
                    
                    sh50_stocks.append({
                        "symbol": f"{prefix}{symbol}",
                        "name": str(row["名称"]),
                        "price": float(row["最新价"]),
                        "change": float(row["涨跌额"]),
                        "changePct": float(row["涨跌幅"]),
                        "marketCap": market_cap,
                        "sector": "上证50"
                    })
                
                response["sectors"].append({
                    "name": "上证50",
                    "changePct": avg_change,
                    "stocks": sh50_stocks,
                    "totalMarketCap": total_market_cap
                })
                
        else:  # 默认全市场热力图，同时包含行业和上证50
            df_industry, _ = fetch_industry_heatmap(count=30)
            
            if not df_industry.empty:
                for _, row in df_industry.iterrows():
                    industry_name = row["板块名称"]
                    industry_change = row["涨跌幅"]
                    
                    industry_stocks = []
                    industry_stocks.append({
                        "symbol": row["板块代码"],
                        "name": industry_name,
                        "price": float(row["指数"]),
                        "change": 0.0,
                        "changePct": float(industry_change),
                        "marketCap": float(abs(row["主力净流入"])),
                        "sector": "行业板块"
                    })
                    
                    # 添加领涨股
                    lead_stock = {
                        "symbol": row["领涨股票代码"],
                        "name": row["领涨股票"],
                        "price": 0.0,
                        "change": 0.0,
                        "changePct": 0.0,
                        "marketCap": float(abs(row["主力净流入"]) * 0.5),
                        "sector": industry_name
                    }
                    industry_stocks.append(lead_stock)
                    
                    response["sectors"].append({
                        "name": industry_name,
                        "changePct": float(industry_change),
                        "stocks": industry_stocks,
                        "totalMarketCap": float(abs(row["主力净流入"])),
                        "netInflow": float(row["主力净流入"])
                    })
            
            # 获取上证50数据
            df_sh50, _ = fetch_sh50_stocks(count=15)  # 限制为前15只
            
            if not df_sh50.empty:
                sh50_stocks = []
                
                if "总市值" in df_sh50.columns:
                    total_market_cap = float(df_sh50["总市值"].sum())
                    avg_change = float(df_sh50["涨跌幅"].mean())
                else:
                    total_market_cap = float(df_sh50["成交额"].sum() * 10)
                    avg_change = float(df_sh50["涨跌幅"].mean())
                
                for _, row in df_sh50.iterrows():
                    symbol = row["代码"]
                    prefix = "sh" if symbol.startswith("6") else "sz"
                    market_cap = float(row["总市值"]) if "总市值" in row else float(row["成交额"] * 10)
                    
                    sh50_stocks.append({
                        "symbol": f"{prefix}{symbol}",
                        "name": str(row["名称"]),
                        "price": float(row["最新价"]),
                        "change": float(row["涨跌额"]),
                        "changePct": float(row["涨跌幅"]),
                        "marketCap": market_cap,
                        "sector": "上证50"
                    })
                
                response["sectors"].append({
                    "name": "上证50",
                    "changePct": avg_change,
                    "stocks": sh50_stocks,
                    "totalMarketCap": total_market_cap
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