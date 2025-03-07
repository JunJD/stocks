from typing import Dict
from fastapi import APIRouter
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
        
        # 检查是否有数据
        if quote_data.get("_no_data", False):
            return {
                "error": "无可用数据",
                "summaryDetail": {
                    "marketCap": {"raw": 0},
                    "volume": {"raw": 0},
                    "averageVolume": {"raw": 0},
                    "regularMarketOpen": {"raw": 0},
                    "regularMarketDayHigh": {"raw": 0},
                    "regularMarketDayLow": {"raw": 0},
                    "regularMarketVolume": {"raw": 0},
                    "regularMarketPreviousClose": {"raw": 0},
                    "fiftyTwoWeekHigh": {"raw": 0},
                    "fiftyTwoWeekLow": {"raw": 0},
                    "bid": {"raw": 0},
                    "ask": {"raw": 0}
                },
                "defaultKeyStatistics": {
                    "enterpriseValue": {"raw": 0},
                    "forwardPE": {"raw": 0},
                    "trailingPE": {"raw": 0},
                    "pegRatio": {"raw": 0}
                },
                "assetProfile": {
                    "industry": "",
                    "sector": "",
                    "longBusinessSummary": ""
                },
                "price": {
                    "regularMarketPrice": {"raw": 0},
                    "regularMarketChange": {"raw": 0},
                    "regularMarketChangePercent": {"raw": 0},
                    "regularMarketDayHigh": {"raw": 0},
                    "regularMarketDayLow": {"raw": 0},
                    "regularMarketVolume": {"raw": 0},
                    "currency": "CNY"
                }
            }
        
        # 构建 Yahoo Finance 格式的 quoteSummary 返回
        return {
            "summaryDetail": {
                "marketCap": {"raw": quote_data.get("marketCap", 0)},
                "volume": {"raw": quote_data.get("regularMarketVolume", 0)},
                "averageVolume": {"raw": quote_data.get("averageDailyVolume3Month", 0)},
                "regularMarketOpen": {"raw": quote_data.get("regularMarketOpen", 0)},
                "regularMarketDayHigh": {"raw": quote_data.get("regularMarketDayHigh", 0)},
                "regularMarketDayLow": {"raw": quote_data.get("regularMarketDayLow", 0)},
                "regularMarketVolume": {"raw": quote_data.get("regularMarketVolume", 0)},
                "regularMarketPreviousClose": {"raw": quote_data.get("regularMarketPreviousClose", 0)},
                "fiftyTwoWeekHigh": {"raw": quote_data.get("fiftyTwoWeekHigh", 0)},
                "fiftyTwoWeekLow": {"raw": quote_data.get("fiftyTwoWeekLow", 0)},
                "bid": {"raw": quote_data.get("bid", 0)},
                "ask": {"raw": quote_data.get("ask", 0)}
            },
            "defaultKeyStatistics": {
                "enterpriseValue": {"raw": quote_data.get("marketCap", 0)},
                "forwardPE": {"raw": quote_data.get("forwardPE", 0)},
                "trailingPE": {"raw": quote_data.get("trailingPE", 0)},
                "pegRatio": {"raw": 0}
            },
            "assetProfile": {
                "industry": "未知",
                "sector": "未知",
                "longBusinessSummary": ""
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
            "error": f"获取摘要失败: {str(e)}",
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