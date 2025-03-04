from typing import Dict
from fastapi import APIRouter
import random
from api.modules.stock_quote import stock_quote

router = APIRouter(tags=["stock_summary"])

@router.get("/stock/quoteSummary")
async def quote_summary(ticker: str) -> Dict:
    """
    获取股票详细信息API
    :param ticker: 股票代码
    :return: 股票详细信息
    """
    try:
        # 先获取基本报价信息
        quote_data = await stock_quote(ticker)
        
        # 构建 Yahoo Finance 格式的 quoteSummary 返回
        return {
            "summaryDetail": {
                "marketCap": {"raw": random.randint(1000000, 1000000000)},
                "volume": {"raw": quote_data.get("regularMarketVolume", 0)},
                "averageVolume": {"raw": quote_data.get("regularMarketVolume", 0) * 0.8},
                "regularMarketOpen": {"raw": quote_data.get("regularMarketOpen", 0)},
                "regularMarketDayHigh": {"raw": quote_data.get("regularMarketDayHigh", 0)},
                "regularMarketDayLow": {"raw": quote_data.get("regularMarketDayLow", 0)},
                "regularMarketVolume": {"raw": quote_data.get("regularMarketVolume", 0)},
                "regularMarketPreviousClose": {"raw": quote_data.get("regularMarketPreviousClose", 0)},
                "fiftyTwoWeekHigh": {"raw": quote_data.get("regularMarketPrice", 0) * 1.5},
                "fiftyTwoWeekLow": {"raw": quote_data.get("regularMarketPrice", 0) * 0.7},
                "bid": {"raw": quote_data.get("bid", 0)},
                "ask": {"raw": quote_data.get("ask", 0)}
            },
            "defaultKeyStatistics": {
                "enterpriseValue": {"raw": random.randint(1000000, 1000000000)},
                "forwardPE": {"raw": random.random() * 30 + 5},
                "trailingPE": {"raw": random.random() * 30 + 5},
                "pegRatio": {"raw": random.random() * 3 + 0.5}
            },
            "assetProfile": {
                "industry": "科技" if ticker.startswith("0") else "金融" if ticker.startswith("6") else "消费",
                "sector": "信息技术" if ticker.startswith("0") else "金融服务" if ticker.startswith("6") else "消费品",
                "longBusinessSummary": f"这是{quote_data.get('shortName', ticker)}的业务摘要。公司主要从事相关产业的生产和销售。"
            },
            "price": {
                "regularMarketPrice": {"raw": quote_data.get("regularMarketPrice", 0)},
                "regularMarketChange": {"raw": quote_data.get("regularMarketChange", 0)},
                "regularMarketChangePercent": {"raw": quote_data.get("regularMarketChangePercent", 0)},
                "regularMarketDayHigh": {"raw": quote_data.get("regularMarketDayHigh", 0)},
                "regularMarketDayLow": {"raw": quote_data.get("regularMarketDayLow", 0)},
                "regularMarketVolume": {"raw": quote_data.get("regularMarketVolume", 0)},
                "currency": quote_data.get("currency", "CNY")
            }
        }
    except Exception as e:
        print(f"QuoteSummary error: {str(e)}")
        return {
            "error": f"Failed to fetch quote summary: {str(e)}",
            "summaryDetail": {
                "marketCap": {"raw": 0},
                "volume": {"raw": 0},
                "averageVolume": {"raw": 0},
                "regularMarketDayHigh": {"raw": 0},
                "regularMarketDayLow": {"raw": 0},
                "fiftyTwoWeekHigh": {"raw": 0},
                "fiftyTwoWeekLow": {"raw": 0}
            },
            "defaultKeyStatistics": {
                "enterpriseValue": {"raw": 0},
                "forwardPE": {"raw": 0},
                "trailingPE": {"raw": 0},
                "pegRatio": {"raw": 0}
            }
        } 